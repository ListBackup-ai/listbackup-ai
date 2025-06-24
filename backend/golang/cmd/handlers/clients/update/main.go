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

type UpdateClientHandler struct {
	db *database.DynamoDBClientV1
}

type UpdateClientRequest struct {
	Name        string                 `json:"name,omitempty"`
	Email       string                 `json:"email,omitempty"`
	Company     string                 `json:"company,omitempty"`
	Type        string                 `json:"type,omitempty"`
	Status      string                 `json:"status,omitempty"`
	Description string                 `json:"description,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

func NewUpdateClientHandler() (*UpdateClientHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &UpdateClientHandler{
		db: db,
	}, nil
}

func (h *UpdateClientHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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
	var req UpdateClientRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return response.BadRequest("Invalid request body"), nil
	}

	log.Printf("Update client %s request by user %s", clientID, userID)

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

	// Build update expression
	updateExpression := "SET updatedAt = :updatedAt"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":updatedAt": {
			N: aws.String(string(time.Now().Unix())),
		},
	}

	if req.Name != "" {
		updateExpression += ", #name = :name"
		expressionAttributeValues[":name"] = &dynamodb.AttributeValue{S: aws.String(req.Name)}
	}

	if req.Email != "" {
		updateExpression += ", email = :email"
		expressionAttributeValues[":email"] = &dynamodb.AttributeValue{S: aws.String(req.Email)}
	}

	if req.Company != "" {
		updateExpression += ", company = :company"
		expressionAttributeValues[":company"] = &dynamodb.AttributeValue{S: aws.String(req.Company)}
	}

	if req.Type != "" {
		updateExpression += ", #type = :type"
		expressionAttributeValues[":type"] = &dynamodb.AttributeValue{S: aws.String(req.Type)}
	}

	if req.Status != "" {
		updateExpression += ", #status = :status"
		expressionAttributeValues[":status"] = &dynamodb.AttributeValue{S: aws.String(req.Status)}
	}

	if req.Description != "" {
		updateExpression += ", description = :description"
		expressionAttributeValues[":description"] = &dynamodb.AttributeValue{S: aws.String(req.Description)}
	}

	// Update in database
	err = h.db.UpdateItem(database.ClientsTable, key, updateExpression, expressionAttributeValues)
	if err != nil {
		log.Printf("Failed to update client %s: %v", clientID, err)
		return response.InternalServerError("Failed to update client"), nil
	}

	// Return updated data
	responseData := map[string]interface{}{
		"clientId": clientID,
		"message":  "Client updated successfully",
	}

	if req.Name != "" {
		responseData["name"] = req.Name
	}
	if req.Email != "" {
		responseData["email"] = req.Email
	}
	if req.Company != "" {
		responseData["company"] = req.Company
	}
	if req.Type != "" {
		responseData["type"] = req.Type
	}
	if req.Status != "" {
		responseData["status"] = req.Status
	}
	if req.Description != "" {
		responseData["description"] = req.Description
	}

	return response.Success(responseData), nil
}

func main() {
	handler, err := NewUpdateClientHandler()
	if err != nil {
		log.Fatalf("Failed to create update client handler: %v", err)
	}

	lambda.Start(handler.Handle)
}