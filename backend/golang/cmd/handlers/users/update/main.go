package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/google/uuid"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type UpdateUserRequest struct {
	Name   *string `json:"name,omitempty"`
	Email  *string `json:"email,omitempty"`
	Status *string `json:"status,omitempty"`
}

type User struct {
	UserID           string          `json:"userId" dynamodbav:"userId"`
	CognitoUserID    string          `json:"cognitoUserId,omitempty" dynamodbav:"cognitoUserId"`
	Email            string          `json:"email" dynamodbav:"email"`
	Name             string          `json:"name" dynamodbav:"name"`
	Status           string          `json:"status" dynamodbav:"status"`
	CurrentAccountID string          `json:"currentAccountId,omitempty" dynamodbav:"currentAccountId"`
	Preferences      UserPreferences `json:"preferences,omitempty" dynamodbav:"preferences"`
	CreatedAt        string          `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        string          `json:"updatedAt" dynamodbav:"updatedAt"`
}

type UserPreferences struct {
	Timezone      string               `json:"timezone" dynamodbav:"timezone"`
	Theme         string               `json:"theme" dynamodbav:"theme"`
	Notifications NotificationSettings `json:"notifications" dynamodbav:"notifications"`
}

type NotificationSettings struct {
	Email           bool `json:"email" dynamodbav:"email"`
	SMS             bool `json:"sms" dynamodbav:"sms"`
	InApp           bool `json:"inApp" dynamodbav:"inApp"`
	BackupCompleted bool `json:"backupCompleted" dynamodbav:"backupCompleted"`
	BackupFailed    bool `json:"backupFailed" dynamodbav:"backupFailed"`
	StorageAlerts   bool `json:"storageAlerts" dynamodbav:"storageAlerts"`
}

type UserAccount struct {
	UserID      string      `dynamodbav:"userId"`
	AccountID   string      `dynamodbav:"accountId"`
	Role        string      `dynamodbav:"role"`
	Permissions Permissions `dynamodbav:"permissions"`
	JoinedAt    time.Time   `dynamodbav:"joinedAt"`
	IsActive    bool        `dynamodbav:"isActive"`
}

type Permissions struct {
	ManageUsers        bool `dynamodbav:"manageUsers" json:"manageUsers"`
	ManageSettings     bool `dynamodbav:"manageSettings" json:"manageSettings"`
	ManageBilling      bool `dynamodbav:"manageBilling" json:"manageBilling"`
	ViewReports        bool `dynamodbav:"viewReports" json:"viewReports"`
	ManageIntegrations bool `dynamodbav:"manageIntegrations" json:"manageIntegrations"`
}

type Activity struct {
	EventID   string `json:"eventId" dynamodbav:"eventId"`
	AccountID string `json:"accountId" dynamodbav:"accountId"`
	UserID    string `json:"userId" dynamodbav:"userId"`
	Type      string `json:"type" dynamodbav:"type"`
	Action    string `json:"action" dynamodbav:"action"`
	Status    string `json:"status" dynamodbav:"status"`
	Message   string `json:"message" dynamodbav:"message"`
	Timestamp int64  `json:"timestamp" dynamodbav:"timestamp"`
	TTL       int64  `json:"ttl" dynamodbav:"ttl"`
}

var (
	usersTable        = os.Getenv("USERS_TABLE")
	userAccountsTable = os.Getenv("USER_ACCOUNTS_TABLE")
	activitiesTable   = os.Getenv("ACTIVITIES_TABLE")
	cognitoRegion     = os.Getenv("COGNITO_REGION")
	cognitoUserPoolID = os.Getenv("COGNITO_USER_POOL_ID")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Update user called with method: %s", event.RequestContext.HTTP.Method)

	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "PUT, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract requesting user ID from authorizer context
	requestingUserID := extractUserID(event)
	if requestingUserID == "" {
		return createErrorResponse(401, "Unauthorized"), nil
	}

	// Check admin permissions
	hasPermission, requestingAccountID, err := checkAdminPermission(requestingUserID)
	if err != nil {
		log.Printf("Error checking permissions: %v", err)
		return createErrorResponse(500, "Failed to check permissions"), nil
	}
	if !hasPermission {
		return createErrorResponse(403, "Forbidden: Admin access required"), nil
	}

	// Get user ID from path parameters
	targetUserID := event.PathParameters["userId"]
	if targetUserID == "" {
		return createErrorResponse(400, "User ID is required"), nil
	}

	// Ensure proper format
	if !strings.HasPrefix(targetUserID, "user:") {
		targetUserID = fmt.Sprintf("user:%s", targetUserID)
	}

	// Parse update request
	var updateReq UpdateUserRequest
	if err := json.Unmarshal([]byte(event.Body), &updateReq); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate update request
	if updateReq.Name == nil && updateReq.Email == nil && updateReq.Status == nil {
		return createErrorResponse(400, "No fields to update"), nil
	}

	// Validate status if provided
	if updateReq.Status != nil {
		validStatuses := map[string]bool{
			"active":    true,
			"inactive":  true,
			"suspended": true,
		}
		if !validStatuses[*updateReq.Status] {
			return createErrorResponse(400, "Invalid status. Must be one of: active, inactive, suspended"), nil
		}
	}

	// Create session
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Get current user
	currentUser, err := getUser(svc, targetUserID)
	if err != nil {
		if err.Error() == "user not found" {
			return createErrorResponse(404, "User not found"), nil
		}
		log.Printf("Error getting user: %v", err)
		return createErrorResponse(500, "Failed to get user"), nil
	}

	// Check email uniqueness if email is being changed
	if updateReq.Email != nil && *updateReq.Email != currentUser.Email {
		exists, err := checkEmailExists(svc, *updateReq.Email)
		if err != nil {
			log.Printf("Error checking email uniqueness: %v", err)
			return createErrorResponse(500, "Failed to check email availability"), nil
		}
		if exists {
			return createErrorResponse(400, "Email already in use"), nil
		}
	}

	// Update user in DynamoDB
	updatedUser, err := updateUserInDynamoDB(svc, targetUserID, updateReq, currentUser)
	if err != nil {
		log.Printf("Error updating user in DynamoDB: %v", err)
		return createErrorResponse(500, "Failed to update user"), nil
	}

	// Update Cognito attributes if email or name changed
	if (updateReq.Email != nil && *updateReq.Email != currentUser.Email) ||
		(updateReq.Name != nil && *updateReq.Name != currentUser.Name) {
		err = updateCognitoAttributes(currentUser.CognitoUserID, updateReq)
		if err != nil {
			log.Printf("Error updating Cognito attributes: %v", err)
			// Don't fail the request if Cognito update fails, but log it
		}
	}

	// Log activity
	logUserActivity(requestingUserID, requestingAccountID, targetUserID, "user.updated",
		fmt.Sprintf("Updated user %s", strings.TrimPrefix(targetUserID, "user:")))

	response := Response{
		Success: true,
		Data:    updatedUser,
		Message: "User updated successfully",
	}

	return createSuccessResponse(response), nil
}

func extractUserID(event events.APIGatewayV2HTTPRequest) string {
	if event.RequestContext.Authorizer != nil {
		if jwt := event.RequestContext.Authorizer.JWT; jwt != nil {
			if sub, ok := jwt.Claims["sub"]; ok {
				return fmt.Sprintf("user:%s", sub)
			}
		}
		if lambda := event.RequestContext.Authorizer.Lambda; lambda != nil {
			if userID, ok := lambda["userId"].(string); ok {
				return userID
			}
		}
	}
	return ""
}

func checkAdminPermission(userID string) (bool, string, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Query user's accounts to check for admin role
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("userId").Equal(expression.Value(userID))).
		Build()
	if err != nil {
		return false, "", err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return false, "", err
	}

	var accountID string
	for _, item := range result.Items {
		var userAccount UserAccount
		if err := dynamodbattribute.UnmarshalMap(item, &userAccount); err != nil {
			continue
		}
		if userAccount.Role == "admin" || userAccount.Role == "owner" || userAccount.Permissions.ManageUsers {
			accountID = userAccount.AccountID
			return true, accountID, nil
		}
	}

	return false, "", nil
}

func getUser(svc *dynamodb.DynamoDB, userID string) (*User, error) {
	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {
				S: aws.String(userID),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("user not found")
	}

	var user User
	if err := dynamodbattribute.UnmarshalMap(result.Item, &user); err != nil {
		return nil, err
	}

	return &user, nil
}

func checkEmailExists(svc *dynamodb.DynamoDB, email string) (bool, error) {
	// Query EmailIndex GSI
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("email").Equal(expression.Value(email))).
		Build()
	if err != nil {
		return false, err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(usersTable),
		IndexName:                 aws.String("EmailIndex"),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		Limit:                     aws.Int64(1),
	})
	if err != nil {
		return false, err
	}

	return len(result.Items) > 0, nil
}

func updateUserInDynamoDB(svc *dynamodb.DynamoDB, userID string, req UpdateUserRequest, currentUser *User) (*User, error) {
	// Build update expression
	updateBuilder := expression.UpdateBuilder{}
	updateBuilder = updateBuilder.Set(expression.Name("updatedAt"), expression.Value(time.Now().Format(time.RFC3339)))

	if req.Name != nil {
		updateBuilder = updateBuilder.Set(expression.Name("name"), expression.Value(*req.Name))
		currentUser.Name = *req.Name
	}
	if req.Email != nil {
		updateBuilder = updateBuilder.Set(expression.Name("email"), expression.Value(*req.Email))
		currentUser.Email = *req.Email
	}
	if req.Status != nil {
		updateBuilder = updateBuilder.Set(expression.Name("status"), expression.Value(*req.Status))
		currentUser.Status = *req.Status
	}

	expr, err := expression.NewBuilder().
		WithUpdate(updateBuilder).
		Build()
	if err != nil {
		return nil, err
	}

	_, err = svc.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {
				S: aws.String(userID),
			},
		},
		UpdateExpression:          expr.Update(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return nil, err
	}

	currentUser.UpdatedAt = time.Now().Format(time.RFC3339)
	return currentUser, nil
}

func updateCognitoAttributes(cognitoUserID string, req UpdateUserRequest) error {
	if cognitoUserID == "" {
		log.Printf("No Cognito user ID, skipping Cognito update")
		return nil
	}

	sess := session.Must(session.NewSession())
	cognitoClient := cognitoidentityprovider.New(sess, aws.NewConfig().WithRegion(cognitoRegion))

	var attributes []*cognitoidentityprovider.AttributeType

	if req.Email != nil {
		attributes = append(attributes, &cognitoidentityprovider.AttributeType{
			Name:  aws.String("email"),
			Value: aws.String(*req.Email),
		})
	}

	if req.Name != nil {
		attributes = append(attributes, &cognitoidentityprovider.AttributeType{
			Name:  aws.String("name"),
			Value: aws.String(*req.Name),
		})
	}

	if len(attributes) == 0 {
		return nil
	}

	_, err := cognitoClient.AdminUpdateUserAttributes(&cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserPoolId:     aws.String(cognitoUserPoolID),
		Username:       aws.String(cognitoUserID),
		UserAttributes: attributes,
	})

	return err
}

func logUserActivity(userID, accountID, targetUserID, action, message string) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	activity := Activity{
		EventID:   fmt.Sprintf("activity:%s", uuid.New().String()),
		AccountID: accountID,
		UserID:    userID,
		Type:      "user",
		Action:    action,
		Status:    "success",
		Message:   message,
		Timestamp: time.Now().Unix(),
		TTL:       time.Now().Add(90 * 24 * time.Hour).Unix(), // 90 days retention
	}

	av, err := dynamodbattribute.MarshalMap(activity)
	if err != nil {
		log.Printf("Failed to marshal activity: %v", err)
		return
	}

	_, err = svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(activitiesTable),
		Item:      av,
	})
	if err != nil {
		log.Printf("Failed to log activity: %v", err)
	}
}

func createSuccessResponse(data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := Response{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func main() {
	lambda.Start(Handle)
}