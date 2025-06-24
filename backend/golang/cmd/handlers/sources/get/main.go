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

type GetSourceHandler struct {
	db *dynamodb.DynamoDB
}

type Source struct {
	SourceID         string        `json:"sourceId" dynamodbav:"sourceId"`
	AccountID        string        `json:"accountId" dynamodbav:"accountId"`
	UserID           string        `json:"userId" dynamodbav:"userId"`
	GroupID          string        `json:"groupId" dynamodbav:"groupId"`
	ConnectionID     string        `json:"connectionId" dynamodbav:"connectionId"`
	PlatformSourceID string        `json:"platformSourceId" dynamodbav:"platformSourceId"`
	Name             string        `json:"name" dynamodbav:"name"`
	Status           string        `json:"status" dynamodbav:"status"`
	Settings         SourceSettings `json:"settings" dynamodbav:"settings"`
	CreatedAt        time.Time     `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt" dynamodbav:"updatedAt"`
	LastSyncAt       *time.Time    `json:"lastSyncAt,omitempty" dynamodbav:"lastSyncAt,omitempty"`
	NextSyncAt       *time.Time    `json:"nextSyncAt,omitempty" dynamodbav:"nextSyncAt,omitempty"`
	LastBackupAt     *time.Time    `json:"lastBackupAt,omitempty" dynamodbav:"lastBackupAt,omitempty"`
	NextBackupAt     *time.Time    `json:"nextBackupAt,omitempty" dynamodbav:"nextBackupAt,omitempty"`
}

type SourceSettings struct {
	Enabled         bool                      `json:"enabled" dynamodbav:"enabled"`
	Priority        string                    `json:"priority" dynamodbav:"priority"`
	Frequency       string                    `json:"frequency" dynamodbav:"frequency"`
	Schedule        string                    `json:"schedule" dynamodbav:"schedule"`
	RetentionDays   int                      `json:"retentionDays" dynamodbav:"retentionDays"`
	IncrementalSync bool                     `json:"incrementalSync" dynamodbav:"incrementalSync"`
	Notifications   BackupNotificationSettings `json:"notifications" dynamodbav:"notifications"`
	CustomParams    map[string]string        `json:"customParams" dynamodbav:"customParams"`
}

type BackupNotificationSettings struct {
	OnSuccess   bool `json:"onSuccess" dynamodbav:"onSuccess"`
	OnFailure   bool `json:"onFailure" dynamodbav:"onFailure"`
	OnSizeLimit bool `json:"onSizeLimit" dynamodbav:"onSizeLimit"`
}

func NewGetSourceHandler() (*GetSourceHandler, error) {
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
	
	return &GetSourceHandler{db: db}, nil
}

func (h *GetSourceHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get source request started")

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

	sourceId := event.PathParameters["sourceId"]
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

	// Add source: prefix if not present
	if len(sourceId) < 7 || sourceId[:7] != "source:" {
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

	log.Printf("Get source %s for user %s, account %s", sourceId, userID, accountID)

	// Get sources table name
	sourcesTable := os.Getenv("SOURCES_TABLE")
	if sourcesTable == "" {
		sourcesTable = "listbackup-main-sources"
	}

	// Get source from database
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(sourcesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"sourceId": {
				S: aws.String(sourceId),
			},
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

	if result.Item == nil {
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
	err = dynamodbattribute.UnmarshalMap(result.Item, &source)
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
			Body: `{"success": false, "error": "Failed to unmarshal source"}`,
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

	// Create response
	responseSource := map[string]interface{}{
		"sourceId":         strings.TrimPrefix(source.SourceID, "source:"),
		"accountId":        source.AccountID,
		"userId":           source.UserID,
		"groupId":          source.GroupID,
		"connectionId":     strings.TrimPrefix(source.ConnectionID, "connection:"),
		"platformSourceId": strings.TrimPrefix(source.PlatformSourceID, "platform-source:"),
		"name":             source.Name,
		"status":           source.Status,
		"settings":         source.Settings,
		"createdAt":        source.CreatedAt,
		"updatedAt":        source.UpdatedAt,
		"lastSyncAt":       source.LastSyncAt,
		"nextSyncAt":       source.NextSyncAt,
		"lastBackupAt":     source.LastBackupAt,
		"nextBackupAt":     source.NextBackupAt,
	}

	response := map[string]interface{}{
		"success": true,
		"data":    responseSource,
	}

	responseBody, err := json.Marshal(response)
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

	log.Printf("Successfully retrieved source %s", sourceId)
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
	handler, err := NewGetSourceHandler()
	if err != nil {
		log.Fatalf("Failed to create get source handler: %v", err)
	}

	lambda.Start(handler.Handle)
}