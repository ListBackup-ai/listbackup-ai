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

type RemoveSourceFromGroupHandler struct {
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

func NewRemoveSourceFromGroupHandler() (*RemoveSourceFromGroupHandler, error) {
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
	return &RemoveSourceFromGroupHandler{db: db}, nil
}

func (h *RemoveSourceFromGroupHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Remove source from group request started")

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
	sourceId := event.PathParameters["sourceId"]
	
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
	if sourceId == "" {
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

	// Add prefixes if not present
	if !strings.HasPrefix(groupId, "group:") {
		groupId = "group:" + groupId
	}
	if !strings.HasPrefix(sourceId, "source:") {
		sourceId = "source:" + sourceId
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

	log.Printf("Remove source %s from group %s for user %s, account %s", sourceId, groupId, userID, accountID)

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

	// Check if source is actually in this group
	if source.GroupID != groupId {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Source is not in this group"}`,
		}, nil
	}

	// Remove source from group
	source.GroupID = ""
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
			Body: `{"success": false, "error": "Failed to remove source from group"}`,
		}, nil
	}

	// Update source group count
	if sourceGroup.SourceCount > 0 {
		sourceGroup.SourceCount--
	}
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
		"groupId":       "",
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
		"message":     "Source removed from group successfully",
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

	log.Printf("Removed source %s from group %s", sourceId, groupId)
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
	handler, err := NewRemoveSourceFromGroupHandler()
	if err != nil {
		log.Fatalf("Failed to create remove source from group handler: %v", err)
	}

	lambda.Start(handler.Handle)
}