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
)

type GetSourceGroupHandler struct {
	db *dynamodb.DynamoDB
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

func NewGetSourceGroupHandler() (*GetSourceGroupHandler, error) {
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
	
	return &GetSourceGroupHandler{db: db}, nil
}

func (h *GetSourceGroupHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get source group request started")

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

	groupId := event.PathParameters["groupId"]
	if groupId == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Group ID is required"}`,
		}, nil
	}

	// Add group: prefix if not present
	if !strings.HasPrefix(groupId, "group:") {
		groupId = "group:" + groupId
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

	log.Printf("Get source group %s for user %s, account %s", groupId, userID, accountID)

	// Get source groups table name
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}

	// Get source group from database
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(sourceGroupsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"groupId": {S: aws.String(groupId)},
		},
	})
	if err != nil {
		log.Printf("Failed to get source group %s: %v", groupId, err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to get source group"}`,
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
			Body: `{"success": false, "error": "Source group not found"}`,
		}, nil
	}

	var sourceGroup SourceGroup
	err = dynamodbattribute.UnmarshalMap(result.Item, &sourceGroup)
	if err != nil {
		log.Printf("Failed to unmarshal source group: %v", err)
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

	// Verify the source group belongs to the authenticated user and account
	if sourceGroup.UserID != userID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied: source group belongs to different user"}`,
		}, nil
	}
	if sourceGroup.AccountID != accountID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied: source group belongs to different account"}`,
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

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
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
	handler, err := NewGetSourceGroupHandler()
	if err != nil {
		log.Fatalf("Failed to create get source group handler: %v", err)
	}

	lambda.Start(handler.Handle)
}