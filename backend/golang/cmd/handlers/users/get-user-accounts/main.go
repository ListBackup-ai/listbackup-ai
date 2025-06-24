package main

import (
	"context"
	"encoding/json"
	"fmt"
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

type GetUserAccountsHandler struct {
	db *dynamodb.DynamoDB
}

type UserAccount struct {
	UserID    string          `json:"userId" dynamodbav:"userId"`
	AccountID string          `json:"accountId" dynamodbav:"accountId"`
	Role      string          `json:"role" dynamodbav:"role"`
	Status    string          `json:"status" dynamodbav:"status"`
	LinkedAt  string          `json:"linkedAt" dynamodbav:"linkedAt"`
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

type Account struct {
	AccountID       string          `json:"accountId" dynamodbav:"accountId"`
	Name            string          `json:"name" dynamodbav:"name"`
	Company         string          `json:"company" dynamodbav:"company"`
	Plan            string          `json:"plan" dynamodbav:"plan"`
	Status          string          `json:"status" dynamodbav:"status"`
	Level           int             `json:"level" dynamodbav:"level"`
	AccountPath     string          `json:"accountPath" dynamodbav:"accountPath"`
	ParentAccountID *string         `json:"parentAccountId" dynamodbav:"parentAccountId"`
	Settings        AccountSettings `json:"settings" dynamodbav:"settings"`
	Usage           AccountUsage    `json:"usage" dynamodbav:"usage"`
	CreatedAt       string          `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       string          `json:"updatedAt" dynamodbav:"updatedAt"`
}

type AccountSettings struct {
	MaxSources         int  `json:"maxSources" dynamodbav:"maxSources"`
	MaxStorageGB       int  `json:"maxStorageGB" dynamodbav:"maxStorageGB"`
	MaxBackupJobs      int  `json:"maxBackupJobs" dynamodbav:"maxBackupJobs"`
	RetentionDays      int  `json:"retentionDays" dynamodbav:"retentionDays"`
	EncryptionEnabled  bool `json:"encryptionEnabled" dynamodbav:"encryptionEnabled"`
	TwoFactorRequired  bool `json:"twoFactorRequired" dynamodbav:"twoFactorRequired"`
	AllowSubAccounts   bool `json:"allowSubAccounts" dynamodbav:"allowSubAccounts"`
	MaxSubAccounts     int  `json:"maxSubAccounts" dynamodbav:"maxSubAccounts"`
	WhiteLabel         bool `json:"whiteLabel" dynamodbav:"whiteLabel"`
}

type AccountUsage struct {
	SourcesUsed   int `json:"sourcesUsed" dynamodbav:"sourcesUsed"`
	StorageUsedGB int `json:"storageUsedGB" dynamodbav:"storageUsedGB"`
	BackupJobsUsed int `json:"backupJobsUsed" dynamodbav:"backupJobsUsed"`
}

func NewGetUserAccountsHandler() (*GetUserAccountsHandler, error) {
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
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	// Create DynamoDB client
	db := dynamodb.New(sess)
	
	return &GetUserAccountsHandler{db: db}, nil
}

func (h *GetUserAccountsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get user accounts request")

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

	log.Printf("Get user accounts request for userId: %s", userID)


	// Get all user-account relationships
	userAccounts, err := h.getUserAccounts(userID)
	if err != nil {
		log.Printf("Failed to get user accounts: %v", err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to retrieve user accounts",
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

	// Build response with account details
	accountsWithDetails := make([]map[string]interface{}, 0, len(userAccounts))

	for _, ua := range userAccounts {
		// Get full account details
		account, err := h.getAccountByID(ua.AccountID)
		if err != nil {
			log.Printf("Failed to get account details for %s: %v", ua.AccountID, err)
			continue // Skip accounts we can't access
		}

		// Build account info with user's role and permissions
		accountInfo := map[string]interface{}{
			"accountId":   strings.TrimPrefix(ua.AccountID, "account:"),
			"name":        account.Name,
			"company":     account.Company,
			"plan":        account.Plan,
			"status":      account.Status,
			"level":       account.Level,
			"accountPath": account.AccountPath,
			
			// User's relationship to this account
			"userRole":        ua.Role,
			"userStatus":      ua.Status,
			"userPermissions": ua.Permissions,
			"linkedAt":        ua.LinkedAt,
			
			// Parent account info if applicable
			"parentAccountId": nil,
			"isRootAccount":   account.ParentAccountID == nil,
			
			// Account settings (filtered by permissions)
			"settings": h.filterAccountSettings(account.Settings, ua.Permissions),
			"usage":    account.Usage,
			
			// Metadata
			"createdAt": account.CreatedAt,
			"updatedAt": account.UpdatedAt,
		}

		// Add parent account ID if present
		if account.ParentAccountID != nil {
			accountInfo["parentAccountId"] = strings.TrimPrefix(*account.ParentAccountID, "account:")
		}

		// Mark current account (for now, mark the first one as current)
		accountInfo["isCurrent"] = (len(accountsWithDetails) == 0)

		accountsWithDetails = append(accountsWithDetails, accountInfo)
	}

	// Sort accounts by hierarchy level and name
	// Root accounts first, then by name within each level
	for i := 0; i < len(accountsWithDetails); i++ {
		for j := i + 1; j < len(accountsWithDetails); j++ {
			levelI := accountsWithDetails[i]["level"].(int)
			levelJ := accountsWithDetails[j]["level"].(int)
			nameI := accountsWithDetails[i]["name"].(string)
			nameJ := accountsWithDetails[j]["name"].(string)

			if levelI > levelJ || (levelI == levelJ && nameI > nameJ) {
				accountsWithDetails[i], accountsWithDetails[j] = accountsWithDetails[j], accountsWithDetails[i]
			}
		}
	}

	response := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"accounts": accountsWithDetails,
			"total":    len(accountsWithDetails),
		},
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

func (h *GetUserAccountsHandler) getUserAccounts(userID string) ([]UserAccount, error) {
	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	
	// Use a query to get all accounts for the user
	keyCondition := "userId = :userId"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":userId": {
			S: aws.String(userID),
		},
	}

	input := &dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    aws.String(keyCondition),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	resp, err := h.db.Query(input)
	if err != nil {
		return nil, fmt.Errorf("failed to query user accounts: %v", err)
	}

	var userAccounts []UserAccount
	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, &userAccounts)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user accounts: %v", err)
	}

	return userAccounts, nil
}

func (h *GetUserAccountsHandler) getAccountByID(accountID string) (*Account, error) {
	accountsTable := os.Getenv("ACCOUNTS_TABLE")
	key := map[string]*dynamodb.AttributeValue{
		"accountId": {
			S: aws.String(accountID),
		},
	}

	input := &dynamodb.GetItemInput{
		TableName: aws.String(accountsTable),
		Key:       key,
	}

	resp, err := h.db.GetItem(input)
	if err != nil {
		return nil, err
	}

	if resp.Item == nil {
		return nil, fmt.Errorf("item not found")
	}

	var account Account
	err = dynamodbattribute.UnmarshalMap(resp.Item, &account)
	if err != nil {
		return nil, err
	}

	return &account, nil
}

// filterAccountSettings returns account settings filtered by user permissions
func (h *GetUserAccountsHandler) filterAccountSettings(settings AccountSettings, permissions UserPermissions) map[string]interface{} {
	filtered := map[string]interface{}{
		"maxSources":       settings.MaxSources,
		"maxStorageGB":     settings.MaxStorageGB,
		"maxBackupJobs":    settings.MaxBackupJobs,
		"retentionDays":    settings.RetentionDays,
		"encryptionEnabled": settings.EncryptionEnabled,
	}

	// Only show sensitive settings if user has appropriate permissions
	if permissions.CanModifySettings {
		filtered["twoFactorRequired"] = settings.TwoFactorRequired
		filtered["allowSubAccounts"] = settings.AllowSubAccounts
		filtered["maxSubAccounts"] = settings.MaxSubAccounts
	}

	if permissions.CanCreateSubAccounts {
		filtered["whiteLabel"] = settings.WhiteLabel
	}

	return filtered
}

func mustMarshal(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		return `{"success": false, "error": "Failed to marshal response"}`
	}
	return string(b)
}

func main() {
	handler, err := NewGetUserAccountsHandler()
	if err != nil {
		log.Fatalf("Failed to create get user accounts handler: %v", err)
	}

	lambda.Start(handler.Handle)
}