package main

import (
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type DeleteClientHandler struct {
	db *database.DynamoDBClientV1
}

func NewDeleteClientHandler() (*DeleteClientHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &DeleteClientHandler{
		db: db,
	}, nil
}

func (h *DeleteClientHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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

	log.Printf("Delete client %s request by user %s", clientID, userID)

	// Get existing client to verify ownership
	key := map[string]*dynamodb.AttributeValue{
		"clientId": {
			S: aws.String(clientID),
		},
	}

	var existingClient apitypes.Client
	err := h.db.GetItem(database.ClientsTable, key, &existingClient)
	if err != nil {
		log.Printf("Failed to get client %s: %v", clientID, err)
		if err.Error() == "item not found" {
			return response.NotFound("Client not found"), nil
		}
		return response.InternalServerError("Failed to get client"), nil
	}

	// Delete the client
	err = h.db.DeleteItem(database.ClientsTable, key)
	if err != nil {
		log.Printf("Failed to delete client %s: %v", clientID, err)
		return response.InternalServerError("Failed to delete client"), nil
	}

	log.Printf("Successfully deleted client %s by user %s", clientID, userID)

	responseData := map[string]interface{}{
		"clientId": clientID,
		"message":  "Client deleted successfully",
	}

	return response.Success(responseData), nil
}

func main() {
	handler, err := NewDeleteClientHandler()
	if err != nil {
		log.Fatalf("Failed to create delete client handler: %v", err)
	}

	lambda.Start(handler.Handle)
}