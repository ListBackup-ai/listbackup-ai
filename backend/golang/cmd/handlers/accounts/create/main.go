package main

import (
	"context"
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
	"github.com/google/uuid"
	apitypes "github.com/listbackup/api/internal/types"
	internalutils "github.com/listbackup/api/internal/utils"
	"github.com/listbackup/api/pkg/response"
)

type CreateAccountHandler struct {
	db *dynamodb.DynamoDB
}

type CreateAccountRequest struct {
	Name               string                       `json:"name" validate:"required"`
	Company            string                       `json:"company,omitempty"`
	BillingEmail       string                       `json:"billingEmail,omitempty"`
	ParentAccountID    *string                      `json:"parentAccountId,omitempty"`
	Plan               string                       `json:"plan,omitempty"`
	Settings           *AccountSettingsCreate       `json:"settings,omitempty"`
}

type AccountSettingsCreate struct {
	MaxSources         *int                         `json:"maxSources,omitempty"`
	MaxStorageGB       *int                         `json:"maxStorageGB,omitempty"`
	MaxBackupJobs      *int                         `json:"maxBackupJobs,omitempty"`
	RetentionDays      *int                         `json:"retentionDays,omitempty"`
	TwoFactorRequired  *bool                        `json:"twoFactorRequired,omitempty"`
	EncryptionEnabled  *bool                        `json:"encryptionEnabled,omitempty"`
	AllowSubAccounts   *bool                        `json:"allowSubAccounts,omitempty"`
	MaxSubAccounts     *int                         `json:"maxSubAccounts,omitempty"`
	WhiteLabel         *apitypes.WhiteLabelSettings `json:"whiteLabel,omitempty"`
}

func NewCreateAccountHandler(ctx context.Context) (*CreateAccountHandler, error) {
	sess, err := session.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &CreateAccountHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *CreateAccountHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Create account request")

	// Extract user ID from JWT claims
	userID := ""
	if authContext := event.RequestContext.Authorizer; authContext != nil {
		if jwt, ok := authContext["jwt"].(map[string]interface{}); ok {
			if claims, ok := jwt["claims"].(map[string]interface{}); ok {
				if sub, exists := claims["sub"].(string); exists {
					userID = "user:" + sub
				}
			}
		}
	}

	if userID == "" {
		return response.Unauthorized("User not authenticated"), nil
	}

	var createReq CreateAccountRequest
	if err := internalutils.ParseJSONBody(event, &createReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return response.BadRequest("Invalid JSON format in request body"), nil
	}

	// Validate required fields
	if createReq.Name == "" {
		return response.BadRequest("Account name is required"), nil
	}


	// Generate new account ID
	accountID := "account:" + uuid.New().String()

	// Handle parent account
	var parentAccountID *string
	var accountPath string
	var level int

	if createReq.ParentAccountID != nil && *createReq.ParentAccountID != "" {
		// Add prefix if not present
		parentID := *createReq.ParentAccountID
		if !strings.HasPrefix(parentID, "account:") {
			parentID = "account:" + parentID
		}


		// Get parent account to determine path and level
		parentAccount, err := h.getAccountFromDynamoDB(ctx, parentID)
		if err != nil {
			return response.BadRequest("Parent account not found"), nil
		}

		parentAccountID = &parentID
		accountPath = parentAccount.AccountPath + strings.TrimPrefix(accountID, "account:") + "/"
		level = parentAccount.Level + 1
	} else {
		// Root account
		accountPath = "/" + strings.TrimPrefix(accountID, "account:") + "/"
		level = 0
	}

	// Set defaults for optional fields
	plan := createReq.Plan
	if plan == "" {
		plan = "Free"
	}

	// Create account settings with defaults
	settings := apitypes.AccountSettings{
		MaxSources:        10,
		MaxStorageGB:      5,
		MaxBackupJobs:     3,
		RetentionDays:     30,
		TwoFactorRequired: false,
		EncryptionEnabled: true,
		AllowSubAccounts:  false,
		MaxSubAccounts:    0,
		WhiteLabel: apitypes.WhiteLabelSettings{
			Enabled: false,
		},
	}

	// Override with provided settings
	if createReq.Settings != nil {
		if createReq.Settings.MaxSources != nil {
			settings.MaxSources = *createReq.Settings.MaxSources
		}
		if createReq.Settings.MaxStorageGB != nil {
			settings.MaxStorageGB = *createReq.Settings.MaxStorageGB
		}
		if createReq.Settings.MaxBackupJobs != nil {
			settings.MaxBackupJobs = *createReq.Settings.MaxBackupJobs
		}
		if createReq.Settings.RetentionDays != nil {
			settings.RetentionDays = *createReq.Settings.RetentionDays
		}
		if createReq.Settings.TwoFactorRequired != nil {
			settings.TwoFactorRequired = *createReq.Settings.TwoFactorRequired
		}
		if createReq.Settings.EncryptionEnabled != nil {
			settings.EncryptionEnabled = *createReq.Settings.EncryptionEnabled
		}
		if createReq.Settings.AllowSubAccounts != nil {
			settings.AllowSubAccounts = *createReq.Settings.AllowSubAccounts
		}
		if createReq.Settings.MaxSubAccounts != nil {
			settings.MaxSubAccounts = *createReq.Settings.MaxSubAccounts
		}
		if createReq.Settings.WhiteLabel != nil {
			settings.WhiteLabel = *createReq.Settings.WhiteLabel
		}
	}

	// Create account object
	now := time.Now()
	account := apitypes.Account{
		AccountID:       accountID,
		ParentAccountID: parentAccountID,
		OwnerUserID:     userID,
		CreatedByUserID: userID,
		Name:            createReq.Name,
		Company:         createReq.Company,
		AccountPath:     accountPath,
		Level:           level,
		Plan:            plan,
		Status:          "Active",
		BillingEmail:    createReq.BillingEmail,
		Settings:        settings,
		Usage: apitypes.AccountUsage{
			Sources:              0,
			StorageUsedGB:        0,
			BackupJobs:           0,
			MonthlyBackups:       0,
			MonthlyAPIRequests:   0,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Save account to database
	item, err := dynamodbattribute.MarshalMap(account)
	if err != nil {
		log.Printf("Failed to marshal account: %v", err)
		return response.InternalServerError("Failed to create account"), nil
	}

	tableName := os.Getenv("ACCOUNTS_TABLE")
	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		log.Printf("Failed to create account: %v", err)
		return response.InternalServerError("Failed to create account"), nil
	}

	// Create user-account relationship (creator becomes admin)
	userAccount := apitypes.UserAccount{
		UserID:    userID,
		AccountID: accountID,
		Role:      "Admin",
		Status:    "Active",
		Permissions: apitypes.UserPermissions{
			CanCreateSubAccounts:  true,
			CanInviteUsers:        true,
			CanManageIntegrations: true,
			CanViewAllData:        true,
			CanManageBilling:      true,
			CanDeleteAccount:      true,
			CanModifySettings:     true,
		},
		LinkedAt:  now,
		UpdatedAt: now,
	}

	userAccountItem, err := dynamodbattribute.MarshalMap(userAccount)
	if err != nil {
		log.Printf("Failed to marshal user-account: %v", err)
		return response.InternalServerError("Failed to create account relationship"), nil
	}

	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(userAccountsTable),
		Item:      userAccountItem,
	})
	if err != nil {
		log.Printf("Failed to create user-account relationship: %v", err)
		// Try to clean up the account
		h.db.DeleteItem(&dynamodb.DeleteItemInput{
			TableName: aws.String(tableName),
			Key: map[string]*dynamodb.AttributeValue{
				"accountId": {S: aws.String(accountID)},
			},
		})
		return response.InternalServerError("Failed to create account relationship"), nil
	}

	// Build response with clean account ID
	accountResponse := map[string]interface{}{
		"accountId":     strings.TrimPrefix(account.AccountID, "account:"),
		"name":          account.Name,
		"company":       account.Company,
		"billingEmail":  account.BillingEmail,
		"plan":          account.Plan,
		"status":        account.Status,
		"level":         account.Level,
		"accountPath":   account.AccountPath,
		"parentAccountId": nil,
		"isRootAccount": account.ParentAccountID == nil,
		
		"settings": account.Settings,
		"usage":    account.Usage,
		
		// User's relationship to this account
		"userRole":        userAccount.Role,
		"userPermissions": userAccount.Permissions,
		
		// Metadata
		"createdAt": account.CreatedAt,
		"updatedAt": account.UpdatedAt,
	}

	// Add parent account ID if present
	if account.ParentAccountID != nil {
		accountResponse["parentAccountId"] = strings.TrimPrefix(*account.ParentAccountID, "account:")
	}

	return response.Success(accountResponse), nil
}

func (h *CreateAccountHandler) canUserCreateSubAccounts(ctx context.Context, userID string) (bool, error) {
	// Query user's accounts to check if they have permission to create sub-accounts in any account
	keyCondition := aws.String("userId = :userId")
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":userId": {S: aws.String(userID)},
	}

	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	queryInput := &dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    keyCondition,
		ExpressionAttributeValues: expressionAttributeValues,
	}

	result, err := h.db.Query(queryInput)
	if err != nil {
		return false, err
	}

	// Check if user has permission to create sub-accounts in any of their accounts
	for _, item := range result.Items {
		var ua apitypes.UserAccount
		err = dynamodbattribute.UnmarshalMap(item, &ua)
		if err != nil {
			continue
		}

		if ua.Permissions.CanCreateSubAccounts {
			return true, nil
		}
	}

	return false, nil
}

func (h *CreateAccountHandler) hasAccountAccess(ctx context.Context, userID, accountID string) bool {
	// Check if user has access to this account
	key := map[string]*dynamodb.AttributeValue{
		"userId":    {S: aws.String(userID)},
		"accountId": {S: aws.String(accountID)},
	}

	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(userAccountsTable),
		Key:       key,
	})
	
	return err == nil && result.Item != nil
}

func (h *CreateAccountHandler) getAccountFromDynamoDB(ctx context.Context, accountID string) (*apitypes.Account, error) {
	key := map[string]*dynamodb.AttributeValue{
		"accountId": {S: aws.String(accountID)},
	}

	tableName := os.Getenv("ACCOUNTS_TABLE")
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key:       key,
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("account not found")
	}

	var account apitypes.Account
	err = dynamodbattribute.UnmarshalMap(result.Item, &account)
	if err != nil {
		return nil, err
	}

	return &account, nil
}

func main() {
	handler, err := NewCreateAccountHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create create account handler: %v", err)
	}

	lambda.Start(handler.Handle)
}