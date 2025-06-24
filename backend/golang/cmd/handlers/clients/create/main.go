package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
)

// Response structures
type APIResponse struct {
	StatusCode int               `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

type ResponseBody struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Client structure
type Client struct {
	ClientID    string                 `json:"clientId" dynamodbav:"clientId"`
	Name        string                 `json:"name" dynamodbav:"name"`
	Email       string                 `json:"email" dynamodbav:"email"`
	Company     string                 `json:"company" dynamodbav:"company"`
	Type        string                 `json:"type" dynamodbav:"type"`        // individual|business|enterprise
	Status      string                 `json:"status" dynamodbav:"status"`    // active|inactive|pending
	Description string                 `json:"description" dynamodbav:"description"`
	Metadata    map[string]interface{} `json:"metadata" dynamodbav:"metadata"`
	CreatedBy   string                 `json:"createdBy" dynamodbav:"createdBy"`
	CreatedAt   int64                  `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   int64                  `json:"updatedAt" dynamodbav:"updatedAt"`
}

type CreateClientRequest struct {
	Name        string                 `json:"name"`
	Email       string                 `json:"email"`
	Company     string                 `json:"company"`
	Type        string                 `json:"type"`        // "individual", "business", "enterprise"
	Status      string                 `json:"status"`      // "active", "inactive", "pending"
	Description string                 `json:"description"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// Helper functions
func success(data interface{}) APIResponse {
	body := ResponseBody{
		Success: true,
		Data:    data,
	}
	bodyBytes, _ := json.Marshal(body)
	return APIResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(bodyBytes),
	}
}

func badRequest(message string) APIResponse {
	body := ResponseBody{
		Success: false,
		Error:   message,
	}
	bodyBytes, _ := json.Marshal(body)
	return APIResponse{
		StatusCode: 400,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(bodyBytes),
	}
}

func unauthorized(message string) APIResponse {
	body := ResponseBody{
		Success: false,
		Error:   message,
	}
	bodyBytes, _ := json.Marshal(body)
	return APIResponse{
		StatusCode: 401,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(bodyBytes),
	}
}

func internalServerError(message string) APIResponse {
	body := ResponseBody{
		Success: false,
		Error:   message,
	}
	bodyBytes, _ := json.Marshal(body)
	return APIResponse{
		StatusCode: 500,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(bodyBytes),
	}
}

func Handle(ctx context.Context, event events.APIGatewayProxyRequest) (APIResponse, error) {
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

	// Parse request body
	var req CreateClientRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return badRequest("Invalid request body"), nil
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" {
		return badRequest("Name and email are required"), nil
	}

	// Set defaults
	if req.Type == "" {
		req.Type = "individual"
	}
	if req.Status == "" {
		req.Status = "active"
	}

	// Generate client ID
	clientID := "client:" + uuid.New().String()
	now := time.Now().Unix()

	// Create client record
	client := Client{
		ClientID:    clientID,
		Name:        req.Name,
		Email:       req.Email,
		Company:     req.Company,
		Type:        req.Type,
		Status:      req.Status,
		Description: req.Description,
		Metadata:    req.Metadata,
		CreatedBy:   userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Initialize AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		log.Printf("Failed to create AWS session: %v", err)
		return internalServerError("Failed to create client"), nil
	}

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	// Marshal client to DynamoDB format
	av, err := dynamodbattribute.MarshalMap(client)
	if err != nil {
		log.Printf("Failed to marshal client: %v", err)
		return internalServerError("Failed to create client"), nil
	}

	// Save to database
	tableName := os.Getenv("CLIENTS_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-clients"
	}

	_, err = svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      av,
	})
	if err != nil {
		log.Printf("Failed to create client: %v", err)
		return internalServerError("Failed to create client"), nil
	}

	log.Printf("Created client %s by user %s", clientID, userID)

	responseData := map[string]interface{}{
		"clientId":    clientID,
		"name":        client.Name,
		"email":       client.Email,
		"company":     client.Company,
		"type":        client.Type,
		"status":      client.Status,
		"description": client.Description,
		"metadata":    client.Metadata,
		"createdBy":   client.CreatedBy,
		"createdAt":   client.CreatedAt,
		"updatedAt":   client.UpdatedAt,
	}

	return success(responseData), nil
}

func main() {
	lambda.Start(Handle)
}