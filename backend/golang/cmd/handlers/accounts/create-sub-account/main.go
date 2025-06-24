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

type CreateSubAccountHandler struct {
	db *dynamodb.DynamoDB
}

type CreateSubAccountRequest struct {
	Name        string `json:"name"`
	Company     string `json:"company,omitempty"`
	OwnerUserID string `json:"ownerUserId,omitempty"` // Optional, defaults to current user
}

func NewCreateSubAccountHandler(ctx context.Context) (*CreateSubAccountHandler, error) {
	sess, err := session.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &CreateSubAccountHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *CreateSubAccountHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Get parent account ID from path
	parentAccountID := event.PathParameters["parentAccountId"]
	if parentAccountID == "" {
		return response.BadRequest("Parent account ID is required"), nil
	}

	log.Printf("Create sub-account request for parent accountId: %s", parentAccountID)

	// Extract user ID from JWT claims
	userID := ""
	if authContext := event.RequestContext.Authorizer; authContext != nil {
		log.Printf("DEBUG: Auth context exists: %+v", authContext)
		if jwt, ok := authContext["jwt"].(map[string]interface{}); ok {
			log.Printf("DEBUG: JWT found: %+v", jwt)
			if claims, ok := jwt["claims"].(map[string]interface{}); ok {
				log.Printf("DEBUG: Claims found: %+v", claims)
				if sub, exists := claims["sub"].(string); exists {
					userID = "user:" + sub
					log.Printf("DEBUG: User ID extracted: %s", userID)
				}
			}
		}
	}

	if userID == "" {
		log.Printf("DEBUG: No user ID found, returning unauthorized")
		return response.Unauthorized("User not authenticated"), nil
	}

	// Ensure account: prefix for parent account ID
	if !strings.HasPrefix(parentAccountID, "account:") {
		parentAccountID = "account:" + parentAccountID
	}

	// Validate user has access to parent account
	hasAccess, err := h.validateUserAccountAccess(ctx, userID, parentAccountID)
	if err != nil {
		log.Printf("Failed to validate user access: %v", err)
		return response.InternalServerError("Failed to validate access"), nil
	}
	if !hasAccess {
		log.Printf("User %s does not have access to parent account %s", userID, parentAccountID)
		return response.Forbidden("You do not have access to the parent account"), nil
	}

	// Get parent account to build hierarchy
	parentAccount, err := h.getAccountFromDynamoDB(ctx, parentAccountID)
	if err != nil {
		log.Printf("Failed to get parent account: %v", err)
		return response.NotFound("Parent account not found"), nil
	}

	// Parse request body
	var createReq CreateSubAccountRequest
	if err := internalutils.ParseJSONBody(event, &createReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return response.BadRequest("Invalid JSON format in request body"), nil
	}

	// Validate required fields
	if createReq.Name == "" {
		return response.BadRequest("Sub-account name is required"), nil
	}

	// Default owner to current user if not specified
	ownerUserID := createReq.OwnerUserID
	if ownerUserID == "" {
		ownerUserID = userID
	} else if !strings.HasPrefix(ownerUserID, "user:") {
		ownerUserID = "user:" + ownerUserID
	}

	// Generate new account ID
	newAccountID := "account:" + uuid.New().String()
	now := time.Now()

	// Build account path
	accountPath := parentAccount.AccountPath + strings.TrimPrefix(newAccountID, "account:") + "/"

	// Create sub-account record
	subAccount := apitypes.Account{
		AccountID:        newAccountID,
		Name:             createReq.Name,
		Company:          createReq.Company,
		ParentAccountID:  &parentAccountID,
		OwnerUserID:      ownerUserID,
		CreatedByUserID:  userID,
		Plan:             "starter", // Default plan for sub-accounts
		Status:           "active",
		Level:            parentAccount.Level + 1,
		AccountPath:      accountPath,
		CreatedAt:        now,
		UpdatedAt:        now,
		Settings: apitypes.AccountSettings{
			MaxSources:        10,
			MaxStorageGB:      5,
			MaxBackupJobs:     5,
			RetentionDays:     30,
			TwoFactorRequired: false,
			EncryptionEnabled: true,
			AllowSubAccounts:  true,
			MaxSubAccounts:    5,
		},
		Usage: apitypes.AccountUsage{
			Sources:            0,
			StorageUsedGB:      0,
			BackupJobs:         0,
			MonthlyBackups:     0,
			MonthlyAPIRequests: 0,
		},
	}

	// Create account in DynamoDB
	tableName := os.Getenv("ACCOUNTS_TABLE")
	item, err := dynamodbattribute.MarshalMap(subAccount)
	if err != nil {
		log.Printf("Failed to marshal sub-account: %v", err)
		return response.InternalServerError("Failed to create sub-account"), nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		log.Printf("Failed to create sub-account: %v", err)
		return response.InternalServerError("Failed to create sub-account"), nil
	}

	// Create user-account relationship for the owner
	userAccount := apitypes.UserAccount{
		UserID:    ownerUserID,
		AccountID: newAccountID,
		Role:      "Admin",
		Status:    "Active",
		LinkedAt:  now,
		UpdatedAt: now,
		Permissions: apitypes.UserPermissions{
			CanCreateSubAccounts:  true,
			CanInviteUsers:        true,
			CanManageIntegrations: true,
			CanViewAllData:        true,
			CanManageBilling:      true,
			CanDeleteAccount:      true,
			CanModifySettings:     true,
		},
	}

	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	userAccountItem, err := dynamodbattribute.MarshalMap(userAccount)
	if err != nil {
		log.Printf("Failed to marshal user-account: %v", err)
		return response.InternalServerError("Failed to create user-account relationship"), nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(userAccountsTable),
		Item:      userAccountItem,
	})
	if err != nil {
		log.Printf("Failed to create user-account relationship: %v", err)
		// Clean up the account record
		h.db.DeleteItem(&dynamodb.DeleteItemInput{
			TableName: aws.String(tableName),
			Key: map[string]*dynamodb.AttributeValue{
				"accountId": {S: aws.String(newAccountID)},
			},
		})
		return response.InternalServerError("Failed to create user-account relationship"), nil
	}

	// Strip prefixes for API response
	subAccount.AccountID = strings.TrimPrefix(subAccount.AccountID, "account:")
	if subAccount.ParentAccountID != nil {
		stripped := strings.TrimPrefix(*subAccount.ParentAccountID, "account:")
		subAccount.ParentAccountID = &stripped
	}
	if subAccount.OwnerUserID != "" {
		subAccount.OwnerUserID = strings.TrimPrefix(subAccount.OwnerUserID, "user:")
	}
	if subAccount.CreatedByUserID != "" {
		subAccount.CreatedByUserID = strings.TrimPrefix(subAccount.CreatedByUserID, "user:")
	}

	return response.Created(subAccount), nil
}

func (h *CreateSubAccountHandler) validateUserAccountAccess(ctx context.Context, userID, accountID string) (bool, error) {
	// Query user-accounts table to check if user has access to this account
	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	input := &dynamodb.QueryInput{
		TableName:              aws.String(userAccountsTable),
		KeyConditionExpression: aws.String("userId = :userId AND accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId":    {S: aws.String(userID)},
			":accountId": {S: aws.String(accountID)},
		},
	}

	resp, err := h.db.Query(input)
	if err != nil {
		return false, fmt.Errorf("failed to query user accounts: %v", err)
	}

	return len(resp.Items) > 0, nil
}

func (h *CreateSubAccountHandler) getAccountFromDynamoDB(ctx context.Context, accountID string) (*apitypes.Account, error) {
	tableName := os.Getenv("ACCOUNTS_TABLE")
	key := map[string]*dynamodb.AttributeValue{
		"accountId": {S: aws.String(accountID)},
	}

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
	handler, err := NewCreateSubAccountHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create create sub-account handler: %v", err)
	}

	lambda.Start(handler.Handle)
}