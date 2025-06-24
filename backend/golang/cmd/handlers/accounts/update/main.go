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
	apitypes "github.com/listbackup/api/internal/types"
	internalutils "github.com/listbackup/api/internal/utils"
	"github.com/listbackup/api/pkg/response"
)

type UpdateAccountHandler struct {
	db *dynamodb.DynamoDB
}

type UpdateAccountRequest struct {
	Name     string                      `json:"name,omitempty"`
	Company  string                      `json:"company,omitempty"`
	Settings *apitypes.AccountSettings   `json:"settings,omitempty"`
}

func NewUpdateAccountHandler(ctx context.Context) (*UpdateAccountHandler, error) {
	sess, err := session.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &UpdateAccountHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *UpdateAccountHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract accountId from path parameters
	accountID := event.PathParameters["accountId"]
	if accountID == "" {
		log.Printf("No accountId provided in path parameters")
		return response.BadRequest("Account ID is required"), nil
	}

	log.Printf("Update account request for accountId: %s", accountID)

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

	// Parse request body
	var updateReq UpdateAccountRequest
	if err := internalutils.ParseJSONBody(event, &updateReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return response.BadRequest("Invalid JSON format in request body"), nil
	}

	// Build update expression
	updateExpression := "SET updatedAt = :updatedAt"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":updatedAt": {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
	}

	if updateReq.Name != "" {
		updateExpression += ", #name = :name"
		expressionAttributeValues[":name"] = &dynamodb.AttributeValue{S: aws.String(updateReq.Name)}
	}

	if updateReq.Company != "" {
		updateExpression += ", company = :company"
		expressionAttributeValues[":company"] = &dynamodb.AttributeValue{S: aws.String(updateReq.Company)}
	}

	if updateReq.Settings != nil {
		// Convert settings to DynamoDB format
		settingsItem, err := dynamodbattribute.MarshalMap(*updateReq.Settings)
		if err != nil {
			log.Printf("Failed to marshal settings: %v", err)
			return response.InternalServerError("Failed to process settings"), nil
		}
		updateExpression += ", settings = :settings"
		expressionAttributeValues[":settings"] = &dynamodb.AttributeValue{M: settingsItem}
	}

	expressionAttributeNames := map[string]*string{
		"#name": aws.String("name"), // name is a reserved word in DynamoDB
	}

	// Update the account
	tableName := os.Getenv("ACCOUNTS_TABLE")
	input := &dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"accountId": {S: aws.String(accountID)},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
		ExpressionAttributeNames:  expressionAttributeNames,
		ReturnValues:              aws.String("ALL_NEW"),
	}

	result, err := h.db.UpdateItem(input)
	if err != nil {
		log.Printf("Failed to update account: %v", err)
		return response.InternalServerError("Failed to update account"), nil
	}

	// Unmarshal the updated account
	var updatedAccount apitypes.Account
	err = dynamodbattribute.UnmarshalMap(result.Attributes, &updatedAccount)
	if err != nil {
		log.Printf("Failed to unmarshal updated account: %v", err)
		return response.InternalServerError("Failed to process updated account"), nil
	}

	// Strip prefixes for API response
	updatedAccount.AccountID = strings.TrimPrefix(updatedAccount.AccountID, "account:")
	if updatedAccount.ParentAccountID != nil {
		stripped := strings.TrimPrefix(*updatedAccount.ParentAccountID, "account:")
		updatedAccount.ParentAccountID = &stripped
	}
	if updatedAccount.OwnerUserID != "" {
		updatedAccount.OwnerUserID = strings.TrimPrefix(updatedAccount.OwnerUserID, "user:")
	}
	if updatedAccount.CreatedByUserID != "" {
		updatedAccount.CreatedByUserID = strings.TrimPrefix(updatedAccount.CreatedByUserID, "user:")
	}

	return response.Success(updatedAccount), nil
}

func (h *UpdateAccountHandler) validateUserAccountAccess(ctx context.Context, userID, accountID string) (bool, error) {
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

func main() {
	handler, err := NewUpdateAccountHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create update account handler: %v", err)
	}

	lambda.Start(handler.Handle)
}