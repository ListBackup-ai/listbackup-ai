package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/google/uuid"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type CreateConnectionHandler struct {
	db *database.DynamoDBClientV1
}

type CreateConnectionRequest struct {
	PlatformID     string                 `json:"platformId"`
	Name           string                 `json:"name"`
	AuthType       string                 `json:"authType"`
	Credentials    map[string]interface{} `json:"credentials"`
	TestConnection bool                   `json:"testConnection,omitempty"`
}

func NewCreateConnectionHandler() (*CreateConnectionHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &CreateConnectionHandler{
		db: db,
	}, nil
}

func (h *CreateConnectionHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract user ID and account ID from auth context (Lambda authorizer)
	var userId, accountId string
	if event.RequestContext.Authorizer != nil {
		if lambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
			if uid, exists := lambda["userId"].(string); exists {
				userId = uid
			}
			if aid, exists := lambda["accountId"].(string); exists {
				accountId = aid
			}
		} else {
			if uid, exists := event.RequestContext.Authorizer["userId"].(string); exists {
				userId = uid
			}
			if aid, exists := event.RequestContext.Authorizer["accountId"].(string); exists {
				accountId = aid
			}
		}
	}

	if userId == "" || accountId == "" {
		return response.Unauthorized("User not authenticated"), nil
	}

	// Parse request body
	var req CreateConnectionRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return response.BadRequest("Invalid request body"), nil
	}

	// Validate required fields
	if req.PlatformID == "" {
		return response.BadRequest("Platform ID is required"), nil
	}
	if req.Name == "" {
		return response.BadRequest("Connection name is required"), nil
	}
	if req.AuthType == "" {
		return response.BadRequest("Auth type is required"), nil
	}
	if len(req.Credentials) == 0 {
		return response.BadRequest("Credentials are required"), nil
	}

	// Add platform: prefix if not present
	if len(req.PlatformID) < 9 || req.PlatformID[:9] != "platform:" {
		req.PlatformID = "platform:" + req.PlatformID
	}

	log.Printf("Create connection request for platform %s, user %s, account %s", req.PlatformID, userId, accountId)

	// Verify platform exists
	key := map[string]*dynamodb.AttributeValue{
		"platformId": database.StringValue(req.PlatformID),
	}
	var platform apitypes.Platform
	err := h.db.GetItem(database.PlatformsTable, key, &platform)
	if err != nil {
		if err.Error() == "item not found" {
			return response.NotFound("Platform not found"), nil
		}
		log.Printf("Failed to get platform %s: %v", req.PlatformID, err)
		return response.InternalServerError("Failed to validate platform"), nil
	}

	// Validate auth type against platform capabilities
	validAuthType := false
	if platform.OAuth != nil && req.AuthType == "oauth" {
		validAuthType = true
	}
	if platform.APIConfig.AuthType == req.AuthType {
		validAuthType = true
	}
	if !validAuthType {
		return response.BadRequest("Invalid auth type for this platform"), nil
	}

	// Generate connection ID
	connectionID := "connection:" + uuid.New().String()

	// TODO: Encrypt credentials before storage
	// For now, we'll store them as-is but this MUST be encrypted in production

	// Create connection object
	now := time.Now()
	connection := apitypes.PlatformConnection{
		ConnectionID: connectionID,
		PlatformID:   req.PlatformID,
		UserID:       userId,
		AccountID:    accountId,
		Name:         req.Name,
		AuthType:     req.AuthType,
		Status:       "active", // Default to active, test if requested
		Credentials:  req.Credentials,
		LastConnected: nil, // Will be set if test is requested
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Test connection if requested
	if req.TestConnection {
		// TODO: Implement connection testing
		// For now, just set lastTested timestamp
		connection.LastConnected = &now
		log.Printf("Connection test requested for %s (not implemented yet)", connectionID)
	}

	// Save connection to database
	err = h.db.PutItem(database.PlatformConnectionsTable, connection)
	if err != nil {
		log.Printf("Failed to create connection: %v", err)
		return response.InternalServerError("Failed to create connection"), nil
	}

	// Remove credentials from response
	connection.Credentials = nil

	log.Printf("Created connection %s for platform %s", connectionID, req.PlatformID)
	return response.Success(map[string]interface{}{
		"connection": connection,
		"message":    "Connection created successfully",
	}), nil
}

func main() {
	handler, err := NewCreateConnectionHandler()
	if err != nil {
		log.Fatalf("Failed to create connection handler: %v", err)
	}

	lambda.Start(handler.Handle)
}