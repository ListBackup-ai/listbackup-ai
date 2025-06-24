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

type ListSourcesHandler struct {
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

func NewListSourcesHandler() (*ListSourcesHandler, error) {
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
	
	return &ListSourcesHandler{db: db}, nil
}

func (h *ListSourcesHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List sources request started")

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

	// Get query parameters for filtering
	connectionID := ""
	groupID := ""
	status := ""
	platformSourceID := ""
	
	if event.QueryStringParameters != nil {
		connectionID = event.QueryStringParameters["connectionId"]
		groupID = event.QueryStringParameters["groupId"]
		status = event.QueryStringParameters["status"]
		platformSourceID = event.QueryStringParameters["platformSourceId"]
	}

	log.Printf("List sources request for user %s, account %s", userID, accountID)

	// Get sources table name
	sourcesTable := os.Getenv("SOURCES_TABLE")
	if sourcesTable == "" {
		sourcesTable = "listbackup-main-sources"
	}

	var sources []Source
	var err error

	if connectionID != "" {
		// Add connection: prefix if not present
		if len(connectionID) < 11 || connectionID[:11] != "connection:" {
			connectionID = "connection:" + connectionID
		}
		
		// Filter by connection using GSI
		result, err := h.db.Query(&dynamodb.QueryInput{
			TableName:              aws.String(sourcesTable),
			IndexName:              aws.String("ConnectionIndex"),
			KeyConditionExpression: aws.String("connectionId = :connectionId"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":connectionId": {
					S: aws.String(connectionID),
				},
			},
		})
		if err == nil {
			err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &sources)
		}
		
		// Filter by user and account in memory
		sources = h.filterByUserAndAccount(sources, userID, accountID)
	} else if groupID != "" {
		// Add group: prefix if not present
		if len(groupID) < 6 || groupID[:6] != "group:" {
			groupID = "group:" + groupID
		}
		
		// Filter by group using GSI
		result, err := h.db.Query(&dynamodb.QueryInput{
			TableName:              aws.String(sourcesTable),
			IndexName:              aws.String("GroupIndex"),
			KeyConditionExpression: aws.String("groupId = :groupId"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":groupId": {
					S: aws.String(groupID),
				},
			},
		})
		if err == nil {
			err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &sources)
		}
		
		// Filter by user and account in memory
		sources = h.filterByUserAndAccount(sources, userID, accountID)
	} else if platformSourceID != "" {
		// Add platform-source: prefix if not present
		if len(platformSourceID) < 16 || platformSourceID[:16] != "platform-source:" {
			platformSourceID = "platform-source:" + platformSourceID
		}
		
		// Filter by platform source using GSI
		result, err := h.db.Query(&dynamodb.QueryInput{
			TableName:              aws.String(sourcesTable),
			IndexName:              aws.String("PlatformSourceIndex"),
			KeyConditionExpression: aws.String("platformSourceId = :platformSourceId"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":platformSourceId": {
					S: aws.String(platformSourceID),
				},
			},
		})
		if err == nil {
			err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &sources)
		}
		
		// Filter by user and account in memory
		sources = h.filterByUserAndAccount(sources, userID, accountID)
	} else {
		// Get all sources for this user and account
		result, err := h.db.Query(&dynamodb.QueryInput{
			TableName:              aws.String(sourcesTable),
			IndexName:              aws.String("UserIndex"),
			KeyConditionExpression: aws.String("userId = :userId"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":userId": {
					S: aws.String(userID),
				},
			},
		})
		if err == nil {
			err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &sources)
		}
		
		// Filter by account in memory
		sources = h.filterByAccount(sources, accountID)
	}

	if err != nil {
		log.Printf("Failed to list sources: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to list sources"}`,
		}, nil
	}

	// Apply additional filters
	if status != "" {
		sources = h.filterByStatus(sources, status)
	}

	// Convert sources to response format
	var responseData []map[string]interface{}
	for _, source := range sources {
		sourceResponse := map[string]interface{}{
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
		responseData = append(responseData, sourceResponse)
	}

	log.Printf("Found %d sources for user %s, account %s", len(sources), userID, accountID)
	
	response := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"sources": responseData,
			"total":   len(sources),
			"filters": map[string]interface{}{
				"connectionId":     connectionID,
				"groupId":          groupID,
				"status":           status,
				"platformSourceId": platformSourceID,
			},
		},
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

func (h *ListSourcesHandler) filterByUserAndAccount(sources []Source, userID, accountID string) []Source {
	var filtered []Source
	for _, source := range sources {
		if source.UserID == userID && source.AccountID == accountID {
			filtered = append(filtered, source)
		}
	}
	return filtered
}

func (h *ListSourcesHandler) filterByAccount(sources []Source, accountID string) []Source {
	var filtered []Source
	for _, source := range sources {
		if source.AccountID == accountID {
			filtered = append(filtered, source)
		}
	}
	return filtered
}

func (h *ListSourcesHandler) filterByStatus(sources []Source, status string) []Source {
	var filtered []Source
	for _, source := range sources {
		if source.Status == status {
			filtered = append(filtered, source)
		}
	}
	return filtered
}

func main() {
	handler, err := NewListSourcesHandler()
	if err != nil {
		log.Fatalf("Failed to create list sources handler: %v", err)
	}

	lambda.Start(handler.Handle)
}