package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/listbackup/api/internal/platformsdb"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type CreatePlatformConnectionHandler struct {
	db *platformsdb.Client
}

type CreateConnectionRequest struct {
	Name        string                 `json:"name"`
	AuthType    string                 `json:"authType"`    // oauth|apikey|basic
	Credentials map[string]interface{} `json:"credentials"` // Auth data (will be encrypted)
}

func NewCreatePlatformConnectionHandler() (*CreatePlatformConnectionHandler, error) {
	db, err := platformsdb.NewClient()
	if err != nil {
		return nil, err
	}

	return &CreatePlatformConnectionHandler{
		db: db,
	}, nil
}

func (h *CreatePlatformConnectionHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	platformId := event.PathParameters["platformId"]
	if platformId == "" {
		return response.BadRequest("Platform ID is required"), nil
	}

	log.Printf("Create platform connection request for platform: %s", platformId)

	// Extract auth context (accountId and userId)
	var userId, accountId string
	if event.RequestContext.Authorizer != nil {
		if authLambda := event.RequestContext.Authorizer["lambda"]; authLambda != nil {
			if authData, ok := authLambda.(map[string]interface{}); ok {
				if uid, exists := authData["userId"]; exists {
					if userIdStr, ok := uid.(string); ok {
						userId = userIdStr
					}
				}
				if aid, exists := authData["accountId"]; exists {
					if accountIdStr, ok := aid.(string); ok {
						accountId = accountIdStr
					}
				}
			}
		} else {
			// Direct authorizer format
			if uid, exists := event.RequestContext.Authorizer["userId"]; exists {
				if userIdStr, ok := uid.(string); ok {
					userId = userIdStr
				}
			}
			if aid, exists := event.RequestContext.Authorizer["accountId"]; exists {
				if accountIdStr, ok := aid.(string); ok {
					accountId = accountIdStr
				}
			}
		}
	}

	if userId == "" || accountId == "" {
		return response.Unauthorized("Authentication required"), nil
	}

	// Parse request body
	var req CreateConnectionRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return response.BadRequest("Invalid request body"), nil
	}

	// Validate required fields
	if req.Name == "" {
		return response.BadRequest("Connection name is required"), nil
	}
	if req.AuthType == "" {
		return response.BadRequest("Auth type is required"), nil
	}
	if req.Credentials == nil || len(req.Credentials) == 0 {
		return response.BadRequest("Credentials are required"), nil
	}

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

	// Verify platform exists
	platformsTableName := os.Getenv("PLATFORMS_TABLE")
	if platformsTableName == "" {
		platformsTableName = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}

	// TODO: In production, we should verify the platform exists
	// For now, we'll assume it exists if it has the proper prefix

	// Create new connection
	connectionId := "connection:" + uuid.New().String()
	now := time.Now()

	connection := types.PlatformConnection{
		ConnectionID: connectionId,
		AccountID:    accountId,
		UserID:       userId,
		PlatformID:   platformId,
		Name:         req.Name,
		Status:       "active", // Start as active, will be validated later
		AuthType:     req.AuthType,
		Credentials:  req.Credentials, // In production, these should be encrypted
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Save to database
	tableName := os.Getenv("PLATFORM_CONNECTIONS_TABLE")
	if tableName == "" {
		tableName = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platform-connections"
	}

	err := h.db.PutItem(tableName, connection)
	if err != nil {
		log.Printf("Failed to create platform connection: %v", err)
		return response.InternalServerError("Failed to create platform connection"), nil
	}

	// Remove sensitive credentials from response
	connection.Credentials = nil

	log.Printf("Created platform connection %s for account %s, platform %s", connectionId, accountId, platformId)
	return response.Success(map[string]interface{}{
		"connection": connection,
		"message":    fmt.Sprintf("Platform connection '%s' created successfully", req.Name),
	}), nil
}

func main() {
	handler, err := NewCreatePlatformConnectionHandler()
	if err != nil {
		log.Fatalf("Failed to create platform connections handler: %v", err)
	}

	lambda.Start(handler.Handle)
}