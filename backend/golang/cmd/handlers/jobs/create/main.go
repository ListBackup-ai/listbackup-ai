package main

import (
	"context"
	"encoding/json"
	"fmt"
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
	apitypes "github.com/listbackup/api/internal/types"
)

type CreateJobHandler struct {
	db *dynamodb.DynamoDB
}

type CreateJobRequest struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	SourceID string `json:"sourceId"`
	Schedule string `json:"schedule,omitempty"`
	Enabled  *bool  `json:"enabled,omitempty"`
}

func NewCreateJobHandler() (*CreateJobHandler, error) {
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

	return &CreateJobHandler{db: db}, nil
}

func (h *CreateJobHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Create job request started")

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
	var createReq CreateJobRequest
	if err := json.Unmarshal([]byte(event.Body), &createReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Invalid JSON format in request body"}`,
		}, nil
	}
	
	// Validate required fields
	if createReq.Name == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Job name is required"}`,
		}, nil
	}
	if createReq.Type == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Job type is required"}`,
		}, nil
	}
	if createReq.SourceID == "" {
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
	
	// Generate new job ID
	jobID := "job:" + uuid.New().String()
	
	// Add source: prefix to source ID for storage
	sourceIDWithPrefix := createReq.SourceID
	if !strings.HasPrefix(createReq.SourceID, "source:") {
		sourceIDWithPrefix = "source:" + createReq.SourceID
	}
	
	// Set default enabled if not provided
	enabled := true
	if createReq.Enabled != nil {
		enabled = *createReq.Enabled
	}
	
	// Create job object
	now := time.Now()
	job := apitypes.Job{
		JobID:     jobID,
		AccountID: accountID,
		UserID:    userID,
		SourceID:  sourceIDWithPrefix,
		Name:      createReq.Name,
		Type:      createReq.Type,
		Schedule:  createReq.Schedule,
		Status:    "created",
		Enabled:   enabled,
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	// Convert job to DynamoDB item
	jobItem, err := dynamodbattribute.MarshalMap(job)
	if err != nil {
		log.Printf("Failed to marshal job: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create job"}`,
		}, nil
	}
	
	// Save job to database
	jobsTable := os.Getenv("JOBS_TABLE")
	if jobsTable == "" {
		jobsTable = "listbackup-main-jobs"
	}
	
	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(jobsTable),
		Item:      jobItem,
	})
	if err != nil {
		log.Printf("Failed to create job: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create job"}`,
		}, nil
	}
	
	// Log activity
	err = h.logActivity(ctx, accountID, userID, "jobs", "create_success", fmt.Sprintf("Created job: %s", createReq.Name))
	if err != nil {
		log.Printf("Failed to log activity: %v", err)
	}
	
	// Build response with clean job ID
	jobResponse := map[string]interface{}{
		"jobId":     strings.TrimPrefix(job.JobID, "job:"),
		"accountId": job.AccountID,
		"userId":    job.UserID,
		"sourceId":  strings.TrimPrefix(job.SourceID, "source:"),
		"name":      job.Name,
		"type":      job.Type,
		"schedule":  job.Schedule,
		"status":    job.Status,
		"enabled":   job.Enabled,
		"createdAt": job.CreatedAt,
		"updatedAt": job.UpdatedAt,
	}
	
	responseData := map[string]interface{}{
		"success": true,
		"data":    jobResponse,
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

func (h *CreateJobHandler) logActivity(ctx context.Context, accountID, userID, activityType, action, message string) error {
	eventID := fmt.Sprintf("activity:%d:%s", time.Now().UnixNano()/1000000, generateRandomString(9))
	timestamp := time.Now().UnixNano() / 1000000 // Unix timestamp in milliseconds
	ttl := time.Now().Add(90 * 24 * time.Hour).Unix()

	activity := apitypes.Activity{
		EventID:   eventID,
		AccountID: accountID,
		UserID:    userID,
		Type:      activityType,
		Action:    action,
		Status:    "success",
		Message:   message,
		Timestamp: timestamp,
		TTL:       ttl,
	}

	// Convert activity to DynamoDB item
	activityItem, err := dynamodbattribute.MarshalMap(activity)
	if err != nil {
		return err
	}

	activityTable := os.Getenv("ACTIVITY_TABLE")
	if activityTable == "" {
		activityTable = "listbackup-main-activity"
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(activityTable),
		Item:      activityItem,
	})

	return err
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

func main() {
	handler, err := NewCreateJobHandler()
	if err != nil {
		log.Fatalf("Failed to create jobs create handler: %v", err)
	}

	lambda.Start(handler.Handle)
}