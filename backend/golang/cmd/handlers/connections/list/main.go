package main

import (
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/database"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type ListConnectionsHandler struct {
	db *database.DynamoDBClientV1
}

func NewListConnectionsHandler() (*ListConnectionsHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &ListConnectionsHandler{
		db: db,
	}, nil
}

func (h *ListConnectionsHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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

	// Get query parameters for filtering
	platformId := event.QueryStringParameters["platformId"]
	status := event.QueryStringParameters["status"]
	authType := event.QueryStringParameters["authType"]

	log.Printf("List connections request for user %s, account %s", userId, accountId)

	var connections []types.PlatformConnection
	var err error

	if platformId != "" {
		// Add platform: prefix if not present
		if len(platformId) < 9 || platformId[:9] != "platform:" {
			platformId = "platform:" + platformId
		}
		
		// Filter by platform using GSI
		err = h.db.QueryGSI(database.PlatformConnectionsTable, "PlatformIndex", "platformId = :platformId", map[string]*dynamodb.AttributeValue{
			":platformId": database.StringValue(platformId),
		}, &connections)
		
		// Filter by user and account in memory
		connections = h.filterByUserAndAccount(connections, userId, accountId)
	} else {
		// Get all connections for this user and account
		err = h.db.QueryGSI(database.PlatformConnectionsTable, "UserIndex", "userId = :userId", map[string]*dynamodb.AttributeValue{
			":userId": database.StringValue(userId),
		}, &connections)
		
		// Filter by account in memory
		connections = h.filterByAccount(connections, accountId)
	}

	if err != nil {
		log.Printf("Failed to list connections: %v", err)
		return response.InternalServerError("Failed to list connections"), nil
	}

	// Apply additional filters
	if status != "" {
		connections = h.filterByStatus(connections, status)
	}
	if authType != "" {
		connections = h.filterByAuthType(connections, authType)
	}

	// Remove sensitive credential information
	for i := range connections {
		connections[i].Credentials = nil
	}

	log.Printf("Found %d connections for user %s, account %s", len(connections), userId, accountId)
	return response.Success(map[string]interface{}{
		"connections": connections,
		"total":       len(connections),
		"filters": map[string]interface{}{
			"platformId": platformId,
			"status":     status,
			"authType":   authType,
		},
	}), nil
}

func (h *ListConnectionsHandler) filterByUserAndAccount(connections []types.PlatformConnection, userID, accountID string) []types.PlatformConnection {
	var filtered []types.PlatformConnection
	for _, conn := range connections {
		if conn.UserID == userID && conn.AccountID == accountID {
			filtered = append(filtered, conn)
		}
	}
	return filtered
}

func (h *ListConnectionsHandler) filterByAccount(connections []types.PlatformConnection, accountID string) []types.PlatformConnection {
	var filtered []types.PlatformConnection
	for _, conn := range connections {
		if conn.AccountID == accountID {
			filtered = append(filtered, conn)
		}
	}
	return filtered
}

func (h *ListConnectionsHandler) filterByStatus(connections []types.PlatformConnection, status string) []types.PlatformConnection {
	var filtered []types.PlatformConnection
	for _, conn := range connections {
		if conn.Status == status {
			filtered = append(filtered, conn)
		}
	}
	return filtered
}

func (h *ListConnectionsHandler) filterByAuthType(connections []types.PlatformConnection, authType string) []types.PlatformConnection {
	var filtered []types.PlatformConnection
	for _, conn := range connections {
		if conn.AuthType == authType {
			filtered = append(filtered, conn)
		}
	}
	return filtered
}

func main() {
	handler, err := NewListConnectionsHandler()
	if err != nil {
		log.Fatalf("Failed to create list connections handler: %v", err)
	}

	lambda.Start(handler.Handle)
}