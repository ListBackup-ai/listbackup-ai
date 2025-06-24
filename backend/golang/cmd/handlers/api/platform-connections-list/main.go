package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/platformsdb"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type ListPlatformConnectionsHandler struct {
	db *platformsdb.Client
}

func NewListPlatformConnectionsHandler() (*ListPlatformConnectionsHandler, error) {
	db, err := platformsdb.NewClient()
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

	log.Printf("List platform connections request for platform: %s", platformId)

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

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

	// Get table name from environment
	tableName := os.Getenv("PLATFORM_CONNECTIONS_TABLE")
	if tableName == "" {
		tableName = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platform-connections"
	}

	// Get status filter if provided
	status := event.QueryStringParameters["status"]

	var platformConnections []types.PlatformConnection
	var err error

	if status != "" {
		// Filter by accountId, platformId, and status using GSI
		expressionValues := map[string]*dynamodb.AttributeValue{
			":accountId":  {S: &accountId},
			":platformId": {S: &platformId},
			":status":     {S: &status},
		}
		err = h.db.QueryGSI(tableName, "AccountPlatformStatusIndex", "accountId = :accountId AND platformId = :platformId AND #status = :status", expressionValues, &platformConnections)
	} else {
		// Get all platform connections for this account and platform
		expressionValues := map[string]*dynamodb.AttributeValue{
			":accountId":  {S: &accountId},
			":platformId": {S: &platformId},
		}
		err = h.db.QueryGSI(tableName, "AccountPlatformIndex", "accountId = :accountId AND platformId = :platformId", expressionValues, &platformConnections)
	}

	if err != nil {
		log.Printf("Failed to list platform connections for account %s, platform %s: %v", accountId, platformId, err)
		return response.InternalServerError("Failed to list platform connections"), nil
	}

	// Remove sensitive credential information from response
	for i := range platformConnections {
		platformConnections[i].Credentials = nil
	}

	log.Printf("Found %d platform connections for account %s, platform %s", len(platformConnections), accountId, platformId)
	return response.Success(map[string]interface{}{
		"connections": platformConnections,
		"total":       len(platformConnections),
		"platformId":  platformId,
	}), nil
}

func main() {
	handler, err := NewListPlatformConnectionsHandler()
	if err != nil {
		log.Fatalf("Failed to create list platform connections handler: %v", err)
	}

	lambda.Start(handler.Handle)
}