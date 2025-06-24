package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/internal/database"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type ListPlatformConnectionsHandler struct {
	db *database.DynamoDBClient
}

func NewListPlatformConnectionsHandler(ctx context.Context) (*ListPlatformConnectionsHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		return nil, err
	}

	return &ListPlatformConnectionsHandler{
		db: db,
	}, nil
}

func (h *ListPlatformConnectionsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	platformId := event.PathParameters["platformId"]
	if platformId == "" {
		return response.BadRequest("Platform ID is required"), nil
	}

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

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

	log.Printf("List platform connections request for platform %s, user %s", platformId, userID)

	// Get user's platform connections for this platform
	// First get all connections for this platform, then filter by user
	var allConnections []types.PlatformConnection
	err := h.db.QueryGSI(ctx, database.PlatformConnectionsTable, "PlatformIndex", "platformId = :platformId", map[string]interface{}{
		":platformId": platformId,
	}, &allConnections)

	if err != nil {
		log.Printf("Failed to list platform connections: %v", err)
		return response.InternalServerError("Failed to list platform connections"), nil
	}

	// Filter connections by user
	var userConnections []types.PlatformConnection
	for _, conn := range allConnections {
		if conn.UserID == userID {
			// Remove sensitive credential information
			conn.Credentials = nil
			userConnections = append(userConnections, conn)
		}
	}

	log.Printf("Found %d platform connections for user %s on platform %s", len(userConnections), userID, platformId)
	return response.Success(map[string]interface{}{
		"connections": userConnections,
		"total":       len(userConnections),
		"platformId":  platformId,
	}), nil
}

func main() {
	handler, err := NewListPlatformConnectionsHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create list platform connections handler: %v", err)
	}

	lambda.Start(handler.Handle)
}