package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type GrantAccountAccessHandler struct {
	db *database.DynamoDBClientV1
}

type GrantAccountAccessRequest struct {
	AccountID   string                           `json:"accountId"`
	Role        string                           `json:"role"`        // read|write|admin
	Permissions apitypes.ClientAccountPermissions `json:"permissions"`
}

func NewGrantAccountAccessHandler() (*GrantAccountAccessHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &GrantAccountAccessHandler{
		db: db,
	}, nil
}

func (h *GrantAccountAccessHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract user ID from JWT claims
	var userID, accountID string
	if event.RequestContext.Authorizer != nil {
		if lambdaAuth, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
			if uid, exists := lambdaAuth["userId"].(string); exists {
				userID = uid
			}
			if aid, exists := lambdaAuth["accountId"].(string); exists {
				accountID = aid
			}
		} else {
			if uid, exists := event.RequestContext.Authorizer["userId"].(string); exists {
				userID = uid
			}
			if aid, exists := event.RequestContext.Authorizer["accountId"].(string); exists {
				accountID = aid
			}
		}
	}

	if userID == "" || accountID == "" {
		return response.Unauthorized("Authentication required"), nil
	}

	// Get client ID from path parameters
	clientID, exists := event.PathParameters["clientId"]
	if !exists || clientID == "" {
		return response.BadRequest("Client ID is required"), nil
	}

	// Parse request body
	var req GrantAccountAccessRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return response.BadRequest("Invalid request body"), nil
	}

	// Validate required fields
	if req.AccountID == "" || req.Role == "" {
		return response.BadRequest("Account ID and role are required"), nil
	}

	log.Printf("Grant account access for client %s to account %s by user %s", clientID, req.AccountID, userID)

	// Verify client exists
	clientKey := map[string]*dynamodb.AttributeValue{
		"clientId": {
			S: aws.String(clientID),
		},
	}

	var client apitypes.Client
	err := h.db.GetItem(database.ClientsTable, clientKey, &client)
	if err != nil {
		log.Printf("Failed to get client %s: %v", clientID, err)
		if err.Error() == "item not found" {
			return response.NotFound("Client not found"), nil
		}
		return response.InternalServerError("Failed to verify client"), nil
	}

	// Create client-account relationship
	now := time.Now().Unix()
	clientAccount := apitypes.ClientAccount{
		ClientID:    clientID,
		AccountID:   req.AccountID,
		Role:        req.Role,
		Permissions: req.Permissions,
		GrantedBy:   userID,
		GrantedAt:   now,
		UpdatedAt:   now,
	}

	// Save to database
	if err := h.db.PutItem(database.ClientAccountsTable, clientAccount); err != nil {
		log.Printf("Failed to grant account access: %v", err)
		return response.InternalServerError("Failed to grant account access"), nil
	}

	log.Printf("Successfully granted account %s access to client %s", req.AccountID, clientID)

	responseData := map[string]interface{}{
		"clientId":    clientID,
		"accountId":   req.AccountID,
		"role":        req.Role,
		"permissions": req.Permissions,
		"grantedBy":   userID,
		"grantedAt":   now,
		"message":     "Account access granted successfully",
	}

	return response.Success(responseData), nil
}

func main() {
	handler, err := NewGrantAccountAccessHandler()
	if err != nil {
		log.Fatalf("Failed to create grant account access handler: %v", err)
	}

	lambda.Start(handler.Handle)
}