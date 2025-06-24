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
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type ProfileResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

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

var (
	usersTable    = os.Getenv("USERS_TABLE")
	accountsTable = os.Getenv("ACCOUNTS_TABLE")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get profile function called with method: %s", event.RequestContext.HTTP.Method)

	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
	}, nil
}

	// Extract user ID from JWT authorizer context
	var userID string
	if event.RequestContext.Authorizer != nil && event.RequestContext.Authorizer.JWT != nil {
		claims := event.RequestContext.Authorizer.JWT.Claims
		if sub, ok := claims["sub"]; ok {
			userID = "user:" + sub
		}
	}

	if userID == "" {
		log.Printf("No user ID found in JWT authorizer context")
		return createErrorResponse(401, "Unauthorized"), nil
	}
	
	log.Printf("Processing profile request for user: %s", userID)

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
		return createErrorResponse(500, "Failed to get profile"), nil
	}

	// Create DynamoDB client
	dynamoClient := dynamodb.New(sess)
	
	// Fetch user from database
	user, err := getUserFromDynamoDB(dynamoClient, userID)
	if err != nil {
		log.Printf("Failed to get user from database: %v", err)
		return createErrorResponse(500, "Failed to get user profile"), nil
	}
	
	if user == nil {
		log.Printf("User not found: %s", userID)
		return createErrorResponse(404, "User not found"), nil
	}
	
	// Fetch account from database if currentAccountId is set
	var account *Account
	if user.CurrentAccountID != "" {
		account, err = getAccountFromDynamoDB(dynamoClient, user.CurrentAccountID)
		if err != nil {
			log.Printf("Failed to get account from database: %v", err)
			// Continue without account data rather than failing
		}
	}
	
	// Return user profile information with accounts array
	profile := map[string]interface{}{
		"userId": strings.TrimPrefix(user.UserID, "user:"),
		"email":  user.Email,
		"name":   user.Name,
		"status": user.Status,
		"currentAccountId": strings.TrimPrefix(user.CurrentAccountID, "account:"),
	}
	
	if account != nil {
		profile["currentAccount"] = map[string]interface{}{
			"accountId":   strings.TrimPrefix(account.AccountID, "account:"),
			"accountName": account.Name,
			"company":     account.Company,
			"plan":        account.Plan,
			"status":      account.Status,
		}
	}
	
	return createSuccessResponse(profile), nil
}

func getUserFromDynamoDB(dynamoClient *dynamodb.DynamoDB, userID string) (*User, error) {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {
				S: aws.String(userID),
			},
		},
	}

	result, err := dynamoClient.GetItem(input)
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var user User
	err = dynamodbattribute.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func getAccountFromDynamoDB(dynamoClient *dynamodb.DynamoDB, accountID string) (*Account, error) {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(accountsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"accountId": {
				S: aws.String(accountID),
			},
		},
	}

	result, err := dynamoClient.GetItem(input)
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var account Account
	err = dynamodbattribute.UnmarshalMap(result.Item, &account)
	if err != nil {
		return nil, err
	}

	return &account, nil
}

func createSuccessResponse(data interface{}) events.APIGatewayProxyResponse {
	response := ProfileResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    data,
	}
	responseJSON, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := ProfileResponse{
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