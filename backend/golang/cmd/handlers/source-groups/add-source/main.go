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

type AddSourceToGroupHandler struct {
	db *dynamodb.DynamoDB
}

type AddSourceToGroupRequest struct {
	SourceID string `json:"sourceId"`
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

type Source struct {
	SourceID      string                 `json:"sourceId" dynamodbav:"sourceId"`
	AccountID     string                 `json:"accountId" dynamodbav:"accountId"`
	UserID        string                 `json:"userId" dynamodbav:"userId"`
	ConnectionID  string                 `json:"connectionId" dynamodbav:"connectionId"`
	GroupID       string                 `json:"groupId,omitempty" dynamodbav:"groupId,omitempty"`
	Name          string                 `json:"name" dynamodbav:"name"`
	PlatformID    string                 `json:"platformId" dynamodbav:"platformId"`
	Status        string                 `json:"status" dynamodbav:"status"`
	Configuration map[string]interface{} `json:"configuration" dynamodbav:"configuration"`
	CreatedAt     time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt     time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

func NewAddSourceToGroupHandler() (*AddSourceToGroupHandler, error) {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}

	db := dynamodb.New(sess)
	return &AddSourceToGroupHandler{db: db}, nil
}

func (h *AddSourceToGroupHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Add source to group request started")

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

	// Parse request body
	var req AddSourceToGroupRequest
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

	if req.SourceID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Source ID is required"}`,
		}, nil
	}

	// Add source: prefix if not present
	sourceId := req.SourceID
	if !strings.HasPrefix(sourceId, "source:") {
		sourceId = "source:" + sourceId
	}

	log.Printf("Add source %s to group %s for user %s, account %s", sourceId, groupId, userID, accountID)

	// Get table names
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}
	sourcesTable := os.Getenv("SOURCES_TABLE")
	if sourcesTable == "" {
		sourcesTable = "listbackup-main-sources"
	}

	// Get and verify source group
	groupResult, err := h.db.GetItem(&dynamodb.GetItemInput{
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

	if groupResult.Item == nil {
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
	err = dynamodbattribute.UnmarshalMap(groupResult.Item, &sourceGroup)
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

	// Verify group ownership
	if sourceGroup.UserID != userID || sourceGroup.AccountID != accountID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied to source group"}`,
		}, nil
	}

	// Get and verify source
	sourceResult, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(sourcesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"sourceId": {S: aws.String(sourceId)},
		},
	})
	if err != nil {
		log.Printf("Failed to get source %s: %v", sourceId, err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to get source"}`,
		}, nil
	}

	if sourceResult.Item == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Source not found"}`,
		}, nil
	}

	var source Source
	err = dynamodbattribute.UnmarshalMap(sourceResult.Item, &source)
	if err != nil {
		log.Printf("Failed to unmarshal source: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process source"}`,
		}, nil
	}

	// Verify source ownership
	if source.UserID != userID || source.AccountID != accountID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied to source"}`,
		}, nil
	}

	// Verify source and group have the same connection ID
	if source.ConnectionID != sourceGroup.ConnectionID {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Source and group must belong to the same connection"}`,
		}, nil
	}

	// Check if source is already in a group
	if source.GroupID != "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Source is already in a group"}`,
		}, nil
	}

	// Add source to group
	source.GroupID = groupId
	source.UpdatedAt = time.Now()
	sourceItem, err := dynamodbattribute.MarshalMap(source)
	if err != nil {
		log.Printf("Failed to marshal source: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process source"}`,
		}, nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(sourcesTable),
		Item:      sourceItem,
	})
	if err != nil {
		log.Printf("Failed to update source: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to add source to group"}`,
		}, nil
	}

	// Update source group count
	sourceGroup.SourceCount++
	sourceGroup.UpdatedAt = time.Now()
	groupItem, err := dynamodbattribute.MarshalMap(sourceGroup)
	if err != nil {
		log.Printf("Failed to marshal source group: %v", err)
		// Continue anyway since the source was updated
	} else {
		_, err = h.db.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(sourceGroupsTable),
			Item:      groupItem,
		})
		if err != nil {
			log.Printf("Failed to update source group count: %v", err)
			// Continue anyway since the source was updated
		}
	}

	// Convert to response format (remove prefixes for cleaner API)
	responseSource := map[string]interface{}{
		"sourceId":      strings.TrimPrefix(source.SourceID, "source:"),
		"accountId":     source.AccountID,
		"userId":        source.UserID,
		"connectionId":  strings.TrimPrefix(source.ConnectionID, "connection:"),
		"groupId":       strings.TrimPrefix(source.GroupID, "group:"),
		"name":          source.Name,
		"platformId":    source.PlatformID,
		"status":        source.Status,
		"configuration": source.Configuration,
		"createdAt":     source.CreatedAt,
		"updatedAt":     source.UpdatedAt,
	}

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
		"success":     true,
		"source":      responseSource,
		"sourceGroup": responseGroup,
		"message":     "Source added to group successfully",
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

	log.Printf("Added source %s to group %s", sourceId, groupId)
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
	handler, err := NewAddSourceToGroupHandler()
	if err != nil {
		log.Fatalf("Failed to create add source to group handler: %v", err)
	}

	lambda.Start(handler.Handle)
}