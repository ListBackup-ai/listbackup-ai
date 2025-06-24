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

type ListJobsHandler struct {
	db *dynamodb.DynamoDB
}

func NewListJobsHandler() (*ListJobsHandler, error) {
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

	return &ListJobsHandler{db: db}, nil
}

func (h *ListJobsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List jobs request started")

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
	status := event.QueryStringParameters["status"]
	jobType := event.QueryStringParameters["type"]
	sourceID := event.QueryStringParameters["sourceId"]

	// Build filter expression
	filterExpressions := []string{"accountId = :accountId"}
	expressionValues := map[string]*dynamodb.AttributeValue{
		":accountId": {
			S: aws.String(accountID),
		},
	}

	if status != "" {
		filterExpressions = append(filterExpressions, "#status = :status")
		expressionValues[":status"] = &dynamodb.AttributeValue{S: aws.String(status)}
	}

	if jobType != "" {
		filterExpressions = append(filterExpressions, "#type = :type")
		expressionValues[":type"] = &dynamodb.AttributeValue{S: aws.String(jobType)}
	}

	if sourceID != "" {
		// Add source: prefix if missing
		if !strings.HasPrefix(sourceID, "source:") {
			sourceID = "source:" + sourceID
		}
		filterExpressions = append(filterExpressions, "sourceId = :sourceId")
		expressionValues[":sourceId"] = &dynamodb.AttributeValue{S: aws.String(sourceID)}
	}

	filterExpression := strings.Join(filterExpressions, " AND ")

	jobsTable := os.Getenv("JOBS_TABLE")
	if jobsTable == "" {
		jobsTable = "listbackup-main-jobs"
	}

	// Query jobs with filters
	input := &dynamodb.ScanInput{
		TableName:                 aws.String(jobsTable),
		FilterExpression:          aws.String(filterExpression),
		ExpressionAttributeValues: expressionValues,
	}

	// Add expression attribute names for reserved keywords
	if status != "" || jobType != "" {
		input.ExpressionAttributeNames = map[string]*string{}
		if status != "" {
			input.ExpressionAttributeNames["#status"] = aws.String("status")
		}
		if jobType != "" {
			input.ExpressionAttributeNames["#type"] = aws.String("type")
		}
	}

	result, err := h.db.Scan(input)

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

	// Strip prefixes for API response
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
	handler, err := NewListJobsHandler()
	if err != nil {
		log.Fatalf("Failed to create list jobs handler: %v", err)
	}

	lambda.Start(handler.Handle)
}