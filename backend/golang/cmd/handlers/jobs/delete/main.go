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
	apitypes "github.com/listbackup/api/internal/types"
)

type DeleteJobHandler struct {
	db *dynamodb.DynamoDB
}

func NewDeleteJobHandler() (*DeleteJobHandler, error) {
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

	return &DeleteJobHandler{db: db}, nil
}

func (h *DeleteJobHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Delete job request started")

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

	// Get job ID from path parameters
	jobIDParam := event.PathParameters["jobId"]
	if jobIDParam == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Job ID is required"}`,
		}, nil
	}

	// Add job: prefix if missing
	jobID := jobIDParam
	if !strings.HasPrefix(jobID, "job:") {
		jobID = "job:" + jobID
	}

	jobsTable := os.Getenv("JOBS_TABLE")
	if jobsTable == "" {
		jobsTable = "listbackup-main-jobs"
	}

	// First, get the existing job to verify ownership and get job name for logging
	getResult, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(jobsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"jobId": {
				S: aws.String(jobID),
			},
		},
	})

	if err != nil {
		log.Printf("Failed to get job: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to get job"}`,
		}, nil
	}

	if getResult.Item == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Job not found"}`,
		}, nil
	}

	// Unmarshal existing job
	var existingJob apitypes.Job
	err = dynamodbattribute.UnmarshalMap(getResult.Item, &existingJob)
	if err != nil {
		log.Printf("Failed to unmarshal job: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process job data"}`,
		}, nil
	}

	// Verify job belongs to account
	if existingJob.AccountID != accountID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied"}`,
		}, nil
	}

	// Check if job is currently running
	if existingJob.Status == "running" {
		return events.APIGatewayProxyResponse{
			StatusCode: 409,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Cannot delete running job. Cancel the job first."}`,
		}, nil
	}

	// Delete the job
	_, err = h.db.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(jobsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"jobId": {
				S: aws.String(jobID),
			},
		},
	})

	if err != nil {
		log.Printf("Failed to delete job: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to delete job"}`,
		}, nil
	}

	// Log activity
	err = h.logActivity(ctx, accountID, userID, "jobs", "delete_success", fmt.Sprintf("Deleted job: %s", existingJob.Name))
	if err != nil {
		log.Printf("Failed to log activity: %v", err)
	}

	responseData := map[string]interface{}{
		"success": true,
		"message": "Job deleted successfully",
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

func (h *DeleteJobHandler) logActivity(ctx context.Context, accountID, userID, activityType, action, message string) error {
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
	handler, err := NewDeleteJobHandler()
	if err != nil {
		log.Fatalf("Failed to create delete job handler: %v", err)
	}

	lambda.Start(handler.Handle)
}