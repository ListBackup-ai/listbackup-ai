package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type ListTagsHandler struct {
	db *dynamodb.DynamoDB
}

type Tag struct {
	TagID       string                 `json:"tagId" dynamodbav:"tagId"`
	AccountID   string                 `json:"accountId" dynamodbav:"accountId"`
	UserID      string                 `json:"userId" dynamodbav:"userId"`
	Name        string                 `json:"name" dynamodbav:"name"`
	Description string                 `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Color       string                 `json:"color" dynamodbav:"color"`
	Category    string                 `json:"category,omitempty" dynamodbav:"category,omitempty"`
	IsSystem    bool                   `json:"isSystem" dynamodbav:"isSystem"`
	UsageCount  int                    `json:"usageCount" dynamodbav:"usageCount"`
	Metadata    map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	CreatedAt   time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type ListTagsResponse struct {
	Success    bool   `json:"success"`
	Message    string `json:"message,omitempty"`
	Data       *TagsList `json:"data,omitempty"`
	Error      string `json:"error,omitempty"`
}

type TagsList struct {
	Tags       []Tag  `json:"tags"`
	TotalCount int    `json:"totalCount"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	HasMore    bool   `json:"hasMore"`
}

func NewListTagsHandler() (*ListTagsHandler, error) {
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

	return &ListTagsHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *ListTagsHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("ListTags request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
		}, nil
	}

	// Extract user context from authorizer
	var userID, accountID string
	if event.RequestContext.Authorizer != nil {
		if authLambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
			if uid, ok := authLambda["userId"].(string); ok {
				userID = uid
			}
			if aid, ok := authLambda["accountId"].(string); ok {
				accountID = aid
			}
		} else {
			if uid, ok := event.RequestContext.Authorizer["userId"].(string); ok {
				userID = uid
			}
			if aid, ok := event.RequestContext.Authorizer["accountId"].(string); ok {
				accountID = aid
			}
		}
	}

	if userID == "" || accountID == "" {
		return createErrorResponse(401, "User not authenticated"), nil
	}

	// Parse query parameters
	category := event.QueryStringParameters["category"]
	sortBy := event.QueryStringParameters["sortBy"]
	if sortBy == "" {
		sortBy = "name" // Default sort by name
	}

	limit := 50 // Default limit
	if limitStr := event.QueryStringParameters["limit"]; limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	page := 1 // Default page
	if pageStr := event.QueryStringParameters["page"]; pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	// Get tags from DynamoDB
	tags, totalCount, err := h.getTags(accountID, category, sortBy, limit, page)
	if err != nil {
		log.Printf("ERROR: Failed to get tags: %v", err)
		return createErrorResponse(500, "Failed to retrieve tags"), nil
	}

	// Calculate pagination info
	hasMore := totalCount > (page * limit)

	// Create response
	response := ListTagsResponse{
		Success: true,
		Message: "Tags retrieved successfully",
		Data: &TagsList{
			Tags:       tags,
			TotalCount: totalCount,
			Page:       page,
			Limit:      limit,
			HasMore:    hasMore,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *ListTagsHandler) getTags(accountID, category, sortBy string, limit, page int) ([]Tag, int, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	// Build query parameters
	var keyCondition string
	var filterExpression string
	var expressionAttributeNames map[string]*string
	var expressionAttributeValues map[string]*dynamodb.AttributeValue

	keyCondition = "accountId = :accountId"
	expressionAttributeValues = map[string]*dynamodb.AttributeValue{
		":accountId": {S: aws.String(accountID)},
	}

	// Add category filter if specified
	if category != "" {
		filterExpression = "category = :category"
		expressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(category)}
	}

	// Build sort key based on sortBy parameter
	var indexName *string
	switch sortBy {
	case "usage":
		indexName = aws.String("AccountUsageIndex")
	case "created":
		indexName = aws.String("AccountCreatedIndex")
	case "updated":
		indexName = aws.String("AccountUpdatedIndex")
	default:
		indexName = aws.String("AccountNameIndex")
	}

	// Query DynamoDB
	input := &dynamodb.QueryInput{
		TableName:                 aws.String(tagsTable),
		IndexName:                 indexName,
		KeyConditionExpression:    aws.String(keyCondition),
		ExpressionAttributeValues: expressionAttributeValues,
		ScanIndexForward:          aws.Bool(true), // Ascending order
		Limit:                     aws.Int64(int64(limit)),
	}

	if filterExpression != "" {
		input.FilterExpression = aws.String(filterExpression)
	}

	if expressionAttributeNames != nil {
		input.ExpressionAttributeNames = expressionAttributeNames
	}

	// Calculate offset for pagination (DynamoDB doesn't support direct offset, so we'll simulate it)
	offset := (page - 1) * limit
	var lastEvaluatedKey map[string]*dynamodb.AttributeValue

	// If not first page, we need to "skip" to the right position
	// This is a simplified approach - in production, you'd use lastEvaluatedKey properly
	if offset > 0 {
		// For simplicity, we'll fetch all items up to our position
		// In production, you'd implement proper cursor-based pagination
		input.Limit = aws.Int64(int64(offset + limit))
	}

	result, err := h.db.Query(input)
	if err != nil {
		return nil, 0, err
	}

	// Unmarshal results
	var allTags []Tag
	for _, item := range result.Items {
		var tag Tag
		if err := dynamodbattribute.UnmarshalMap(item, &tag); err != nil {
			log.Printf("ERROR: Failed to unmarshal tag: %v", err)
			continue
		}
		allTags = append(allTags, tag)
	}

	// Apply pagination offset
	var tags []Tag
	if offset < len(allTags) {
		endIndex := offset + limit
		if endIndex > len(allTags) {
			endIndex = len(allTags)
		}
		tags = allTags[offset:endIndex]
	}

	// Get total count for the account (without filters for now - this could be optimized)
	totalCount := len(allTags)
	if offset > 0 {
		// If we paginated, we need to get the actual total count
		totalCount, _ = h.getTotalTagCount(accountID, category)
	}

	return tags, totalCount, nil
}

func (h *ListTagsHandler) getTotalTagCount(accountID, category string) (int, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	input := &dynamodb.QueryInput{
		TableName:              aws.String(tagsTable),
		IndexName:              aws.String("AccountNameIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
		Select: aws.String("COUNT"),
	}

	if category != "" {
		input.FilterExpression = aws.String("category = :category")
		input.ExpressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(category)}
	}

	result, err := h.db.Query(input)
	if err != nil {
		return 0, err
	}

	return int(*result.Count), nil
}

func createSuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := ListTagsResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewListTagsHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}