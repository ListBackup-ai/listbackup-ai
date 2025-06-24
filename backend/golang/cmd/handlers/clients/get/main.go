package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

// Client structure matching the create handler
type Client struct {
	ClientID    string                 `json:"clientId" dynamodbav:"clientId"`
	Name        string                 `json:"name" dynamodbav:"name"`
	Email       string                 `json:"email" dynamodbav:"email"`
	Company     string                 `json:"company" dynamodbav:"company"`
	Type        string                 `json:"type" dynamodbav:"type"`
	Status      string                 `json:"status" dynamodbav:"status"`
	Description string                 `json:"description" dynamodbav:"description"`
	Metadata    map[string]interface{} `json:"metadata" dynamodbav:"metadata"`
	CreatedBy   string                 `json:"createdBy" dynamodbav:"createdBy"`
	CreatedAt   int64                  `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   int64                  `json:"updatedAt" dynamodbav:"updatedAt"`
}

// Import response helper functions from create handler
func success(data interface{}) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: `{"success": true, "data": {}}`,
	}
}

func badRequest(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 400,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: `{"success": false, "error": "` + message + `"}`,
	}
}

func unauthorized(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 401,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: `{"success": false, "error": "` + message + `"}`,
	}
}

func notFound(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 404,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: `{"success": false, "error": "` + message + `"}`,
	}
}

func internalServerError(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 500,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: `{"success": false, "error": "` + message + `"}`,
	}
}

func Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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
		return unauthorized("Authentication required"), nil
	}

	// Get client ID from path parameters
	clientID, exists := event.PathParameters["clientId"]
	if !exists || clientID == "" {
		return badRequest("Client ID is required"), nil
	}

	log.Printf("Get client request for client %s by user %s", clientID, userID)

	// Initialize AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		log.Printf("Failed to create AWS session: %v", err)
		return internalServerError("Failed to get client"), nil
	}

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	// Get client from database
	tableName := os.Getenv("CLIENTS_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-clients"
	}

	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"clientId": {
				S: aws.String(clientID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get client %s: %v", clientID, err)
		return internalServerError("Failed to get client"), nil
	}

	if result.Item == nil {
		return notFound("Client not found"), nil
	}

	var client Client
	err = dynamodbattribute.UnmarshalMap(result.Item, &client)
	if err != nil {
		log.Printf("Failed to unmarshal client: %v", err)
		return internalServerError("Failed to get client"), nil
	}

	return success(client), nil
}

func main() {
	lambda.Start(Handle)
}