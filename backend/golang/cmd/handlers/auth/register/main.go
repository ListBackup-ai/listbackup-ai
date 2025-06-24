package main

import (
	"context"
	"encoding/json"
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
	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	UserID           string    `json:"userId" dynamodbav:"userId"`
	CognitoUserID    string    `json:"cognitoUserId" dynamodbav:"cognitoUserId"`
	Email            string    `json:"email" dynamodbav:"email"`
	Name             string    `json:"name" dynamodbav:"name"`
	Status           string    `json:"status" dynamodbav:"status"`
	CurrentAccountID string    `json:"currentAccountId" dynamodbav:"currentAccountId"`
	CreatedAt        time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

// Account represents an account in the system
type Account struct {
	AccountID       string    `json:"accountId" dynamodbav:"accountId"`
	ParentAccountID *string   `json:"parentAccountId,omitempty" dynamodbav:"parentAccountId,omitempty"`
	OwnerUserID     string    `json:"ownerUserId" dynamodbav:"ownerUserId"`
	CreatedByUserID string    `json:"createdByUserId" dynamodbav:"createdByUserId"`
	Name            string    `json:"name" dynamodbav:"name"`
	Company         string    `json:"company" dynamodbav:"company"`
	AccountPath     string    `json:"accountPath" dynamodbav:"accountPath"`
	Level           int       `json:"level" dynamodbav:"level"`
	Plan            string    `json:"plan" dynamodbav:"plan"`
	Status          string    `json:"status" dynamodbav:"status"`
	CreatedAt       time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

// UserAccount represents the many-to-many relationship between users and accounts
type UserAccount struct {
	UserID    string    `json:"userId" dynamodbav:"userId"`
	AccountID string    `json:"accountId" dynamodbav:"accountId"`
	Role      string    `json:"role" dynamodbav:"role"`
	Status    string    `json:"status" dynamodbav:"status"`
	LinkedAt  time.Time `json:"linkedAt" dynamodbav:"linkedAt"`
	UpdatedAt time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Company  string `json:"company,omitempty"`
}

type RegisterResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

var (
	cognitoUserPoolID = os.Getenv("COGNITO_USER_POOL_ID")
	cognitoClientID   = os.Getenv("COGNITO_CLIENT_ID")
	usersTable        = os.Getenv("USERS_TABLE")
	accountsTable     = os.Getenv("ACCOUNTS_TABLE")
	userAccountsTable = os.Getenv("USER_ACCOUNTS_TABLE")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("=== REGISTER FUNCTION START ===")
	log.Printf("Registration function called with method: %s", event.RequestContext.HTTP.Method)

	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
			Body: "",
		}, nil
	}

	// Validate environment variables
	if cognitoUserPoolID == "" || cognitoClientID == "" {
		log.Printf("ERROR: Missing Cognito configuration")
		return createErrorResponse(500, "Authentication service not configured"), nil
	}

	if usersTable == "" || accountsTable == "" || userAccountsTable == "" {
		log.Printf("ERROR: Missing DynamoDB table configuration")
		return createErrorResponse(500, "Database service not configured"), nil
	}

	// Parse request body
	if event.Body == "" {
		return createErrorResponse(400, "Request body is required"), nil
	}

	var registerReq RegisterRequest
	if err := json.Unmarshal([]byte(event.Body), &registerReq); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return createErrorResponse(400, "Invalid JSON format"), nil
	}

	// Validate required fields
	if registerReq.Email == "" {
		return createErrorResponse(400, "Email is required"), nil
	}
	if registerReq.Password == "" {
		return createErrorResponse(400, "Password is required"), nil
	}
	if registerReq.Name == "" {
		return createErrorResponse(400, "Name is required"), nil
	}

	// Validate email format
	if !strings.Contains(registerReq.Email, "@") || !strings.Contains(registerReq.Email, ".") {
		return createErrorResponse(400, "Invalid email format"), nil
	}

	// Validate password requirements
	if len(registerReq.Password) < 6 {
		return createErrorResponse(400, "Password must be at least 6 characters long"), nil
	}

	log.Printf("Registration request validated - Email: %s, Name: %s", registerReq.Email, registerReq.Name)

	// Create AWS session
	region := os.Getenv("COGNITO_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		log.Printf("Failed to create AWS session: %v", err)
		return createErrorResponse(500, "Registration failed"), nil
	}

	// Create AWS service clients
	cognitoClient := cognitoidentityprovider.New(sess)
	dynamoClient := dynamodb.New(sess)

	// Create Cognito user
	username := strings.ToLower(registerReq.Email)
	userAttributes := []*cognitoidentityprovider.AttributeType{
		{
			Name:  aws.String("email"),
			Value: aws.String(strings.ToLower(registerReq.Email)),
		},
		{
			Name:  aws.String("name"),
			Value: aws.String(registerReq.Name),
		},
		{
			Name:  aws.String("email_verified"),
			Value: aws.String("true"),
		},
	}

	// Create user with AdminCreateUser
	createInput := &cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId:     aws.String(cognitoUserPoolID),
		Username:       aws.String(username),
		UserAttributes: userAttributes,
		MessageAction:  aws.String("SUPPRESS"),
		TemporaryPassword: aws.String(registerReq.Password + "Temp1!"), // Add suffix to ensure it's different
	}

	log.Printf("Creating Cognito user...")
	createResult, err := cognitoClient.AdminCreateUser(createInput)
	if err != nil {
		log.Printf("Cognito user creation error: %v", err)
		return handleRegisterError(err), nil
	}

	// Get the Cognito user UUID (sub) from the result
	var cognitoUserID string
	for _, attr := range createResult.User.Attributes {
		if *attr.Name == "sub" {
			cognitoUserID = *attr.Value
			break
		}
	}

	if cognitoUserID == "" {
		log.Printf("Failed to get Cognito user UUID")
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	// Set permanent password immediately
	setPasswordInput := &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String(cognitoUserPoolID),
		Username:   aws.String(username),
		Password:   aws.String(registerReq.Password),
		Permanent:  aws.Bool(true),
	}

	_, err = cognitoClient.AdminSetUserPassword(setPasswordInput)
	if err != nil {
		log.Printf("Error setting permanent password: %v", err)
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	log.Printf("Cognito user created successfully with permanent password: %s", username)

	// Use Cognito UUID as userID
	userID := "user:" + cognitoUserID
	user := &User{
		UserID:        userID,
		CognitoUserID: cognitoUserID,
		Email:         strings.ToLower(registerReq.Email),
		Name:          registerReq.Name,
		Status:        "active",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	userItem, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		log.Printf("Failed to marshal user: %v", err)
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(usersTable),
		Item:      userItem,
	})
	if err != nil {
		log.Printf("Failed to create user record: %v", err)
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	log.Printf("User record created: %s", userID)

	// Create root account
	accountID := "account:" + uuid.New().String()
	accountName := registerReq.Name + "'s Account"
	if registerReq.Company != "" {
		accountName = registerReq.Company
	}

	account := &Account{
		AccountID:       accountID,
		OwnerUserID:     userID,
		CreatedByUserID: userID,
		Name:            accountName,
		Company:         registerReq.Company,
		AccountPath:     "/" + strings.TrimPrefix(accountID, "account:"),
		Level:           0,
		Plan:            "free",
		Status:          "active",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	accountItem, err := dynamodbattribute.MarshalMap(account)
	if err != nil {
		log.Printf("Failed to marshal account: %v", err)
		cleanupUser(dynamoClient, userID)
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(accountsTable),
		Item:      accountItem,
	})
	if err != nil {
		log.Printf("Failed to create account: %v", err)
		cleanupUser(dynamoClient, userID)
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	log.Printf("Account created: %s", accountID)

	// Create user-account relationship
	userAccount := &UserAccount{
		UserID:    userID,
		AccountID: accountID,
		Role:      "Owner",
		Status:    "Active",
		LinkedAt:  time.Now(),
		UpdatedAt: time.Now(),
	}

	userAccountItem, err := dynamodbattribute.MarshalMap(userAccount)
	if err != nil {
		log.Printf("Failed to marshal user-account: %v", err)
		cleanupAccount(dynamoClient, accountID)
		cleanupUser(dynamoClient, userID)
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(userAccountsTable),
		Item:      userAccountItem,
	})
	if err != nil {
		log.Printf("Failed to create user-account relationship: %v", err)
		cleanupAccount(dynamoClient, accountID)
		cleanupUser(dynamoClient, userID)
		cleanupCognitoUser(cognitoClient, username)
		return createErrorResponse(500, "Registration failed"), nil
	}

	log.Printf("User-account relationship created")

	// Update user's current account
	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {
				S: aws.String(userID),
			},
		},
		UpdateExpression: aws.String("SET currentAccountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {
				S: aws.String(accountID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to set current account: %v", err)
		// Don't fail registration for this
	}

	// Success response
	response := RegisterResponse{
		Success: true,
		Message: "User registered successfully",
		Data: map[string]interface{}{
			"userId":     strings.TrimPrefix(userID, "user:"),
			"accountId":  strings.TrimPrefix(accountID, "account:"),
			"email":      registerReq.Email,
			"name":       registerReq.Name,
			"company":    registerReq.Company,
			"userStatus": "CONFIRMED",
		},
	}

	responseJSON, _ := json.Marshal(response)
	log.Printf("Registration successful for user: %s with account: %s", registerReq.Email, accountID)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}, nil
}

func cleanupCognitoUser(client *cognitoidentityprovider.CognitoIdentityProvider, username string) {
	deleteInput := &cognitoidentityprovider.AdminDeleteUserInput{
		UserPoolId: aws.String(cognitoUserPoolID),
		Username:   aws.String(username),
	}
	client.AdminDeleteUser(deleteInput)
}

func cleanupUser(client *dynamodb.DynamoDB, userID string) {
	deleteInput := &dynamodb.DeleteItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {
				S: aws.String(userID),
			},
		},
	}
	client.DeleteItem(deleteInput)
}

func cleanupAccount(client *dynamodb.DynamoDB, accountID string) {
	deleteInput := &dynamodb.DeleteItemInput{
		TableName: aws.String(accountsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"accountId": {
				S: aws.String(accountID),
			},
		},
	}
	client.DeleteItem(deleteInput)
}

func handleRegisterError(err error) events.APIGatewayProxyResponse {
	if err == nil {
		return createErrorResponse(500, "Unknown registration error")
	}

	errStr := err.Error()
	if strings.Contains(errStr, "UsernameExistsException") {
		return createErrorResponse(400, "User already exists")
	} else if strings.Contains(errStr, "InvalidPasswordException") {
		return createErrorResponse(400, "Password does not meet requirements")
	} else if strings.Contains(errStr, "InvalidParameterException") {
		return createErrorResponse(400, "Invalid email format")
	}

	return createErrorResponse(500, "Registration failed")
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := RegisterResponse{
		Success: false,
		Error:   message,
	}
	responseJSON, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}
}

func main() {
	lambda.Start(Handle)
}