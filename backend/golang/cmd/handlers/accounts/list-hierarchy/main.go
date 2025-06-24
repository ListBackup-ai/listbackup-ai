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

type ListHierarchyHandler struct {
	db *dynamodb.DynamoDB
}

func NewListHierarchyHandler(ctx context.Context) (*ListHierarchyHandler, error) {
	sess, err := session.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &ListHierarchyHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *ListHierarchyHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract accountId from path parameters
	accountID := event.PathParameters["accountId"]
	if accountID == "" {
		log.Printf("No accountId provided in path parameters")
		return response.BadRequest("Account ID is required"), nil
	}

	log.Printf("List account hierarchy request for accountId: %s", accountID)

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

	// Ensure account: prefix
	if !strings.HasPrefix(accountID, "account:") {
		accountID = "account:" + accountID
	}

	// Validate user has access to the requested account
	hasAccess, err := h.validateUserAccountAccess(ctx, userID, accountID)
	if err != nil {
		log.Printf("Failed to validate user access: %v", err)
		return response.InternalServerError("Failed to validate access"), nil
	}
	if !hasAccess {
		log.Printf("User %s does not have access to account %s", userID, accountID)
		return response.Forbidden("You do not have access to this account"), nil
	}

	// Get the root account
	rootAccount, err := h.getAccountFromDynamoDB(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get root account: %v", err)
		return response.NotFound("Account not found"), nil
	}

	// Get account hierarchy starting from this account
	hierarchy, err := h.getAccountHierarchy(ctx, accountID, rootAccount.AccountPath)
	if err != nil {
		log.Printf("Failed to get account hierarchy: %v", err)
		return response.InternalServerError("Failed to get account hierarchy"), nil
	}

	// Strip prefixes for API response
	for i := range hierarchy {
		hierarchy[i].AccountID = strings.TrimPrefix(hierarchy[i].AccountID, "account:")
		if hierarchy[i].ParentAccountID != nil {
			stripped := strings.TrimPrefix(*hierarchy[i].ParentAccountID, "account:")
			hierarchy[i].ParentAccountID = &stripped
		}
		if hierarchy[i].OwnerUserID != "" {
			hierarchy[i].OwnerUserID = strings.TrimPrefix(hierarchy[i].OwnerUserID, "user:")
		}
		if hierarchy[i].CreatedByUserID != "" {
			hierarchy[i].CreatedByUserID = strings.TrimPrefix(hierarchy[i].CreatedByUserID, "user:")
		}
	}

	return response.Success(map[string]interface{}{
		"hierarchy": hierarchy,
		"total":     len(hierarchy),
	}), nil
}

func (h *ListHierarchyHandler) validateUserAccountAccess(ctx context.Context, userID, accountID string) (bool, error) {
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

func (h *ListHierarchyHandler) getAccountFromDynamoDB(ctx context.Context, accountID string) (*apitypes.Account, error) {
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

func (h *ListHierarchyHandler) getAccountHierarchy(ctx context.Context, rootAccountID, accountPath string) ([]apitypes.Account, error) {
	var hierarchy []apitypes.Account

	// First, add the root account itself
	rootAccount, err := h.getAccountFromDynamoDB(ctx, rootAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get root account: %v", err)
	}
	hierarchy = append(hierarchy, *rootAccount)

	// Now find all descendants using the accountPath
	// Use a scan with filter expression to find accounts whose path starts with the root path
	tableName := os.Getenv("ACCOUNTS_TABLE")
	input := &dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("begins_with(accountPath, :path) AND accountId <> :rootId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":path":   {S: aws.String(accountPath)},
			":rootId": {S: aws.String(rootAccountID)},
		},
	}

	resp, err := h.db.Scan(input)
	if err != nil {
		return nil, fmt.Errorf("failed to scan for child accounts: %v", err)
	}

	// Unmarshal child accounts
	for _, item := range resp.Items {
		var account apitypes.Account
		err := dynamodbattribute.UnmarshalMap(item, &account)
		if err != nil {
			log.Printf("Failed to unmarshal account: %v", err)
			continue
		}
		hierarchy = append(hierarchy, account)
	}

	return hierarchy, nil
}

func main() {
	handler, err := NewListHierarchyHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create list hierarchy handler: %v", err)
	}

	lambda.Start(handler.Handle)
}