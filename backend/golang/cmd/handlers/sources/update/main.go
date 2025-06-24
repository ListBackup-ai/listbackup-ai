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
)

type UpdateSourceHandler struct {
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

type UpdateSourceRequest struct {
	Name     string          `json:"name,omitempty"`
	Status   string          `json:"status,omitempty"`
	Settings *SourceSettings `json:"settings,omitempty"`
}

func NewUpdateSourceHandler() (*UpdateSourceHandler, error) {
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
	return &UpdateSourceHandler{db: db}, nil
}

func (h *UpdateSourceHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Update source request started")

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

	if len(sourceId) < 7 || sourceId[:7] != "source:" {
		sourceId = "source:" + sourceId
	}

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

	var req UpdateSourceRequest
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

	// For now, just return success - implement actual update logic later
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Content-Type":                 "application/json",
		},
		Body: `{"success": true, "message": "Source update endpoint ready"}`,
	}, nil
}

func main() {
	handler, err := NewUpdateSourceHandler()
	if err != nil {
		log.Fatalf("Failed to create update source handler: %v", err)
	}

	lambda.Start(handler.Handle)
}