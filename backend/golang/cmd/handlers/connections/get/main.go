package main

import (
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type GetConnectionHandler struct {
	db *database.DynamoDBClientV1
}

func NewGetConnectionHandler() (*GetConnectionHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &GetConnectionHandler{
		db: db,
	}, nil
}

func (h *GetConnectionHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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

	log.Printf("Get connection request: %s for user %s, account %s", connectionId, userId, accountId)

	// Get connection
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

	// Remove sensitive credential information from response
	connection.Credentials = nil

	return response.Success(connection), nil
}

func main() {
	handler, err := NewGetConnectionHandler()
	if err != nil {
		log.Fatalf("Failed to create get connection handler: %v", err)
	}

	lambda.Start(handler.Handle)
}