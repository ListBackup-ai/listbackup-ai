package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	internalutils "github.com/listbackup/api/internal/utils"
	"github.com/listbackup/api/pkg/response"
)

type CreatePlatformConnectionHandler struct {
	db *database.DynamoDBClient
}

type CreateConnectionRequest struct {
	Name        string                 `json:"name"`
	AuthType    string                 `json:"authType"`    // oauth|apikey|basic
	Credentials map[string]interface{} `json:"credentials"` // Auth credentials
}

func NewCreatePlatformConnectionHandler(ctx context.Context) (*CreatePlatformConnectionHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
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

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

	log.Printf("Create platform connection request for platform: %s", platformId)

	// Extract user ID and account ID from JWT claims
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

	// Get user's current account
	user, err := h.getUserFromDB(ctx, userID)
	if err != nil {
		log.Printf("Failed to get user: %v", err)
		return response.InternalServerError("Failed to get user account"), nil
	}

	accountID := user.CurrentAccountID
	if accountID == "" {
		return response.BadRequest("User has no current account"), nil
	}

	// Parse request body
	var createReq CreateConnectionRequest
	if err := internalutils.ParseJSONBody(event, &createReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return response.BadRequest("Invalid JSON format in request body"), nil
	}

	// Validate required fields
	if createReq.Name == "" {
		return response.BadRequest("Connection name is required"), nil
	}
	if createReq.AuthType == "" {
		return response.BadRequest("Auth type is required"), nil
	}
	if createReq.Credentials == nil {
		return response.BadRequest("Credentials are required"), nil
	}

	// Verify platform exists
	platform, err := h.getPlatformFromDB(ctx, platformId)
	if err != nil {
		log.Printf("Failed to get platform: %v", err)
		return response.BadRequest("Platform not found"), nil
	}

	// Validate auth type matches platform
	if !h.isValidAuthType(platform, createReq.AuthType) {
		return response.BadRequest(fmt.Sprintf("Auth type %s not supported for platform %s", createReq.AuthType, platform.Name)), nil
	}

	// Create platform connection record
	connectionID := fmt.Sprintf("connection:%s", uuid.New().String())
	timestamp := time.Now()

	connection := apitypes.PlatformConnection{
		ConnectionID: connectionID,
		AccountID:    accountID,
		UserID:       userID,
		PlatformID:   platformId,
		Name:         createReq.Name,
		Status:       "active",
		AuthType:     createReq.AuthType,
		Credentials:  createReq.Credentials, // TODO: Encrypt before storing
		CreatedAt:    timestamp,
		UpdatedAt:    timestamp,
	}

	// Set expiration for OAuth tokens if applicable
	if createReq.AuthType == "oauth" {
		if expiresIn, ok := createReq.Credentials["expires_in"].(float64); ok {
			expiresAt := timestamp.Add(time.Duration(expiresIn) * time.Second)
			connection.ExpiresAt = &expiresAt
		}
	}

	// Save to DynamoDB
	err = h.db.PutItem(ctx, database.PlatformConnectionsTable, connection)
	if err != nil {
		log.Printf("Failed to save platform connection: %v", err)
		return response.InternalServerError("Failed to create platform connection"), nil
	}

	// Remove sensitive credentials from response
	connection.Credentials = nil

	// Strip connection: prefix for API response
	connection.ConnectionID = strings.TrimPrefix(connection.ConnectionID, "connection:")

	log.Printf("Created platform connection %s for platform %s", connection.ConnectionID, platformId)
	return response.Created(connection), nil
}

func (h *CreatePlatformConnectionHandler) getUserFromDB(ctx context.Context, userID string) (*apitypes.User, error) {
	key := map[string]types.AttributeValue{
		"userId": &types.AttributeValueMemberS{Value: userID},
	}

	var user apitypes.User
	err := h.db.GetItem(ctx, database.UsersTable, key, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (h *CreatePlatformConnectionHandler) getPlatformFromDB(ctx context.Context, platformID string) (*apitypes.Platform, error) {
	key := map[string]types.AttributeValue{
		"platformId": &types.AttributeValueMemberS{Value: platformID},
	}

	var platform apitypes.Platform
	err := h.db.GetItem(ctx, database.PlatformsTable, key, &platform)
	if err != nil {
		return nil, err
	}

	return &platform, nil
}

func (h *CreatePlatformConnectionHandler) isValidAuthType(platform *apitypes.Platform, authType string) bool {
	switch authType {
	case "oauth":
		return platform.OAuth != nil
	case "apikey", "basic":
		return platform.APIConfig.AuthType == authType || platform.APIConfig.AuthType == "multiple"
	default:
		return false
	}
}

func main() {
	handler, err := NewCreatePlatformConnectionHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create platform connection handler: %v", err)
	}

	lambda.Start(handler.Handle)
}