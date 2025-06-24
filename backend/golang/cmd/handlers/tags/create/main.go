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

type CreateTagHandler struct {
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

type CreateTagRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description,omitempty"`
	Color       string                 `json:"color"`
	Category    string                 `json:"category,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type CreateTagResponse struct {
	Success bool `json:"success"`
	Message string `json:"message,omitempty"`
	Data    *Tag   `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func NewCreateTagHandler() (*CreateTagHandler, error) {
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

	return &CreateTagHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *CreateTagHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("CreateTag request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
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

	// Parse request body
	var req CreateTagRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.Name == "" {
		return createErrorResponse(400, "Tag name is required"), nil
	}

	if req.Color == "" {
		req.Color = "#3B82F6" // Default blue color
	}

	// Normalize tag name
	normalizedName := strings.TrimSpace(strings.ToLower(req.Name))
	if len(normalizedName) < 1 || len(normalizedName) > 50 {
		return createErrorResponse(400, "Tag name must be between 1 and 50 characters"), nil
	}

	// Check if tag already exists for this account
	existingTag, err := h.getTagByName(accountID, normalizedName)
	if err != nil {
		log.Printf("ERROR: Failed to check existing tag: %v", err)
		return createErrorResponse(500, "Failed to check existing tag"), nil
	}

	if existingTag != nil {
		return createErrorResponse(409, "Tag with this name already exists"), nil
	}

	// Create new tag
	tagID := uuid.New().String()
	now := time.Now()

	tag := &Tag{
		TagID:       tagID,
		AccountID:   accountID,
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		Category:    req.Category,
		IsSystem:    false,
		UsageCount:  0,
		Metadata:    req.Metadata,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Store in DynamoDB
	item, err := dynamodbattribute.MarshalMap(tag)
	if err != nil {
		log.Printf("ERROR: Failed to marshal tag: %v", err)
		return createErrorResponse(500, "Failed to create tag"), nil
	}

	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tagsTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("ERROR: Failed to store tag: %v", err)
		return createErrorResponse(500, "Failed to create tag"), nil
	}

	// Return success response
	response := CreateTagResponse{
		Success: true,
		Message: "Tag created successfully",
		Data:    tag,
	}

	return createSuccessResponse(201, response), nil
}

func (h *CreateTagHandler) getTagByName(accountID, normalizedName string) (*Tag, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	// Query for existing tag by account and normalized name
	input := &dynamodb.QueryInput{
		TableName:              aws.String(tagsTable),
		IndexName:              aws.String("AccountNameIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId AND #name = :name"),
		ExpressionAttributeNames: map[string]*string{
			"#name": aws.String("normalizedName"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
			":name":      {S: aws.String(normalizedName)},
		},
		Limit: aws.Int64(1),
	}

	result, err := h.db.Query(input)
	if err != nil {
		return nil, err
	}

	if len(result.Items) == 0 {
		return nil, nil
	}

	var tag Tag
	err = dynamodbattribute.UnmarshalMap(result.Items[0], &tag)
	if err != nil {
		return nil, err
	}

	return &tag, nil
}

func createSuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := CreateTagResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewCreateTagHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}