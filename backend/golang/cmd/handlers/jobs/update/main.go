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

type UpdateJobHandler struct {
	db *dynamodb.DynamoDB
}

type UpdateJobRequest struct {
	Name     *string `json:"name,omitempty"`
	Schedule *string `json:"schedule,omitempty"`
	Enabled  *bool   `json:"enabled,omitempty"`
	Status   *string `json:"status,omitempty"`
	Priority *string `json:"priority,omitempty"`
}

func NewUpdateJobHandler() (*UpdateJobHandler, error) {
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

	return &UpdateJobHandler{db: db}, nil
}

func (h *UpdateJobHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Update job request started")

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

	// Parse request body
	var updateReq UpdateJobRequest
	if err := json.Unmarshal([]byte(event.Body), &updateReq); err != nil {
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

	jobsTable := os.Getenv("JOBS_TABLE")
	if jobsTable == "" {
		jobsTable = "listbackup-main-jobs"
	}

	// First, get the existing job to verify ownership
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

	// Build update expression
	updateExpressions := []string{}
	expressionValues := map[string]*dynamodb.AttributeValue{}
	expressionNames := map[string]*string{}

	if updateReq.Name != nil {
		updateExpressions = append(updateExpressions, "#name = :name")
		expressionValues[":name"] = &dynamodb.AttributeValue{S: aws.String(*updateReq.Name)}
		expressionNames["#name"] = aws.String("name")
	}

	if updateReq.Schedule != nil {
		updateExpressions = append(updateExpressions, "schedule = :schedule")
		expressionValues[":schedule"] = &dynamodb.AttributeValue{S: aws.String(*updateReq.Schedule)}
	}

	if updateReq.Enabled != nil {
		updateExpressions = append(updateExpressions, "enabled = :enabled")
		expressionValues[":enabled"] = &dynamodb.AttributeValue{BOOL: aws.Bool(*updateReq.Enabled)}
	}

	if updateReq.Status != nil {
		updateExpressions = append(updateExpressions, "#status = :status")
		expressionValues[":status"] = &dynamodb.AttributeValue{S: aws.String(*updateReq.Status)}
		expressionNames["#status"] = aws.String("status")
	}

	if updateReq.Priority != nil {
		updateExpressions = append(updateExpressions, "priority = :priority")
		expressionValues[":priority"] = &dynamodb.AttributeValue{S: aws.String(*updateReq.Priority)}
	}

	// Always update the updatedAt timestamp
	updateExpressions = append(updateExpressions, "updatedAt = :updatedAt")
	updatedAt, _ := dynamodbattribute.Marshal(time.Now())
	expressionValues[":updatedAt"] = updatedAt

	if len(updateExpressions) == 1 { // Only updatedAt
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "No fields to update"}`,
		}, nil
	}

	updateExpression := "SET " + strings.Join(updateExpressions, ", ")

	// Update the job
	updateInput := &dynamodb.UpdateItemInput{
		TableName:                 aws.String(jobsTable),
		Key:                       getResult.Item,
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionValues,
		ReturnValues:              aws.String("ALL_NEW"),
	}

	if len(expressionNames) > 0 {
		updateInput.ExpressionAttributeNames = expressionNames
	}

	updateResult, err := h.db.UpdateItem(updateInput)
	if err != nil {
		log.Printf("Failed to update job: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to update job"}`,
		}, nil
	}

	// Unmarshal updated job
	var updatedJob apitypes.Job
	err = dynamodbattribute.UnmarshalMap(updateResult.Attributes, &updatedJob)
	if err != nil {
		log.Printf("Failed to unmarshal updated job: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process updated job"}`,
		}, nil
	}

	// Log activity
	err = h.logActivity(ctx, accountID, userID, "jobs", "update_success", fmt.Sprintf("Updated job: %s", updatedJob.Name))
	if err != nil {
		log.Printf("Failed to log activity: %v", err)
	}

	// Build response with clean job ID
	jobResponse := map[string]interface{}{
		"jobId":     strings.TrimPrefix(updatedJob.JobID, "job:"),
		"accountId": updatedJob.AccountID,
		"userId":    updatedJob.UserID,
		"sourceId":  strings.TrimPrefix(updatedJob.SourceID, "source:"),
		"name":      updatedJob.Name,
		"type":      updatedJob.Type,
		"subType":   updatedJob.SubType,
		"priority":  updatedJob.Priority,
		"schedule":  updatedJob.Schedule,
		"status":    updatedJob.Status,
		"enabled":   updatedJob.Enabled,
		"config":    updatedJob.Config,
		"progress":  updatedJob.Progress,
		"createdAt": updatedJob.CreatedAt,
		"updatedAt": updatedJob.UpdatedAt,
		"startedAt": updatedJob.StartedAt,
		"completedAt": updatedJob.CompletedAt,
		"lastRunAt": updatedJob.LastRunAt,
		"nextRunAt": updatedJob.NextRunAt,
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

func (h *UpdateJobHandler) logActivity(ctx context.Context, accountID, userID, activityType, action, message string) error {
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
	handler, err := NewUpdateJobHandler()
	if err != nil {
		log.Fatalf("Failed to create update job handler: %v", err)
	}

	lambda.Start(handler.Handle)
}