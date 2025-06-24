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

type ListAccountsHandler struct {
	svc             *dynamodb.DynamoDB
	usersTable      string
	accountsTable   string
	userAccountsTable string
}

func NewListAccountsHandler() (*ListAccountsHandler, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &ListAccountsHandler{
		svc:               dynamodb.New(sess),
		usersTable:        os.Getenv("USERS_TABLE"),
		accountsTable:     os.Getenv("ACCOUNTS_TABLE"),
		userAccountsTable: os.Getenv("USER_ACCOUNTS_TABLE"),
	}, nil
}

func (h *ListAccountsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List accounts request")
	log.Printf("DEBUG: RequestContext.Authorizer: %+v", event.RequestContext.Authorizer)

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

	// Get user's accounts from user-accounts table
	accounts, err := h.getUserAccounts(ctx, userID)
	if err != nil {
		log.Printf("Failed to get user accounts: %v", err)
		return response.InternalServerError("Failed to retrieve accounts"), nil
	}

	// Build response with account details
	accountsWithDetails := make([]map[string]interface{}, 0, len(accounts))

	for _, account := range accounts {
		// Build account info
		accountInfo := map[string]interface{}{
			"accountId":   strings.TrimPrefix(account.AccountID, "account:"),
			"name":        account.Name,
			"company":     account.Company,
			"plan":        account.Plan,
			"status":      account.Status,
			"level":       account.Level,
			"accountPath": account.AccountPath,
			
			// Parent account info if applicable
			"parentAccountId": nil,
			"isRootAccount":   account.ParentAccountID == nil,
			
			// Account settings
			"settings": account.Settings,
			"usage":    account.Usage,
			
			// Metadata
			"createdAt": account.CreatedAt,
			"updatedAt": account.UpdatedAt,
		}

		// Add parent account ID if present
		if account.ParentAccountID != nil {
			accountInfo["parentAccountId"] = strings.TrimPrefix(*account.ParentAccountID, "account:")
		}

		accountsWithDetails = append(accountsWithDetails, accountInfo)
	}

	// Build response
	responseData := map[string]interface{}{
		"accounts": accountsWithDetails,
		"total":    len(accountsWithDetails),
	}

	return response.Success(responseData), nil
}

func (h *ListAccountsHandler) getUserAccounts(ctx context.Context, userID string) ([]apitypes.Account, error) {
	// Query user-accounts table to get all accounts for this user
	input := &dynamodb.QueryInput{
		TableName:              aws.String(h.userAccountsTable),
		KeyConditionExpression: aws.String("userId = :userId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId": {
				S: aws.String(userID),
			},
		},
	}

	resp, err := h.svc.QueryWithContext(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to query user accounts: %v", err)
	}

	var accounts []apitypes.Account
	
	// For each user-account relationship, get the account details
	for _, item := range resp.Items {
		if accountIDAttr, ok := item["accountId"]; ok && accountIDAttr.S != nil {
			accountID := *accountIDAttr.S
			
			// Get account details
			account, err := h.getAccountFromDynamoDB(ctx, accountID)
			if err != nil {
				log.Printf("Failed to get account %s: %v", accountID, err)
				continue
			}
			
			accounts = append(accounts, *account)
		}
	}

	return accounts, nil
}

func (h *ListAccountsHandler) getAccountFromDynamoDB(ctx context.Context, accountID string) (*apitypes.Account, error) {
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
	handler, err := NewListAccountsHandler()
	if err != nil {
		log.Fatalf("Failed to create list accounts handler: %v", err)
	}

	lambda.Start(handler.Handle)
}