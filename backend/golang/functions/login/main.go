package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	cognitotypes "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	eventbridgetypes "github.com/aws/aws-sdk-go-v2/service/eventbridge/types"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
	"github.com/listbackup/api/pkg/utils"
)

var (
	cognitoUserPoolID = os.Getenv("COGNITO_USER_POOL_ID")
	cognitoClientID   = os.Getenv("COGNITO_CLIENT_ID")
	eventBusName      = os.Getenv("EVENT_BUS_NAME")
)

type LoginHandler struct {
	db          *database.DynamoDBClient
	awsClients  *utils.AWSClients
}

func NewLoginHandler(ctx context.Context) (*LoginHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create DynamoDB client: %v", err)
	}

	awsClients, err := utils.NewAWSClients(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS clients: %v", err)
	}

	return &LoginHandler{
		db:         db,
		awsClients: awsClients,
	}, nil
}

func (h *LoginHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Login request: %s", event.Body)

	var loginReq apitypes.LoginRequest
	if err := json.Unmarshal([]byte(event.Body), &loginReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return response.BadRequest("Invalid JSON format in request body"), nil
	}

	if loginReq.Email == "" || loginReq.Password == "" {
		return response.BadRequest("Email and password are required"), nil
	}

	// Authenticate with Cognito
	authParams := map[string]string{
		"USERNAME": strings.ToLower(loginReq.Email),
		"PASSWORD": loginReq.Password,
	}

	// Add MFA code if provided
	if loginReq.MFACode != "" {
		authParams["SOFTWARE_TOKEN_MFA_CODE"] = loginReq.MFACode
	}

	authInput := &cognitoidentityprovider.AdminInitiateAuthInput{
		UserPoolId:     aws.String(cognitoUserPoolID),
		ClientId:       aws.String(cognitoClientID),
		AuthFlow:       cognitotypes.AuthFlowTypeAdminNoSrpAuth,
		AuthParameters: authParams,
	}

	authResult, err := h.awsClients.CognitoClient.AdminInitiateAuth(ctx, authInput)
	if err != nil {
		log.Printf("Cognito authentication error: %v", err)
		return h.handleAuthError(err), nil
	}

	// Handle MFA challenge
	if authResult.ChallengeName == cognitotypes.ChallengeNameTypeSoftwareTokenMfa {
		return response.MFARequired(aws.ToString(authResult.Session)), nil
	}

	// Get user details from Cognito
	getUserInput := &cognitoidentityprovider.AdminGetUserInput{
		UserPoolId: aws.String(cognitoUserPoolID),
		Username:   aws.String(strings.ToLower(loginReq.Email)),
	}

	cognitoUser, err := h.awsClients.CognitoClient.AdminGetUser(ctx, getUserInput)
	if err != nil {
		log.Printf("Failed to get Cognito user: %v", err)
		return response.InternalServerError("Failed to get user details"), nil
	}

	userAttributes := make(map[string]string)
	for _, attr := range cognitoUser.UserAttributes {
		userAttributes[aws.ToString(attr.Name)] = aws.ToString(attr.Value)
	}

	// Get or create user record in DynamoDB
	userID := fmt.Sprintf("user:%s", userAttributes["sub"])
	user, err := h.getUserFromDynamoDB(ctx, userID)
	if err != nil {
		// Create user record if it doesn't exist
		user, err = h.createUserRecord(ctx, userID, userAttributes)
		if err != nil {
			log.Printf("Failed to create user record: %v", err)
			return response.InternalServerError("Failed to create user record"), nil
		}
	}

	// Use Cognito tokens directly
	accessToken := aws.ToString(authResult.AuthenticationResult.AccessToken)
	idToken := aws.ToString(authResult.AuthenticationResult.IdToken)
	refreshToken := aws.ToString(authResult.AuthenticationResult.RefreshToken)
	expiresIn := int(authResult.AuthenticationResult.ExpiresIn)

	// Update user's last login
	timestamp := time.Now()
	err = h.updateLastLogin(ctx, user.UserID, timestamp)
	if err != nil {
		log.Printf("Failed to update last login: %v", err)
	}

	// Log successful login
	err = h.logActivity(ctx, user.AccountID, user.UserID, "auth", "login_success", "User logged in successfully")
	if err != nil {
		log.Printf("Failed to log activity: %v", err)
	}

	// Publish login event
	if eventBusName != "" {
		err = h.publishLoginEvent(ctx, user, timestamp)
		if err != nil {
			log.Printf("Failed to publish login event: %v", err)
		}
	}

	// Prepare response
	loginResponse := apitypes.LoginResponse{
		AccessToken:  accessToken,
		IDToken:      idToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		TokenType:    "Bearer",
		User: apitypes.UserInfo{
			UserID:        user.UserID,
			Email:         user.Email,
			Name:          user.Name,
			AccountID:     user.AccountID,
			Role:          user.Role,
			MFAEnabled:    len(cognitoUser.MFAOptions) > 0,
			EmailVerified: userAttributes["email_verified"] == "true",
		},
	}

	return response.Success(loginResponse), nil
}

func (h *LoginHandler) handleAuthError(err error) events.APIGatewayProxyResponse {
	if err == nil {
		return response.InternalServerError("Unknown authentication error")
	}

	errStr := err.Error()
	if strings.Contains(errStr, "NotAuthorizedException") {
		return response.Unauthorized("Invalid credentials")
	} else if strings.Contains(errStr, "UserNotConfirmedException") {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers:    response.GetCORSHeaders(),
			Body:       `{"success": false, "error": "Email not verified", "requiresVerification": true}`,
		}
	} else if strings.Contains(errStr, "SOFTWARE_TOKEN_MFA_NOT_FOUND") {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers:    response.GetCORSHeaders(),
			Body:       `{"success": false, "requiresMfa": true, "message": "MFA code required"}`,
		}
	}

	return response.InternalServerError("Authentication failed")
}

func (h *LoginHandler) getUserFromDynamoDB(ctx context.Context, userID string) (*apitypes.User, error) {
	key := map[string]types.AttributeValue{
		"userId": &types.AttributeValueMemberS{Value: userID},
	}

	var user apitypes.User
	err := h.db.GetItem(ctx, database.UsersTable, key, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (h *LoginHandler) createUserRecord(ctx context.Context, userID string, userAttributes map[string]string) (*apitypes.User, error) {
	accountID := fmt.Sprintf("account:%s", userAttributes["sub"])
	timestamp := time.Now()

	// Create account first
	account := apitypes.Account{
		AccountID:    accountID,
		UserID:       userID,
		Name:         fmt.Sprintf("%s's Account", getNameOrEmail(userAttributes)),
		Plan:         "free",
		Status:       "trial",
		BillingEmail: userAttributes["email"],
		CreatedAt:    timestamp,
		UpdatedAt:    timestamp,
		Settings: apitypes.AccountSettings{
			MaxSources:        3,
			MaxStorageGB:      5,
			MaxBackupJobs:     5,
			RetentionDays:     30,
			EncryptionEnabled: true,
			TwoFactorRequired: false,
		},
		Usage: apitypes.AccountUsage{
			Sources:              0,
			StorageUsedGB:        0,
			BackupJobs:           0,
			MonthlyBackups:       0,
			MonthlyAPIRequests:   0,
		},
	}

	// Create user record
	user := apitypes.User{
		UserID:        userID,
		CognitoUserID: userAttributes["sub"],
		Email:         userAttributes["email"],
		Name:          getNameOrEmail(userAttributes),
		AccountID:     accountID,
		Role:          "owner",
		Status:        "active",
		CreatedAt:     timestamp,
		UpdatedAt:     timestamp,
		LastLoginAt:   &timestamp,
		Preferences: apitypes.UserPreferences{
			Timezone: "UTC",
			Notifications: apitypes.NotificationSettings{
				Email:          true,
				Slack:          false,
				BackupComplete: true,
				BackupFailed:   true,
				WeeklyReport:   true,
			},
			Theme: "auto",
		},
	}

	// Create transaction items
	accountAV, err := attributevalue.MarshalMap(account)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal account: %v", err)
	}

	userAV, err := attributevalue.MarshalMap(user)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal user: %v", err)
	}

	transactItems := []types.TransactWriteItem{
		{
			Put: &types.Put{
				TableName:           aws.String(database.AccountsTable),
				Item:                accountAV,
				ConditionExpression: aws.String("attribute_not_exists(accountId)"),
			},
		},
		{
			Put: &types.Put{
				TableName:           aws.String(database.UsersTable),
				Item:                userAV,
				ConditionExpression: aws.String("attribute_not_exists(userId)"),
			},
		},
	}

	err = h.db.TransactWrite(ctx, transactItems)
	if err != nil {
		return nil, fmt.Errorf("failed to create user and account: %v", err)
	}

	return &user, nil
}

func (h *LoginHandler) updateLastLogin(ctx context.Context, userID string, timestamp time.Time) error {
	key := map[string]types.AttributeValue{
		"userId": &types.AttributeValueMemberS{Value: userID},
	}

	updateExpression := "SET lastLoginAt = :timestamp"
	expressionAttributeValues := map[string]types.AttributeValue{
		":timestamp": &types.AttributeValueMemberS{Value: timestamp.Format(time.RFC3339)},
	}

	return h.db.UpdateItem(ctx, database.UsersTable, key, updateExpression, expressionAttributeValues)
}

func (h *LoginHandler) logActivity(ctx context.Context, accountID, userID, activityType, action, message string) error {
	eventID := fmt.Sprintf("activity:%d:%s", time.Now().UnixNano()/1000000, generateRandomString(9))
	timestamp := time.Now().UnixNano() / 1000000 // Unix timestamp in milliseconds
	ttl := time.Now().Add(90 * 24 * time.Hour).Unix()

	activity := apitypes.Activity{
		EventID:   eventID,
		AccountID: accountID,
		UserID:    userID,
		Type:      activityType,
		Action:    action,
		Status:    getStatusFromAction(action),
		Message:   message,
		Timestamp: timestamp,
		TTL:       ttl,
	}

	return h.db.PutItem(ctx, database.ActivityTable, activity)
}

func (h *LoginHandler) publishLoginEvent(ctx context.Context, user *apitypes.User, timestamp time.Time) error {
	eventDetail := map[string]interface{}{
		"userId":    user.UserID,
		"accountId": user.AccountID,
		"email":     user.Email,
		"timestamp": timestamp.Format(time.RFC3339),
	}

	detailJSON, err := json.Marshal(eventDetail)
	if err != nil {
		return fmt.Errorf("failed to marshal event detail: %v", err)
	}

	input := &eventbridge.PutEventsInput{
		Entries: []eventbridgetypes.PutEventsRequestEntry{
			{
				Source:       aws.String("listbackup.auth"),
				DetailType:   aws.String("User Login"),
				Detail:       aws.String(string(detailJSON)),
				EventBusName: aws.String(eventBusName),
			},
		},
	}

	_, err = h.awsClients.EventBridgeClient.PutEvents(ctx, input)
	return err
}

func getNameOrEmail(userAttributes map[string]string) string {
	if name, exists := userAttributes["name"]; exists && name != "" {
		return name
	}
	if email, exists := userAttributes["email"]; exists {
		parts := strings.Split(email, "@")
		if len(parts) > 0 {
			return parts[0]
		}
	}
	return "User"
}

func getStatusFromAction(action string) string {
	if strings.Contains(action, "failed") {
		return "error"
	}
	return "success"
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func main() {
	handler, err := NewLoginHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create login handler: %v", err)
	}

	lambda.Start(handler.Handle)
}