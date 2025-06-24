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
	internalutils "github.com/listbackup/api/internal/utils"
	"github.com/listbackup/api/pkg/response"
)

type SwitchContextHandler struct {
	db *dynamodb.DynamoDB
}

type SwitchContextRequest struct {
	AccountID string `json:"accountId"`
}

func NewSwitchContextHandler(ctx context.Context) (*SwitchContextHandler, error) {
	sess, err := session.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &SwitchContextHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *SwitchContextHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Switch account context request")

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

	// Parse request body
	var switchReq SwitchContextRequest
	if err := internalutils.ParseJSONBody(event, &switchReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return response.BadRequest("Invalid JSON format in request body"), nil
	}

	// Validate required fields
	if switchReq.AccountID == "" {
		return response.BadRequest("Account ID is required"), nil
	}

	// Ensure account: prefix for target account
	targetAccountID := switchReq.AccountID
	if !strings.HasPrefix(targetAccountID, "account:") {
		targetAccountID = "account:" + targetAccountID
	}

	// Validate user has access to the target account
	hasAccess, userAccount, err := h.validateUserAccountAccessWithDetails(ctx, userID, targetAccountID)
	if err != nil {
		log.Printf("Failed to validate user access: %v", err)
		return response.InternalServerError("Failed to validate access"), nil
	}
	if !hasAccess {
		log.Printf("User %s does not have access to account %s", userID, targetAccountID)
		return response.Forbidden("You do not have access to the requested account"), nil
	}

	// Get account details
	account, err := h.getAccountFromDynamoDB(ctx, targetAccountID)
	if err != nil {
		log.Printf("Failed to get target account: %v", err)
		return response.NotFound("Account not found"), nil
	}

	// Build auth context response
	authContext := map[string]interface{}{
		"userId":      strings.TrimPrefix(userID, "user:"),
		"accountId":   strings.TrimPrefix(targetAccountID, "account:"),
		"accountName": account.Name,
		"role":        userAccount.Role,
		"permissions": userAccount.Permissions,
		"accountPath": account.AccountPath,
		"level":       account.Level,
	}

	// Return new auth context
	return response.Success(map[string]interface{}{
		"authContext": authContext,
		"message":     fmt.Sprintf("Successfully switched to account: %s", account.Name),
	}), nil
}

func (h *SwitchContextHandler) validateUserAccountAccessWithDetails(ctx context.Context, userID, accountID string) (bool, *apitypes.UserAccount, error) {
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
		return false, nil, fmt.Errorf("failed to query user accounts: %v", err)
	}

	if len(resp.Items) == 0 {
		return false, nil, nil
	}

	// Unmarshal user account details
	var userAccount apitypes.UserAccount
	err = dynamodbattribute.UnmarshalMap(resp.Items[0], &userAccount)
	if err != nil {
		return false, nil, fmt.Errorf("failed to unmarshal user account: %v", err)
	}

	return true, &userAccount, nil
}

func (h *SwitchContextHandler) getAccountFromDynamoDB(ctx context.Context, accountID string) (*apitypes.Account, error) {
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
	handler, err := NewSwitchContextHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create switch context handler: %v", err)
	}

	lambda.Start(handler.Handle)
}