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

type GetAccountHandler struct {
	svc               *dynamodb.DynamoDB
	accountsTable     string
	userAccountsTable string
}

func NewGetAccountHandler() (*GetAccountHandler, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &GetAccountHandler{
		svc:               dynamodb.New(sess),
		accountsTable:     os.Getenv("ACCOUNTS_TABLE"),
		userAccountsTable: os.Getenv("USER_ACCOUNTS_TABLE"),
	}, nil
}

func (h *GetAccountHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract accountId from path parameters
	accountID := event.PathParameters["accountId"]
	if accountID == "" {
		log.Printf("No accountId provided in path parameters")
		return response.BadRequest("Account ID is required"), nil
	}

	log.Printf("Get account request for accountId: %s", accountID)

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

	// Ensure account: prefix for accountID
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

	// Get account from DynamoDB
	account, err := h.getAccountFromDynamoDB(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get account: %v", err)
		return response.NotFound("Account not found"), nil
	}

	// Strip prefixes for API response
	account.AccountID = strings.TrimPrefix(account.AccountID, "account:")
	if account.ParentAccountID != nil {
		stripped := strings.TrimPrefix(*account.ParentAccountID, "account:")
		account.ParentAccountID = &stripped
	}
	if account.OwnerUserID != "" {
		account.OwnerUserID = strings.TrimPrefix(account.OwnerUserID, "user:")
	}
	if account.CreatedByUserID != "" {
		account.CreatedByUserID = strings.TrimPrefix(account.CreatedByUserID, "user:")
	}

	return response.Success(account), nil
}

func (h *GetAccountHandler) validateUserAccountAccess(ctx context.Context, userID, accountID string) (bool, error) {
	// Query user-accounts table to check if user has access to this account
	input := &dynamodb.QueryInput{
		TableName:              aws.String(h.userAccountsTable),
		KeyConditionExpression: aws.String("userId = :userId AND accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId": {
				S: aws.String(userID),
			},
			":accountId": {
				S: aws.String(accountID),
			},
		},
	}

	resp, err := h.svc.QueryWithContext(ctx, input)
	if err != nil {
		return false, fmt.Errorf("failed to query user accounts: %v", err)
	}

	return len(resp.Items) > 0, nil
}

func (h *GetAccountHandler) getAccountFromDynamoDB(ctx context.Context, accountID string) (*apitypes.Account, error) {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(h.accountsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"accountId": {
				S: aws.String(accountID),
			},
		},
	}

	result, err := h.svc.GetItemWithContext(ctx, input)
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("account not found")
	}

	var account apitypes.Account
	err = dynamodbattribute.UnmarshalMap(result.Item, &account)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal account: %v", err)
	}

	return &account, nil
}

func main() {
	handler, err := NewGetAccountHandler()
	if err != nil {
		log.Fatalf("Failed to create get account handler: %v", err)
	}

	lambda.Start(handler.Handle)
}