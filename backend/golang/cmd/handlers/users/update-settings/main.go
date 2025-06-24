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
)

type UpdateSettingsHandler struct {
	db *dynamodb.DynamoDB
}

type UpdateSettingsRequest struct {
	User    *UserSettingsUpdate    `json:"user,omitempty"`
	Account *AccountSettingsUpdate `json:"account,omitempty"`
}

type UserSettingsUpdate struct {
	Timezone      *string               `json:"timezone,omitempty"`
	Theme         *string               `json:"theme,omitempty"`
	Notifications *NotificationSettings `json:"notifications,omitempty"`
}

type AccountSettingsUpdate struct {
	Name               *string `json:"name,omitempty"`
	Company            *string `json:"company,omitempty"`
	TwoFactorRequired  *bool   `json:"twoFactorRequired,omitempty"`
	EncryptionEnabled  *bool   `json:"encryptionEnabled,omitempty"`
	AllowSubAccounts   *bool   `json:"allowSubAccounts,omitempty"`
}

type User struct {
	UserID           string          `json:"userId" dynamodbav:"userId"`
	CognitoUserID    string          `json:"cognitoUserId" dynamodbav:"cognitoUserId"`
	Email            string          `json:"email" dynamodbav:"email"`
	Name             string          `json:"name" dynamodbav:"name"`
	Status           string          `json:"status" dynamodbav:"status"`
	CurrentAccountID string          `json:"currentAccountId" dynamodbav:"currentAccountId"`
	Preferences      UserPreferences `json:"preferences" dynamodbav:"preferences"`
	CreatedAt        time.Time       `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt" dynamodbav:"updatedAt"`
}

type UserPreferences struct {
	Timezone      string                `json:"timezone" dynamodbav:"timezone"`
	Theme         string                `json:"theme" dynamodbav:"theme"`
	Notifications NotificationSettings `json:"notifications" dynamodbav:"notifications"`
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
	Settings  AccountSettings `json:"settings" dynamodbav:"settings"`
	CreatedAt time.Time       `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt" dynamodbav:"updatedAt"`
}

type AccountSettings struct {
	TwoFactorRequired bool `json:"twoFactorRequired" dynamodbav:"twoFactorRequired"`
	EncryptionEnabled bool `json:"encryptionEnabled" dynamodbav:"encryptionEnabled"`
	AllowSubAccounts  bool `json:"allowSubAccounts" dynamodbav:"allowSubAccounts"`
}

func NewUpdateSettingsHandler() (*UpdateSettingsHandler, error) {
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
	
	return &UpdateSettingsHandler{db: db}, nil
}

func (h *UpdateSettingsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Update user settings request")

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

	var updateReq UpdateSettingsRequest
	if err := json.Unmarshal([]byte(event.Body), &updateReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Invalid JSON format in request body",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	// Update user preferences if provided
	if updateReq.User != nil {
		err := h.updateUserSettings(userID, updateReq.User)
		if err != nil {
			log.Printf("Failed to update user settings: %v", err)
			response := map[string]interface{}{
				"success": false,
				"error":   "Failed to update user settings",
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
	}

	// Update account settings if provided
	if updateReq.Account != nil {
		err := h.updateAccountSettings(userID, updateReq.Account)
		if err != nil {
			log.Printf("Failed to update account settings: %v", err)
			response := map[string]interface{}{
				"success": false,
				"error":   "Failed to update account settings",
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
	}

	// Get updated settings to return
	user, err := h.getUserFromDynamoDB(userID)
	if err != nil {
		log.Printf("Failed to get updated user: %v", err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to get updated settings",
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

	account, err := h.getAccountFromDynamoDB(user.CurrentAccountID)
	if err != nil {
		log.Printf("Failed to get updated account: %v", err)
		// Don't fail completely, just use default values
		account = &Account{}
	}

	// Build response
	settings := map[string]interface{}{
		"user": map[string]interface{}{
			"preferences": user.Preferences,
			"timezone":    user.Preferences.Timezone,
			"theme":       user.Preferences.Theme,
			"notifications": map[string]interface{}{
				"email":          user.Preferences.Notifications.Email,
				"slack":          user.Preferences.Notifications.Slack,
				"backupComplete": user.Preferences.Notifications.BackupComplete,
				"backupFailed":   user.Preferences.Notifications.BackupFailed,
				"weeklyReport":   user.Preferences.Notifications.WeeklyReport,
			},
			"updatedAt": user.UpdatedAt,
		},
		"account": map[string]interface{}{
			"accountId":          strings.TrimPrefix(account.AccountID, "account:"),
			"name":               account.Name,
			"company":            account.Company,
			"twoFactorRequired":  account.Settings.TwoFactorRequired,
			"encryptionEnabled":  account.Settings.EncryptionEnabled,
			"allowSubAccounts":   account.Settings.AllowSubAccounts,
			"updatedAt":          account.UpdatedAt,
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

func (h *UpdateSettingsHandler) updateUserSettings(userID string, userUpdate *UserSettingsUpdate) error {
	// Get current user
	user, err := h.getUserFromDynamoDB(userID)
	if err != nil {
		return err
	}

	// Update user preferences
	if userUpdate.Timezone != nil {
		user.Preferences.Timezone = *userUpdate.Timezone
	}
	if userUpdate.Theme != nil {
		user.Preferences.Theme = *userUpdate.Theme
	}
	if userUpdate.Notifications != nil {
		user.Preferences.Notifications = *userUpdate.Notifications
	}

	// Update timestamp
	user.UpdatedAt = time.Now()

	// Save updated user
	usersTable := os.Getenv("USERS_TABLE")
	av, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return err
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(usersTable),
		Item:      av,
	}

	_, err = h.db.PutItem(input)
	return err
}

func (h *UpdateSettingsHandler) updateAccountSettings(userID string, accountUpdate *AccountSettingsUpdate) error {
	// Get user to find their current account
	user, err := h.getUserFromDynamoDB(userID)
	if err != nil {
		return err
	}
	// Get current account
	account, err := h.getAccountFromDynamoDB(user.CurrentAccountID)
	if err != nil {
		return err
	}

	// Update account fields
	if accountUpdate.Name != nil {
		account.Name = *accountUpdate.Name
	}
	if accountUpdate.Company != nil {
		account.Company = *accountUpdate.Company
	}
	if accountUpdate.TwoFactorRequired != nil {
		account.Settings.TwoFactorRequired = *accountUpdate.TwoFactorRequired
	}
	if accountUpdate.EncryptionEnabled != nil {
		account.Settings.EncryptionEnabled = *accountUpdate.EncryptionEnabled
	}
	if accountUpdate.AllowSubAccounts != nil {
		account.Settings.AllowSubAccounts = *accountUpdate.AllowSubAccounts
	}

	// Update timestamp
	account.UpdatedAt = time.Now()

	// Save updated account
	accountsTable := os.Getenv("ACCOUNTS_TABLE")
	av, err := dynamodbattribute.MarshalMap(account)
	if err != nil {
		return err
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(accountsTable),
		Item:      av,
	}

	_, err = h.db.PutItem(input)
	return err
}

func (h *UpdateSettingsHandler) getUserFromDynamoDB(userID string) (*User, error) {
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

func (h *UpdateSettingsHandler) getAccountFromDynamoDB(accountID string) (*Account, error) {
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

func mustMarshal(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		return `{"success": false, "error": "Failed to marshal response"}`
	}
	return string(b)
}

func main() {
	handler, err := NewUpdateSettingsHandler()
	if err != nil {
		log.Fatalf("Failed to create update settings handler: %v", err)
	}

	lambda.Start(handler.Handle)
}