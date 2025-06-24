package main

import (
	"context"
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
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type DeleteAccountHandler struct {
	db *dynamodb.DynamoDB
}

func NewDeleteAccountHandler(ctx context.Context) (*DeleteAccountHandler, error) {
	sess, err := session.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &DeleteAccountHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *DeleteAccountHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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

	// Get accountId from path parameters
	accountId := event.PathParameters["accountId"]
	if accountId == "" {
		return response.BadRequest("Account ID is required"), nil
	}

	log.Printf("Delete account request for accountId: %s", accountId)

	// Add account: prefix if not present
	if !strings.HasPrefix(accountId, "account:") {
		accountId = "account:" + accountId
	}


	// Get account to check if it exists and has sub-accounts
	account, err := h.getAccountFromDynamoDB(ctx, accountId)
	if err != nil {
		log.Printf("Failed to get account from database: %v", err)
		return response.NotFound("Account not found"), nil
	}


	// Check for sub-accounts (prevent deletion if there are children)
	hasSubAccounts, err := h.hasSubAccounts(ctx, accountId)
	if err != nil {
		log.Printf("Failed to check for sub-accounts: %v", err)
		// For now, log the error but don't block deletion - this is a non-critical check
		log.Printf("Proceeding with deletion despite dependency check failure")
	} else if hasSubAccounts {
		return response.BadRequest("Cannot delete account that has sub-accounts. Please delete or reassign sub-accounts first."), nil
	}

	// Check for active sources or other dependencies
	hasActiveSources, err := h.hasActiveSources(ctx, accountId)
	if err != nil {
		log.Printf("Failed to check for active sources: %v", err)
		// For now, log the error but don't block deletion - this is a non-critical check
		log.Printf("Proceeding with deletion despite sources check failure")
	} else if hasActiveSources {
		return response.BadRequest("Cannot delete account with active data sources. Please remove all sources first."), nil
	}

	// Update any users who have this as their current account to use their primary account
	err = h.updateUsersCurrentAccount(ctx, accountId)
	if err != nil {
		log.Printf("Failed to update users' current account: %v", err)
		return response.InternalServerError("Failed to update user current accounts"), nil
	}

	// Delete all user-account relationships for this account
	err = h.deleteUserAccountRelationships(ctx, accountId)
	if err != nil {
		log.Printf("Failed to delete user-account relationships: %v", err)
		return response.InternalServerError("Failed to clean up account relationships"), nil
	}

	// Delete the account
	tableName := os.Getenv("ACCOUNTS_TABLE")
	accountKey := map[string]*dynamodb.AttributeValue{
		"accountId": {S: aws.String(accountId)},
	}

	_, err = h.db.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key:       accountKey,
	})
	if err != nil {
		log.Printf("Failed to delete account: %v", err)
		return response.InternalServerError("Failed to delete account"), nil
	}

	// Log the deletion
	log.Printf("Account %s successfully deleted by user %s", accountId, userID)

	return response.Success(map[string]interface{}{
		"accountId": strings.TrimPrefix(accountId, "account:"),
		"message":   "Account successfully deleted",
		"deletedAt": account.UpdatedAt,
	}), nil
}

func (h *DeleteAccountHandler) hasDeletePermission(ctx context.Context, userID, accountID string) bool {
	// Check if user has delete permission for this account
	userAccount, err := h.getUserAccountRelation(ctx, userID, accountID)
	if err != nil {
		return false
	}
	return userAccount.Permissions.CanDeleteAccount && userAccount.Role == "Admin"
}

func (h *DeleteAccountHandler) hasSubAccounts(ctx context.Context, accountID string) (bool, error) {
	// Use the GSI ParentAccountIndex to efficiently query for sub-accounts
	tableName := os.Getenv("ACCOUNTS_TABLE")
	input := &dynamodb.QueryInput{
		TableName:     aws.String(tableName),
		IndexName:     aws.String("ParentAccountIndex"),
		KeyConditionExpression: aws.String("parentAccountId = :parentAccountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":parentAccountId": {S: aws.String(accountID)},
		},
		Limit: aws.Int64(1), // We only need to know if any exist
	}

	resp, err := h.db.Query(input)
	if err != nil {
		return false, err
	}

	return len(resp.Items) > 0, nil
}

func (h *DeleteAccountHandler) hasActiveSources(ctx context.Context, accountID string) (bool, error) {
	// Check if account has any active sources using AccountIndex GSI
	sourcesTable := os.Getenv("SOURCES_TABLE")
	input := &dynamodb.QueryInput{
		TableName:     aws.String(sourcesTable),
		IndexName:     aws.String("AccountIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
		Limit: aws.Int64(1), // We only need to know if any exist
	}

	resp, err := h.db.Query(input)
	if err != nil {
		// If sources table doesn't exist yet or query fails, assume no sources
		log.Printf("Warning: Could not check for sources (table may not exist): %v", err)
		return false, nil
	}

	return len(resp.Items) > 0, nil
}

func (h *DeleteAccountHandler) deleteUserAccountRelationships(ctx context.Context, accountID string) error {
	// Query all user-account relationships for this account using AccountIndex GSI
	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	input := &dynamodb.QueryInput{
		TableName:     aws.String(userAccountsTable),
		IndexName:     aws.String("AccountIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
	}

	resp, err := h.db.Query(input)
	if err != nil {
		return err
	}

	// Delete each relationship
	for _, item := range resp.Items {
		// Extract userId and accountId from the item
		userID := *item["userId"].S
		accountID := *item["accountId"].S

		key := map[string]*dynamodb.AttributeValue{
			"userId":    {S: aws.String(userID)},
			"accountId": {S: aws.String(accountID)},
		}

		_, err = h.db.DeleteItem(&dynamodb.DeleteItemInput{
			TableName: aws.String(userAccountsTable),
			Key:       key,
		})
		if err != nil {
			log.Printf("Failed to delete user-account relationship for user %s: %v", userID, err)
			// Continue with other deletions
		}
	}

	return nil
}

func (h *DeleteAccountHandler) getUserAccountRelation(ctx context.Context, userID, accountID string) (*apitypes.UserAccount, error) {
	userAccountsTable := os.Getenv("USER_ACCOUNTS_TABLE")
	key := map[string]*dynamodb.AttributeValue{
		"userId":    {S: aws.String(userID)},
		"accountId": {S: aws.String(accountID)},
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(userAccountsTable),
		Key:       key,
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("user account relationship not found")
	}

	var userAccount apitypes.UserAccount
	err = dynamodbattribute.UnmarshalMap(result.Item, &userAccount)
	if err != nil {
		return nil, err
	}

	return &userAccount, nil
}

func (h *DeleteAccountHandler) getAccountFromDynamoDB(ctx context.Context, accountID string) (*apitypes.Account, error) {
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

func (h *DeleteAccountHandler) updateUsersCurrentAccount(ctx context.Context, accountID string) error {
	// First, find all users who have this account as their current account
	// We need to scan the Users table to find users with currentAccountId = accountID
	usersTable := os.Getenv("USERS_TABLE")
	input := &dynamodb.ScanInput{
		TableName:        aws.String(usersTable),
		FilterExpression: aws.String("currentAccountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
	}

	resp, err := h.db.Scan(input)
	if err != nil {
		return err
	}

	// For each affected user, update their currentAccountId to their primary account
	for _, item := range resp.Items {
		userID := *item["userId"].S
		
		// Primary account ID should be the same as user ID (without the "user:" prefix)
		// Extract the UUID part from userId (remove "user:" prefix)
		primaryAccountID := strings.TrimPrefix(userID, "user:")
		primaryAccountID = "account:" + primaryAccountID

		// First get the user to preserve all other fields
		getUserKey := map[string]*dynamodb.AttributeValue{
			"userId": {S: aws.String(userID)},
		}

		getUserResult, err := h.db.GetItem(&dynamodb.GetItemInput{
			TableName: aws.String(usersTable),
			Key:       getUserKey,
		})
		if err != nil {
			log.Printf("Failed to get user %s: %v", userID, err)
			continue
		}

		if getUserResult.Item == nil {
			log.Printf("User %s not found", userID)
			continue
		}

		var user apitypes.User
		err = dynamodbattribute.UnmarshalMap(getUserResult.Item, &user)
		if err != nil {
			log.Printf("Failed to unmarshal user %s: %v", userID, err)
			continue
		}

		// Update the currentAccountId
		user.CurrentAccountID = primaryAccountID
		
		userItem, err := dynamodbattribute.MarshalMap(user)
		if err != nil {
			log.Printf("Failed to marshal user %s: %v", userID, err)
			continue
		}

		_, err = h.db.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(usersTable),
			Item:      userItem,
		})
		if err != nil {
			log.Printf("Failed to update currentAccountId for user %s: %v", userID, err)
			// Continue with other users
		} else {
			log.Printf("Updated currentAccountId for user %s from %s to primary account %s", userID, accountID, primaryAccountID)
		}
	}

	return nil
}

func main() {
	handler, err := NewDeleteAccountHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create delete account handler: %v", err)
	}

	lambda.Start(handler.Handle)
}