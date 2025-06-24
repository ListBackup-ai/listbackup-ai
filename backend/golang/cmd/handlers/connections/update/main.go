package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type UpdateConnectionHandler struct {
	db *database.DynamoDBClientV1
}

type UpdateConnectionRequest struct {
	Name           *string                 `json:"name,omitempty"`
	Status         *string                 `json:"status,omitempty"`
	Credentials    *map[string]interface{} `json:"credentials,omitempty"`
	TestConnection *bool                   `json:"testConnection,omitempty"`
}

func NewUpdateConnectionHandler() (*UpdateConnectionHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &UpdateConnectionHandler{
		db: db,
	}, nil
}

func (h *UpdateConnectionHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	connectionId := event.PathParameters["connectionId"]
	if connectionId == "" {
		return response.BadRequest("Connection ID is required"), nil
	}

	// Add connection: prefix if not present
	if len(connectionId) < 11 || connectionId[:11] != "connection:" {
		connectionId = "connection:" + connectionId
	}

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
	var req UpdateConnectionRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return response.BadRequest("Invalid request body"), nil
	}

	log.Printf("Update connection request: %s for user %s, account %s", connectionId, userId, accountId)

	// Get existing connection
	key := map[string]*dynamodb.AttributeValue{
		"connectionId": database.StringValue(connectionId),
	}

	var connection apitypes.PlatformConnection
	err := h.db.GetItem(database.PlatformConnectionsTable, key, &connection)
	if err != nil {
		log.Printf("Failed to get connection %s: %v", connectionId, err)
		if err.Error() == "item not found" {
			return response.NotFound("Connection not found"), nil
		}
		return response.InternalServerError("Failed to get connection"), nil
	}

	// Verify the connection belongs to the authenticated user and account
	if connection.UserID != userId {
		return response.Forbidden("Access denied: connection belongs to different user"), nil
	}
	if connection.AccountID != accountId {
		return response.Forbidden("Access denied: connection belongs to different account"), nil
	}

	// Update fields if provided
	updated := false
	if req.Name != nil && *req.Name != connection.Name {
		connection.Name = *req.Name
		updated = true
	}
	if req.Status != nil && *req.Status != connection.Status {
		// Validate status
		if *req.Status != "active" && *req.Status != "inactive" && *req.Status != "error" {
			return response.BadRequest("Invalid status. Must be: active, inactive, or error"), nil
		}
		connection.Status = *req.Status
		updated = true
	}
	if req.Credentials != nil {
		// TODO: Encrypt credentials before storage
		connection.Credentials = *req.Credentials
		updated = true
	}

	// Test connection if requested
	if req.TestConnection != nil && *req.TestConnection {
		// TODO: Implement connection testing
		now := time.Now()
		connection.LastConnected = &now
		updated = true
		log.Printf("Connection test requested for %s (not implemented yet)", connectionId)
	}

	if updated {
		connection.UpdatedAt = time.Now()

		// Save updated connection
		err = h.db.PutItem(database.PlatformConnectionsTable, connection)
		if err != nil {
			log.Printf("Failed to update connection: %v", err)
			return response.InternalServerError("Failed to update connection"), nil
		}
	}

	// Remove credentials from response
	connection.Credentials = nil

	log.Printf("Updated connection %s", connectionId)
	return response.Success(map[string]interface{}{
		"connection": connection,
		"message":    "Connection updated successfully",
	}), nil
}

func main() {
	handler, err := NewUpdateConnectionHandler()
	if err != nil {
		log.Fatalf("Failed to create update connection handler: %v", err)
	}

	lambda.Start(handler.Handle)
}