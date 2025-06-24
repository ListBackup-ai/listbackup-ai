package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
)

type CreateSourceGroupHandler struct {
	db *dynamodb.DynamoDB
}

type CreateSourceGroupRequest struct {
	ConnectionID string `json:"connectionId"`
	Name         string `json:"name"`
	Description  string `json:"description,omitempty"`
}

type SourceGroup struct {
	GroupID      string    `json:"groupId" dynamodbav:"groupId"`
	AccountID    string    `json:"accountId" dynamodbav:"accountId"`
	UserID       string    `json:"userId" dynamodbav:"userId"`
	ConnectionID string    `json:"connectionId" dynamodbav:"connectionId"`
	Name         string    `json:"name" dynamodbav:"name"`
	Description  string    `json:"description" dynamodbav:"description"`
	Status       string    `json:"status" dynamodbav:"status"`
	SourceCount  int       `json:"sourceCount" dynamodbav:"sourceCount"`
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

type PlatformConnection struct {
	ConnectionID    string                 `json:"connectionId" dynamodbav:"connectionId"`
	AccountID       string                 `json:"accountId" dynamodbav:"accountId"`
	UserID          string                 `json:"userId" dynamodbav:"userId"`
	PlatformID      string                 `json:"platformId" dynamodbav:"platformId"`
	Name            string                 `json:"name" dynamodbav:"name"`
	Status          string                 `json:"status" dynamodbav:"status"`
	AuthType        string                 `json:"authType" dynamodbav:"authType"`
	Credentials     map[string]interface{} `json:"credentials" dynamodbav:"credentials"`
	LastConnected   *time.Time             `json:"lastConnected,omitempty" dynamodbav:"lastConnected,omitempty"`
	CreatedAt       time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
	ExpiresAt       *time.Time             `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"`
}

func NewCreateSourceGroupHandler() (*CreateSourceGroupHandler, error) {
	// Get region from environment or default to us-west-2
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}

	// Create DynamoDB client
	db := dynamodb.New(sess)
	
	return &CreateSourceGroupHandler{db: db}, nil
}

func (h *CreateSourceGroupHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Create source group request started")

	// Handle OPTIONS for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract auth context from lambda authorizer
	var userID, accountID string
	if authLambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
		if uid, exists := authLambda["userId"].(string); exists {
			userID = uid
		}
		if aid, exists := authLambda["accountId"].(string); exists {
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

	if userID == "" || accountID == "" {
		log.Printf("Auth failed - userID: %s, accountID: %s", userID, accountID)
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "User not authenticated"}`,
		}, nil
	}

	// Parse request body
	var req CreateSourceGroupRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Invalid request body"}`,
		}, nil
	}

	// Validate required fields
	if req.ConnectionID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Connection ID is required"}`,
		}, nil
	}
	if req.Name == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Source group name is required"}`,
		}, nil
	}

	// Add connection: prefix if not present
	if !strings.HasPrefix(req.ConnectionID, "connection:") {
		req.ConnectionID = "connection:" + req.ConnectionID
	}

	log.Printf("Create source group request for connection %s, user %s, account %s", req.ConnectionID, userID, accountID)

	// Get table names
	connectionsTable := os.Getenv("PLATFORM_CONNECTIONS_TABLE")
	if connectionsTable == "" {
		connectionsTable = "listbackup-main-platform-connections"
	}
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}

	// Verify connection exists and belongs to user
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(connectionsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"connectionId": {S: aws.String(req.ConnectionID)},
		},
	})
	if err != nil {
		log.Printf("Failed to get connection %s: %v", req.ConnectionID, err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to validate connection"}`,
		}, nil
	}

	if result.Item == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Connection not found"}`,
		}, nil
	}

	var connection PlatformConnection
	err = dynamodbattribute.UnmarshalMap(result.Item, &connection)
	if err != nil {
		log.Printf("Failed to unmarshal connection: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process connection"}`,
		}, nil
	}

	// Verify the connection belongs to the authenticated user and account
	if connection.UserID != userID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied: connection belongs to different user"}`,
		}, nil
	}
	if connection.AccountID != accountID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied: connection belongs to different account"}`,
		}, nil
	}

	// Generate group ID
	groupID := "group:" + uuid.New().String()

	// Create source group object
	now := time.Now()
	sourceGroup := SourceGroup{
		GroupID:      groupID,
		AccountID:    accountID,
		UserID:       userID,
		ConnectionID: req.ConnectionID,
		Name:         req.Name,
		Description:  req.Description,
		Status:       "active", // Default to active
		SourceCount:  0,        // Initially empty
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Marshal source group for DynamoDB
	item, err := dynamodbattribute.MarshalMap(sourceGroup)
	if err != nil {
		log.Printf("Failed to marshal source group: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process source group"}`,
		}, nil
	}

	// Save source group to database
	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(sourceGroupsTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("Failed to create source group: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create source group"}`,
		}, nil
	}

	// Convert to response format (remove prefixes for cleaner API)
	responseGroup := map[string]interface{}{
		"groupId":      strings.TrimPrefix(sourceGroup.GroupID, "group:"),
		"accountId":    sourceGroup.AccountID,
		"userId":       sourceGroup.UserID,
		"connectionId": strings.TrimPrefix(sourceGroup.ConnectionID, "connection:"),
		"name":         sourceGroup.Name,
		"description":  sourceGroup.Description,
		"status":       sourceGroup.Status,
		"sourceCount":  sourceGroup.SourceCount,
		"createdAt":    sourceGroup.CreatedAt,
		"updatedAt":    sourceGroup.UpdatedAt,
	}

	responseData := map[string]interface{}{
		"success": true,
		"data":    responseGroup,
		"message": "Source group created successfully",
	}

	responseBody, err := json.Marshal(responseData)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create response"}`,
		}, nil
	}

	log.Printf("Created source group %s for connection %s", groupID, req.ConnectionID)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Headers: map[string]string{
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Content-Type":                 "application/json",
		},
		Body: string(responseBody),
	}, nil
}

func main() {
	handler, err := NewCreateSourceGroupHandler()
	if err != nil {
		log.Fatalf("Failed to create source group handler: %v", err)
	}

	lambda.Start(handler.Handle)
}