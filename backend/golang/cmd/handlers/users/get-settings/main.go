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

type GetSettingsHandler struct {
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
	AccountID string          `json:"accountId" dynamodbav:"accountId"`
	Name      string          `json:"name" dynamodbav:"name"`
	Company   string          `json:"company" dynamodbav:"company"`
	Plan      string          `json:"plan" dynamodbav:"plan"`
	Status    string          `json:"status" dynamodbav:"status"`
	Settings  AccountSettings `json:"settings" dynamodbav:"settings"`
	Usage     AccountUsage    `json:"usage" dynamodbav:"usage"`
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

func NewGetSettingsHandler() (*GetSettingsHandler, error) {
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
	
	return &GetSettingsHandler{db: db}, nil
}

func (h *GetSettingsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get user settings request")

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

	// Get current user from database
	user, err := h.getUserFromDynamoDB(userID)
	if err != nil {
		log.Printf("Failed to get user from database: %v", err)
		if strings.Contains(err.Error(), "item not found") {
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
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to get user settings",
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

	// Get user's current account
	account, err := h.getAccountFromDynamoDB(user.CurrentAccountID)
	if err != nil {
		log.Printf("Failed to get account from database: %v", err)
		// Don't fail completely, use default values
	}

	// Get user-account relationship for permissions
	userAccount, err := h.getUserAccountFromDynamoDB(userID, user.CurrentAccountID)
	if err != nil {
		log.Printf("Failed to get user-account relationship: %v", err)
		// Use default permissions if relationship not found
		userAccount = &UserAccount{
			Permissions: UserPermissions{},
		}
	}

	// Build settings response
	settings := map[string]interface{}{
		"user": map[string]interface{}{
			"preferences": user.Preferences,
			"notifications": map[string]interface{}{
				"email":          user.Preferences.Notifications.Email,
				"slack":          user.Preferences.Notifications.Slack,
				"backupComplete": user.Preferences.Notifications.BackupComplete,
				"backupFailed":   user.Preferences.Notifications.BackupFailed,
				"weeklyReport":   user.Preferences.Notifications.WeeklyReport,
			},
			"timezone": user.Preferences.Timezone,
			"theme":    user.Preferences.Theme,
		},
		"account": map[string]interface{}{
			"accountId":          strings.TrimPrefix(account.AccountID, "account:"),
			"name":               account.Name,
			"company":            account.Company,
			"plan":               account.Plan,
			"status":             account.Status,
			"maxSources":         account.Settings.MaxSources,
			"maxStorageGB":       account.Settings.MaxStorageGB,
			"maxBackupJobs":      account.Settings.MaxBackupJobs,
			"retentionDays":      account.Settings.RetentionDays,
			"encryptionEnabled":  account.Settings.EncryptionEnabled,
			"twoFactorRequired":  account.Settings.TwoFactorRequired,
			"allowSubAccounts":   account.Settings.AllowSubAccounts,
			"maxSubAccounts":     account.Settings.MaxSubAccounts,
			"whiteLabel":         account.Settings.WhiteLabel,
		},
		"usage": account.Usage,
		"permissions": map[string]interface{}{
			"canCreateSubAccounts":    userAccount.Permissions.CanCreateSubAccounts,
			"canInviteUsers":          userAccount.Permissions.CanInviteUsers,
			"canManageIntegrations":   userAccount.Permissions.CanManageIntegrations,
			"canViewAllData":          userAccount.Permissions.CanViewAllData,
			"canManageBilling":        userAccount.Permissions.CanManageBilling,
			"canDeleteAccount":        userAccount.Permissions.CanDeleteAccount,
			"canModifySettings":       userAccount.Permissions.CanModifySettings,
		},
	}

	response := map[string]interface{}{
		"success": true,
		"data":    settings,
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

func (h *GetSettingsHandler) getUserFromDynamoDB(userID string) (*User, error) {
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
		return nil, err
	}

	if resp.Item == nil {
		return nil, fmt.Errorf("item not found")
	}

	var user User
	err = dynamodbattribute.UnmarshalMap(resp.Item, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (h *GetSettingsHandler) getAccountFromDynamoDB(accountID string) (*Account, error) {
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

func (h *GetSettingsHandler) getUserAccountFromDynamoDB(userID, accountID string) (*UserAccount, error) {
	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	key := map[string]*dynamodb.AttributeValue{
		"userId": {
			S: aws.String(userID),
		},
		"accountId": {
			S: aws.String(accountID),
		},
	}

	input := &dynamodb.GetItemInput{
		TableName: aws.String(userAccountsTable),
		Key:       key,
	}

	resp, err := h.db.GetItem(input)
	if err != nil {
		return nil, err
	}

	if resp.Item == nil {
		return nil, fmt.Errorf("item not found")
	}

	var userAccount UserAccount
	err = dynamodbattribute.UnmarshalMap(resp.Item, &userAccount)
	if err != nil {
		return nil, err
	}

	return &userAccount, nil
}

func mustMarshal(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		return `{"success": false, "error": "Failed to marshal response"}`
	}
	return string(b)
}

func main() {
	handler, err := NewGetSettingsHandler()
	if err != nil {
		log.Fatalf("Failed to create get settings handler: %v", err)
	}

	lambda.Start(handler.Handle)
}