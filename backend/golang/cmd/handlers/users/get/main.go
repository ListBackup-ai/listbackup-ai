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
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type UserDetail struct {
	UserID           string             `json:"userId" dynamodbav:"userId"`
	CognitoUserID    string             `json:"cognitoUserId,omitempty" dynamodbav:"cognitoUserId"`
	Email            string             `json:"email" dynamodbav:"email"`
	Name             string             `json:"name" dynamodbav:"name"`
	Status           string             `json:"status" dynamodbav:"status"`
	CurrentAccountID string             `json:"currentAccountId,omitempty" dynamodbav:"currentAccountId"`
	Preferences      UserPreferences    `json:"preferences,omitempty" dynamodbav:"preferences"`
	CreatedAt        string             `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        string             `json:"updatedAt" dynamodbav:"updatedAt"`
	Accounts         []AccountWithRole  `json:"accounts"`
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

type AccountWithRole struct {
	AccountID    string      `json:"accountId"`
	AccountName  string      `json:"accountName"`
	AccountType  string      `json:"accountType"`
	Role         string      `json:"role"`
	Permissions  Permissions `json:"permissions"`
	JoinedAt     string      `json:"joinedAt"`
}

type UserAccount struct {
	UserID      string      `dynamodbav:"userId"`
	AccountID   string      `dynamodbav:"accountId"`
	Role        string      `dynamodbav:"role"`
	Permissions Permissions `dynamodbav:"permissions"`
	JoinedAt    time.Time   `dynamodbav:"joinedAt"`
	IsActive    bool        `dynamodbav:"isActive"`
}

type Account struct {
	AccountID   string `dynamodbav:"accountId"`
	AccountName string `dynamodbav:"accountName"`
	AccountType string `dynamodbav:"accountType"`
	Status      string `dynamodbav:"status"`
}

type Permissions struct {
	ManageUsers       bool `dynamodbav:"manageUsers" json:"manageUsers"`
	ManageSettings    bool `dynamodbav:"manageSettings" json:"manageSettings"`
	ManageBilling     bool `dynamodbav:"manageBilling" json:"manageBilling"`
	ViewReports       bool `dynamodbav:"viewReports" json:"viewReports"`
	ManageIntegrations bool `dynamodbav:"manageIntegrations" json:"manageIntegrations"`
}

var (
	usersTable        = os.Getenv("USERS_TABLE")
	accountsTable     = os.Getenv("ACCOUNTS_TABLE")
	userAccountsTable = os.Getenv("USER_ACCOUNTS_TABLE")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get user called with method: %s", event.RequestContext.HTTP.Method)

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

	// Extract requesting user ID from authorizer context
	requestingUserID := extractUserID(event)
	if requestingUserID == "" {
		return createErrorResponse(401, "Unauthorized"), nil
	}

	// Check admin permissions
	hasPermission, err := checkAdminPermission(requestingUserID)
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

	// Get user details
	user, err := getUserDetails(targetUserID)
	if err != nil {
		if err.Error() == "user not found" {
			return createErrorResponse(404, "User not found"), nil
		}
		log.Printf("Error getting user details: %v", err)
		return createErrorResponse(500, "Failed to get user details"), nil
	}

	response := Response{
		Success: true,
		Data:    user,
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

func checkAdminPermission(userID string) (bool, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Query user's accounts to check for admin role
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("userId").Equal(expression.Value(userID))).
		Build()
	if err != nil {
		return false, err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return false, err
	}

	for _, item := range result.Items {
		var userAccount UserAccount
		if err := dynamodbattribute.UnmarshalMap(item, &userAccount); err != nil {
			continue
		}
		if userAccount.Role == "admin" || userAccount.Role == "owner" || userAccount.Permissions.ManageUsers {
			return true, nil
		}
	}

	return false, nil
}

func getUserDetails(userID string) (*UserDetail, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Get user from DynamoDB
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

	var user UserDetail
	if err := dynamodbattribute.UnmarshalMap(result.Item, &user); err != nil {
		return nil, err
	}

	// Get user's accounts
	accounts, err := getUserAccounts(userID)
	if err != nil {
		log.Printf("Error getting user accounts: %v", err)
		// Don't fail if we can't get accounts
		accounts = []AccountWithRole{}
	}
	user.Accounts = accounts

	return &user, nil
}

func getUserAccounts(userID string) ([]AccountWithRole, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Query user accounts
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("userId").Equal(expression.Value(userID))).
		WithFilter(expression.Name("isActive").Equal(expression.Value(true))).
		Build()
	if err != nil {
		return nil, err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    expr.KeyCondition(),
		FilterExpression:          expr.Filter(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return nil, err
	}

	// Get account details for each user account
	var accounts []AccountWithRole
	for _, item := range result.Items {
		var userAccount UserAccount
		if err := dynamodbattribute.UnmarshalMap(item, &userAccount); err != nil {
			continue
		}

		// Get account details
		accountResult, err := svc.GetItem(&dynamodb.GetItemInput{
			TableName: aws.String(accountsTable),
			Key: map[string]*dynamodb.AttributeValue{
				"accountId": {
					S: aws.String(userAccount.AccountID),
				},
			},
		})
		if err != nil || accountResult.Item == nil {
			continue
		}

		var account Account
		if err := dynamodbattribute.UnmarshalMap(accountResult.Item, &account); err != nil {
			continue
		}

		accounts = append(accounts, AccountWithRole{
			AccountID:    account.AccountID,
			AccountName:  account.AccountName,
			AccountType:  account.AccountType,
			Role:         userAccount.Role,
			Permissions:  userAccount.Permissions,
			JoinedAt:     userAccount.JoinedAt.Format(time.RFC3339),
		})
	}

	return accounts, nil
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