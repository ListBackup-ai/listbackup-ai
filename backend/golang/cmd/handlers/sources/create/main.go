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

type CreateSourceHandler struct {
	db *dynamodb.DynamoDB
}

// Source types matching the schema
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

type PlatformSource struct {
	PlatformSourceID string                 `json:"platformSourceId" dynamodbav:"platformSourceId"`
	PlatformID       string                 `json:"platformId" dynamodbav:"platformId"`
	Name             string                 `json:"name" dynamodbav:"name"`
	Description      string                 `json:"description" dynamodbav:"description"`
	DataType         string                 `json:"dataType" dynamodbav:"dataType"`
	Icon             string                 `json:"icon" dynamodbav:"icon"`
	Category         string                 `json:"category" dynamodbav:"category"`
	Popularity       int                    `json:"popularity" dynamodbav:"popularity"`
	Status           string                 `json:"status" dynamodbav:"status"`
	DefaultSettings  PlatformSourceDefaults `json:"defaultSettings" dynamodbav:"defaultSettings"`
	CreatedAt        time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type PlatformSourceDefaults struct {
	Enabled         bool                      `json:"enabled" dynamodbav:"enabled"`
	Priority        string                    `json:"priority" dynamodbav:"priority"`
	Frequency       string                    `json:"frequency" dynamodbav:"frequency"`
	RetentionDays   int                      `json:"retentionDays" dynamodbav:"retentionDays"`
	IncrementalSync bool                     `json:"incrementalSync" dynamodbav:"incrementalSync"`
	Notifications   BackupNotificationSettings `json:"notifications" dynamodbav:"notifications"`
	CustomParams    map[string]string        `json:"customParams" dynamodbav:"customParams"`
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

type CreateSourceRequest struct {
	ConnectionID     string          `json:"connectionId"`
	PlatformSourceID string          `json:"platformSourceId"`
	Name             string          `json:"name"`
	GroupID          string          `json:"groupId,omitempty"`
	Settings         *SourceSettings `json:"settings,omitempty"`
}

func NewCreateSourceHandler() (*CreateSourceHandler, error) {
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
	
	return &CreateSourceHandler{db: db}, nil
}

func (h *CreateSourceHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Create source request started")

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
	var req CreateSourceRequest
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
	if req.PlatformSourceID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Platform Source ID is required"}`,
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
			Body: `{"success": false, "error": "Source name is required"}`,
		}, nil
	}

	// Add prefixes if not present
	if len(req.ConnectionID) < 11 || req.ConnectionID[:11] != "connection:" {
		req.ConnectionID = "connection:" + req.ConnectionID
	}
	if len(req.PlatformSourceID) < 16 || req.PlatformSourceID[:16] != "platform-source:" {
		req.PlatformSourceID = "platform-source:" + req.PlatformSourceID
	}
	if req.GroupID != "" && (len(req.GroupID) < 6 || req.GroupID[:6] != "group:") {
		req.GroupID = "group:" + req.GroupID
	}

	log.Printf("Create source request for connection %s, platform source %s, user %s", req.ConnectionID, req.PlatformSourceID, userID)

	// Verify connection exists and belongs to user
	_, errResp := h.validateConnection(ctx, req.ConnectionID, userID, accountID)
	if errResp.StatusCode != 0 {
		return errResp, nil
	}

	// Verify platform source exists
	platformSource, errResp := h.validatePlatformSource(ctx, req.PlatformSourceID)
	if errResp.StatusCode != 0 {
		return errResp, nil
	}

	// Verify group if specified
	if req.GroupID != "" {
		errResp := h.validateSourceGroup(ctx, req.GroupID, userID, accountID)
		if errResp.StatusCode != 0 {
			return errResp, nil
		}
	}

	// Generate source ID
	sourceID := "source:" + uuid.New().String()

	// Create source settings from platform source defaults and user overrides
	sourceSettings := h.createSourceSettings(platformSource, req.Settings)

	// Create source object
	now := time.Now()
	source := Source{
		SourceID:         sourceID,
		AccountID:        accountID,
		UserID:           userID,
		GroupID:          req.GroupID,
		ConnectionID:     req.ConnectionID,
		PlatformSourceID: req.PlatformSourceID,
		Name:             req.Name,
		Status:           "active",
		Settings:         sourceSettings,
		CreatedAt:        now,
		UpdatedAt:        now,
		LastSyncAt:       nil,
		NextSyncAt:       nil,
		LastBackupAt:     nil,
		NextBackupAt:     nil,
	}

	// Save source to database
	sourcesTable := os.Getenv("SOURCES_TABLE")
	if sourcesTable == "" {
		sourcesTable = "listbackup-main-sources"
	}

	item, err := dynamodbattribute.MarshalMap(source)
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
			Body: `{"success": false, "error": "Failed to marshal source"}`,
		}, nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(sourcesTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("Failed to create source: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create source"}`,
		}, nil
	}

	// Update source group count if source was added to a group
	if req.GroupID != "" {
		err = h.incrementGroupSourceCount(ctx, req.GroupID)
		if err != nil {
			log.Printf("Failed to update group source count: %v", err)
			// Don't fail the entire operation for this
		}
	}

	log.Printf("Created source %s from platform source %s", sourceID, req.PlatformSourceID)
	
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
		"data": map[string]interface{}{
			"source":  responseSource,
			"message": "Source created successfully",
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

func (h *CreateSourceHandler) validateConnection(ctx context.Context, connectionID, userID, accountID string) (*PlatformConnection, events.APIGatewayProxyResponse) {
	platformConnectionsTable := os.Getenv("PLATFORM_CONNECTIONS_TABLE")
	if platformConnectionsTable == "" {
		platformConnectionsTable = "listbackup-main-platform-connections"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(platformConnectionsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"connectionId": {
				S: aws.String(connectionID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get connection %s: %v", connectionID, err)
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to validate connection"}`,
		}
	}

	if result.Item == nil {
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Connection not found"}`,
		}
	}

	var connection PlatformConnection
	err = dynamodbattribute.UnmarshalMap(result.Item, &connection)
	if err != nil {
		log.Printf("Failed to unmarshal connection: %v", err)
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to unmarshal connection"}`,
		}
	}

	// Verify connection ownership
	if connection.UserID != userID || connection.AccountID != accountID {
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied to connection"}`,
		}
	}

	// Verify connection is active
	if connection.Status != "active" {
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Connection is not active"}`,
		}
	}

	return &connection, events.APIGatewayProxyResponse{}
}

func (h *CreateSourceHandler) validatePlatformSource(ctx context.Context, platformSourceID string) (*PlatformSource, events.APIGatewayProxyResponse) {
	platformSourcesTable := os.Getenv("PLATFORM_SOURCES_TABLE")
	if platformSourcesTable == "" {
		platformSourcesTable = "listbackup-main-platform-sources"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(platformSourcesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"platformSourceId": {
				S: aws.String(platformSourceID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get platform source %s: %v", platformSourceID, err)
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to validate platform source"}`,
		}
	}

	if result.Item == nil {
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Platform source not found"}`,
		}
	}

	var platformSource PlatformSource
	err = dynamodbattribute.UnmarshalMap(result.Item, &platformSource)
	if err != nil {
		log.Printf("Failed to unmarshal platform source: %v", err)
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to unmarshal platform source"}`,
		}
	}

	// Verify platform source is active
	if platformSource.Status != "active" {
		return nil, events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Platform source is not active"}`,
		}
	}

	return &platformSource, events.APIGatewayProxyResponse{}
}

func (h *CreateSourceHandler) validateSourceGroup(ctx context.Context, groupID, userID, accountID string) events.APIGatewayProxyResponse {
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(sourceGroupsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"groupId": {
				S: aws.String(groupID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get source group %s: %v", groupID, err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to validate source group"}`,
		}
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
		}
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
			Body: `{"success": false, "error": "Failed to unmarshal source group"}`,
		}
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
		}
	}

	return events.APIGatewayProxyResponse{}
}

func (h *CreateSourceHandler) createSourceSettings(platformSource *PlatformSource, userSettings *SourceSettings) SourceSettings {
	// Start with platform source defaults
	settings := SourceSettings{
		Enabled:         platformSource.DefaultSettings.Enabled,
		Priority:        platformSource.DefaultSettings.Priority,
		Frequency:       platformSource.DefaultSettings.Frequency,
		RetentionDays:   platformSource.DefaultSettings.RetentionDays,
		IncrementalSync: platformSource.DefaultSettings.IncrementalSync,
		Notifications:   platformSource.DefaultSettings.Notifications,
		CustomParams:    platformSource.DefaultSettings.CustomParams,
	}

	// Override with user-provided settings
	if userSettings != nil {
		if userSettings.Priority != "" {
			settings.Priority = userSettings.Priority
		}
		if userSettings.Frequency != "" {
			settings.Frequency = userSettings.Frequency
		}
		if userSettings.RetentionDays > 0 {
			settings.RetentionDays = userSettings.RetentionDays
		}
		if userSettings.CustomParams != nil {
			settings.CustomParams = userSettings.CustomParams
		}
		// Note: Using userSettings.Enabled as override since it's a bool and default is fine
		settings.Enabled = userSettings.Enabled
		settings.IncrementalSync = userSettings.IncrementalSync
	}

	return settings
}

func (h *CreateSourceHandler) incrementGroupSourceCount(ctx context.Context, groupID string) error {
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(sourceGroupsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"groupId": {
				S: aws.String(groupID),
			},
		},
	})
	if err != nil {
		return err
	}

	if result.Item == nil {
		return nil // Group not found, ignore
	}

	var sourceGroup SourceGroup
	err = dynamodbattribute.UnmarshalMap(result.Item, &sourceGroup)
	if err != nil {
		return err
	}

	sourceGroup.SourceCount++
	sourceGroup.UpdatedAt = time.Now()

	item, err := dynamodbattribute.MarshalMap(sourceGroup)
	if err != nil {
		return err
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(sourceGroupsTable),
		Item:      item,
	})
	return err
}

func main() {
	handler, err := NewCreateSourceHandler()
	if err != nil {
		log.Fatalf("Failed to create source handler: %v", err)
	}

	lambda.Start(handler.Handle)
}