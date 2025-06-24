package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type GetMeHandler struct {
	db *dynamodb.DynamoDB
}

type User struct {
	UserID           string                 `json:"userId" dynamodbav:"userId"`
	CognitoUserID    string                 `json:"cognitoUserId" dynamodbav:"cognitoUserId"`
	Email            string                 `json:"email" dynamodbav:"email"`
	Name             string                 `json:"name" dynamodbav:"name"`
	Status           string                 `json:"status" dynamodbav:"status"`
	CurrentAccountID string                 `json:"currentAccountId" dynamodbav:"currentAccountId"`
	Preferences      UserPreferences        `json:"preferences" dynamodbav:"preferences"`
}

type UserPreferences struct {
	Timezone      string                 `json:"timezone" dynamodbav:"timezone"`
	Theme         string                 `json:"theme" dynamodbav:"theme"`
	Notifications NotificationSettings   `json:"notifications" dynamodbav:"notifications"`
}

type NotificationSettings struct {
	Email          bool `json:"email" dynamodbav:"email"`
	Slack          bool `json:"slack" dynamodbav:"slack"`
	BackupComplete bool `json:"backupComplete" dynamodbav:"backupComplete"`
	BackupFailed   bool `json:"backupFailed" dynamodbav:"backupFailed"`
	WeeklyReport   bool `json:"weeklyReport" dynamodbav:"weeklyReport"`
}

type Account struct {
	AccountID string `json:"accountId" dynamodbav:"accountId"`
	Name      string `json:"name" dynamodbav:"name"`
	Company   string `json:"company" dynamodbav:"company"`
}

type UserAccount struct {
	UserID      string          `json:"userId" dynamodbav:"userId"`
	AccountID   string          `json:"accountId" dynamodbav:"accountId"`
	Role        string          `json:"role" dynamodbav:"role"`
	Permissions UserPermissions `json:"permissions" dynamodbav:"permissions"`
}

type UserPermissions struct {
	CanCreateSubAccounts   bool `json:"canCreateSubAccounts" dynamodbav:"canCreateSubAccounts"`
	CanInviteUsers         bool `json:"canInviteUsers" dynamodbav:"canInviteUsers"`
	CanManageIntegrations  bool `json:"canManageIntegrations" dynamodbav:"canManageIntegrations"`
	CanViewAllData         bool `json:"canViewAllData" dynamodbav:"canViewAllData"`
	CanManageBilling       bool `json:"canManageBilling" dynamodbav:"canManageBilling"`
	CanDeleteAccount       bool `json:"canDeleteAccount" dynamodbav:"canDeleteAccount"`
	CanModifySettings      bool `json:"canModifySettings" dynamodbav:"canModifySettings"`
}

func NewGetMeHandler() (*GetMeHandler, error) {
	// Get region from environment or default to us-west-2
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}

	// Create DynamoDB client
	db := dynamodb.New(sess)
	
	return &GetMeHandler{db: db}, nil
}

func (h *GetMeHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get me request started")

	// Handle OPTIONS for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract user ID from JWT claims via Cognito authorizer
	userID := ""
	if event.RequestContext.Authorizer != nil {
		// Try different auth context patterns
		if jwt, ok := event.RequestContext.Authorizer["jwt"].(map[string]interface{}); ok {
			if claims, ok := jwt["claims"].(map[string]interface{}); ok {
				if sub, exists := claims["sub"].(string); exists {
					userID = "user:" + sub
				}
			}
		} else if claims, ok := event.RequestContext.Authorizer["claims"].(map[string]interface{}); ok {
			// Direct claims access (some authorizer configurations)
			if sub, exists := claims["sub"].(string); exists {
				userID = "user:" + sub
			}
		}
	}

	if userID == "" {
		log.Printf("No user ID found in JWT authorizer context - event: %+v", event.RequestContext.Authorizer)
		response := map[string]interface{}{
			"success": false,
			"error":   "User not authenticated",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	// For now, use userID as accountID (single-tenant per user)
	accountID := "account:" + strings.TrimPrefix(userID, "user:")

	log.Printf("Get current user request for user %s, account %s", userID, accountID)

	// Get user from database
	usersTable := os.Getenv("USERS_TABLE")
	key := map[string]*dynamodb.AttributeValue{
		"userId": {
			S: aws.String(userID),
		},
	}

	input := &dynamodb.GetItemInput{
		TableName: aws.String(usersTable),
		Key:       key,
	}

	resp, err := h.db.GetItem(input)
	if err != nil {
		log.Printf("Failed to get user %s: %v", userID, err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to get user",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	if resp.Item == nil {
		response := map[string]interface{}{
			"success": false,
			"error":   "User not found",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	var user User
	err = dynamodbattribute.UnmarshalMap(resp.Item, &user)
	if err != nil {
		log.Printf("Failed to unmarshal user %s: %v", userID, err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to get user",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	// Get user's current account details
	accountsTable := os.Getenv("ACCOUNTS_TABLE")
	accountKey := map[string]*dynamodb.AttributeValue{
		"accountId": {
			S: aws.String(accountID),
		},
	}

	accountInput := &dynamodb.GetItemInput{
		TableName: aws.String(accountsTable),
		Key:       accountKey,
	}

	var account Account
	accountResp, err := h.db.GetItem(accountInput)
	if err != nil {
		log.Printf("Failed to get account %s: %v", accountID, err)
		// Don't fail completely, just use default values
	} else if accountResp.Item != nil {
		err = dynamodbattribute.UnmarshalMap(accountResp.Item, &account)
		if err != nil {
			log.Printf("Failed to unmarshal account %s: %v", accountID, err)
		}
	}

	// Get user-account relationship for permissions
	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	userAccountKey := map[string]*dynamodb.AttributeValue{
		"userId": {
			S: aws.String(userID),
		},
		"accountId": {
			S: aws.String(accountID),
		},
	}

	userAccountInput := &dynamodb.GetItemInput{
		TableName: aws.String(userAccountsTable),
		Key:       userAccountKey,
	}

	var userAccount UserAccount
	userAccountResp, err := h.db.GetItem(userAccountInput)
	if err != nil {
		log.Printf("Failed to get user-account relationship: %v", err)
		// Don't fail completely, use default permissions
	} else if userAccountResp.Item != nil {
		err = dynamodbattribute.UnmarshalMap(userAccountResp.Item, &userAccount)
		if err != nil {
			log.Printf("Failed to unmarshal user-account relationship: %v", err)
		}
	}

	// Build response
	currentAccount := map[string]interface{}{
		"accountId":   strings.TrimPrefix(accountID, "account:"),
		"accountName": account.Name,
		"company":     account.Company,
		"role":        userAccount.Role,
		"permissions": userAccount.Permissions,
		"isCurrent":   true,
	}

	if account.Name == "" {
		currentAccount["accountName"] = "Default Account"
		currentAccount["company"] = "Default Company"
	}

	if userAccount.Role == "" {
		currentAccount["role"] = "Owner"
	}

	userData := map[string]interface{}{
		"userId":         strings.TrimPrefix(userID, "user:"),
		"email":          user.Email,
		"name":           user.Name,
		"status":         user.Status,
		"currentAccount": currentAccount,
		"preferences":    user.Preferences,
	}

	response := map[string]interface{}{
		"success": true,
		"data":    userData,
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Access-Control-Allow-Origin": "*",
			"Content-Type":                "application/json",
		},
		Body: mustMarshal(response),
	}, nil
}

func mustMarshal(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		return `{"success": false, "error": "Failed to marshal response"}`
	}
	return string(b)
}

func main() {
	handler, err := NewGetMeHandler()
	if err != nil {
		log.Fatalf("Failed to create get me handler: %v", err)
	}

	lambda.Start(handler.Handle)
}