package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	apitypes "github.com/listbackup/api/internal/types"
)

type GetJobsHandler struct {
	db *dynamodb.DynamoDB
}

func NewGetJobsHandler() (*GetJobsHandler, error) {
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

	return &GetJobsHandler{db: db}, nil
}

func (h *GetJobsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get jobs request started")

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

	// Check if this is a request for a specific job
	jobIDParam := event.PathParameters["jobId"]
	if jobIDParam != "" {
		return h.getSingleJob(ctx, accountID, jobIDParam)
	}

	// Get all jobs for account
	return h.getAllJobs(ctx, accountID)
}

func (h *GetJobsHandler) getSingleJob(ctx context.Context, accountID, jobID string) (events.APIGatewayProxyResponse, error) {
	// Add job: prefix if missing
	if !strings.HasPrefix(jobID, "job:") {
		jobID = "job:" + jobID
	}

	jobsTable := os.Getenv("JOBS_TABLE")
	if jobsTable == "" {
		jobsTable = "listbackup-main-jobs"
	}

	// Get single job by ID
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
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

	if result.Item == nil {
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

	// Unmarshal job
	var job apitypes.Job
	err = dynamodbattribute.UnmarshalMap(result.Item, &job)
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
	if job.AccountID != accountID {
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

	// Strip prefixes for response
	jobResponse := map[string]interface{}{
		"jobId":     strings.TrimPrefix(job.JobID, "job:"),
		"accountId": job.AccountID,
		"userId":    job.UserID,
		"sourceId":  strings.TrimPrefix(job.SourceID, "source:"),
		"name":      job.Name,
		"type":      job.Type,
		"subType":   job.SubType,
		"priority":  job.Priority,
		"schedule":  job.Schedule,
		"status":    job.Status,
		"enabled":   job.Enabled,
		"config":    job.Config,
		"progress":  job.Progress,
		"createdAt": job.CreatedAt,
		"updatedAt": job.UpdatedAt,
		"startedAt": job.StartedAt,
		"completedAt": job.CompletedAt,
		"lastRunAt": job.LastRunAt,
		"nextRunAt": job.NextRunAt,
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

func (h *GetJobsHandler) getAllJobs(ctx context.Context, accountID string) (events.APIGatewayProxyResponse, error) {
	jobsTable := os.Getenv("JOBS_TABLE")
	if jobsTable == "" {
		jobsTable = "listbackup-main-jobs"
	}

	// Query jobs by accountId
	result, err := h.db.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(jobsTable),
		FilterExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {
				S: aws.String(accountID),
			},
		},
	})

	var jobList []apitypes.Job

	// If scan fails, return empty list
	if err != nil {
		log.Printf("Scan failed, returning empty list: %v", err)
		jobList = []apitypes.Job{}
	} else {
		// Unmarshal results
		for _, item := range result.Items {
			var job apitypes.Job
			if err := dynamodbattribute.UnmarshalMap(item, &job); err == nil {
				jobList = append(jobList, job)
			}
		}
	}
	
	// Strip job: prefixes for API response
	for i := range jobList {
		if strings.HasPrefix(jobList[i].JobID, "job:") {
			jobList[i].JobID = strings.TrimPrefix(jobList[i].JobID, "job:")
		}
		if strings.HasPrefix(jobList[i].AccountID, "account:") {
			jobList[i].AccountID = strings.TrimPrefix(jobList[i].AccountID, "account:")
		}
		if strings.HasPrefix(jobList[i].UserID, "user:") {
			jobList[i].UserID = strings.TrimPrefix(jobList[i].UserID, "user:")
		}
		// Strip source: prefix from sourceId
		if strings.HasPrefix(jobList[i].SourceID, "source:") {
			jobList[i].SourceID = strings.TrimPrefix(jobList[i].SourceID, "source:")
		}
	}

	responseData := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"jobs":  jobList,
			"total": len(jobList),
		},
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

func main() {
	handler, err := NewGetJobsHandler()
	if err != nil {
		log.Fatalf("Failed to create get jobs handler: %v", err)
	}

	lambda.Start(handler.Handle)
}