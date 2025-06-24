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

type UserAccount struct {
	UserID    string    `json:"userId" dynamodbav:"userId"`
	AccountID string    `json:"accountId" dynamodbav:"accountId"`
	Role      string    `json:"role" dynamodbav:"role"`
	Status    string    `json:"status" dynamodbav:"status"`
	LinkedAt  time.Time `json:"linkedAt" dynamodbav:"linkedAt"`
	UpdatedAt time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

type AccountsResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

var (
	accountsTable     = os.Getenv("ACCOUNTS_TABLE")
	userAccountsTable = os.Getenv("USER_ACCOUNTS_TABLE")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get available accounts function called with method: %s", event.RequestContext.HTTP.Method)

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
	var userID, accountID string
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

	log.Printf("Get available accounts request for userId: %s, currentAccount: %s", userID, accountID)

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
		return createErrorResponse(500, "Failed to retrieve accounts"), nil
	}

	// Create DynamoDB client
	dynamoClient := dynamodb.New(sess)

	// Get all user-account relationships
	userAccounts, err := getUserAccounts(dynamoClient, userID)
	if err != nil {
		log.Printf("Failed to get user accounts: %v", err)
		return createErrorResponse(500, "Failed to retrieve user accounts"), nil
	}

	// Build account list with details
	availableAccounts := make([]map[string]interface{}, 0, len(userAccounts))

	for _, ua := range userAccounts {
		// Get account details
		account, err := getAccountFromDynamoDB(dynamoClient, ua.AccountID)
		if err != nil {
			log.Printf("Failed to get account details for %s: %v", ua.AccountID, err)
			continue
		}

		if account == nil {
			log.Printf("Account not found: %s", ua.AccountID)
			continue
		}

		cleanAccountID := strings.TrimPrefix(ua.AccountID, "account:")
		
		accountInfo := map[string]interface{}{
			"accountId":       cleanAccountID,
			"name":            account.Name,
			"company":         account.Company,
			"role":            ua.Role,
			"status":          ua.Status,
			"level":           account.Level,
			"plan":            account.Plan,
			"isRootAccount":   account.ParentAccountID == nil,
			"isCurrent":       ua.AccountID == accountID,
		}

		// Add parent info for hierarchy display
		if account.ParentAccountID != nil {
			accountInfo["parentAccountId"] = strings.TrimPrefix(*account.ParentAccountID, "account:")
		}

		availableAccounts = append(availableAccounts, accountInfo)
	}

	response := AccountsResponse{
		Success: true,
		Message: "Available accounts retrieved successfully",
		Data: map[string]interface{}{
			"availableAccounts": availableAccounts,
			"currentAccount":    strings.TrimPrefix(accountID, "account:"),
			"total":             len(availableAccounts),
		},
	}

	responseJSON, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}, nil
}

func getUserAccounts(dynamoClient *dynamodb.DynamoDB, userID string) ([]UserAccount, error) {
	input := &dynamodb.QueryInput{
		TableName: aws.String(userAccountsTable),
		KeyConditionExpression: aws.String("userId = :userId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId": {
				S: aws.String(userID),
			},
		},
	}

	result, err := dynamoClient.Query(input)
	if err != nil {
		return nil, err
	}

	var userAccounts []UserAccount
	for _, item := range result.Items {
		var ua UserAccount
		err = dynamodbattribute.UnmarshalMap(item, &ua)
		if err != nil {
			log.Printf("Failed to unmarshal user account: %v", err)
			continue
		}
		userAccounts = append(userAccounts, ua)
	}

	return userAccounts, nil
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

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := AccountsResponse{
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