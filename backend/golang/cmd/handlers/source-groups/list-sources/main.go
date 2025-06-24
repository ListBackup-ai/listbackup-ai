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

type ListGroupSourcesHandler struct {
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

func NewListGroupSourcesHandler() (*ListGroupSourcesHandler, error) {
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
	return &ListGroupSourcesHandler{db: db}, nil
}

func (h *ListGroupSourcesHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List group sources request started")

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

	log.Printf("List sources in group %s for user %s, account %s", groupId, userID, accountID)

	// Get table names
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}
	sourcesTable := os.Getenv("SOURCES_TABLE")
	if sourcesTable == "" {
		sourcesTable = "listbackup-main-sources"
	}

	// First verify the source group exists and user has access
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

	// Query sources by group ID using GroupIndex GSI
	result, err := h.db.Query(&dynamodb.QueryInput{
		TableName:              aws.String(sourcesTable),
		IndexName:              aws.String("GroupIndex"),
		KeyConditionExpression: aws.String("groupId = :groupId"),
		FilterExpression:       aws.String("accountId = :accountId AND userId = :userId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":groupId":   {S: aws.String(groupId)},
			":accountId": {S: aws.String(accountID)},
			":userId":    {S: aws.String(userID)},
		},
	})
	if err != nil {
		log.Printf("Failed to query sources in group: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to list sources in group"}`,
		}, nil
	}

	// Unmarshal sources
	var sources []Source
	for _, item := range result.Items {
		var source Source
		err := dynamodbattribute.UnmarshalMap(item, &source)
		if err != nil {
			log.Printf("Failed to unmarshal source: %v", err)
			continue
		}
		sources = append(sources, source)
	}

	// Convert to response format (remove prefixes for cleaner API)
	var responseSources []map[string]interface{}
	for _, source := range sources {
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
		responseSources = append(responseSources, responseSource)
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
		"sources":     responseSources,
		"total":       len(responseSources),
		"groupId":     strings.TrimPrefix(groupId, "group:"),
		"sourceGroup": responseGroup,
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

	log.Printf("Found %d sources in group %s for user %s", len(responseSources), groupId, userID)
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
	handler, err := NewListGroupSourcesHandler()
	if err != nil {
		log.Fatalf("Failed to create list group sources handler: %v", err)
	}

	lambda.Start(handler.Handle)
}