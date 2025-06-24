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
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type GetTagHandler struct {
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

type GetTagResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    *Tag   `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func NewGetTagHandler() (*GetTagHandler, error) {
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

	return &GetTagHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *GetTagHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("GetTag request: %+v", event)

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

	// Get tagId from path parameters
	tagID, ok := event.PathParameters["tagId"]
	if !ok || tagID == "" {
		return createErrorResponse(400, "Tag ID is required"), nil
	}

	// Get tag from DynamoDB
	tag, err := h.getTag(tagID, accountID)
	if err != nil {
		log.Printf("ERROR: Failed to get tag: %v", err)
		return createErrorResponse(500, "Failed to retrieve tag"), nil
	}

	if tag == nil {
		return createErrorResponse(404, "Tag not found"), nil
	}

	// Return success response
	response := GetTagResponse{
		Success: true,
		Message: "Tag retrieved successfully",
		Data:    tag,
	}

	return createSuccessResponse(200, response), nil
}

func (h *GetTagHandler) getTag(tagID, accountID string) (*Tag, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	// Get item from DynamoDB
	input := &dynamodb.GetItemInput{
		TableName: aws.String(tagsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"tagId": {S: aws.String(tagID)},
		},
	}

	result, err := h.db.GetItem(input)
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var tag Tag
	err = dynamodbattribute.UnmarshalMap(result.Item, &tag)
	if err != nil {
		return nil, err
	}

	// Verify the tag belongs to the user's account
	if tag.AccountID != accountID {
		return nil, nil // Return nil if not authorized to access this tag
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
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := GetTagResponse{
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
	handler, err := NewGetTagHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}