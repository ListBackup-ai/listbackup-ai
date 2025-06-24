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
)

type UpdateTagHandler struct {
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

type UpdateTagRequest struct {
	Name        *string                `json:"name,omitempty"`
	Description *string                `json:"description,omitempty"`
	Color       *string                `json:"color,omitempty"`
	Category    *string                `json:"category,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type UpdateTagResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    *Tag   `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func NewUpdateTagHandler() (*UpdateTagHandler, error) {
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

	return &UpdateTagHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *UpdateTagHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("UpdateTag request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "PUT, OPTIONS",
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

	// Parse request body
	var req UpdateTagRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Get existing tag
	existingTag, err := h.getTag(tagID, accountID)
	if err != nil {
		log.Printf("ERROR: Failed to get existing tag: %v", err)
		return createErrorResponse(500, "Failed to get existing tag"), nil
	}

	if existingTag == nil {
		return createErrorResponse(404, "Tag not found"), nil
	}

	// Don't allow updating system tags
	if existingTag.IsSystem {
		return createErrorResponse(403, "Cannot update system tags"), nil
	}

	// Validate name if provided
	if req.Name != nil {
		normalizedName := strings.TrimSpace(strings.ToLower(*req.Name))
		if len(normalizedName) < 1 || len(normalizedName) > 50 {
			return createErrorResponse(400, "Tag name must be between 1 and 50 characters"), nil
		}

		// Check if another tag with this name already exists
		if normalizedName != strings.ToLower(existingTag.Name) {
			conflictTag, err := h.getTagByName(accountID, normalizedName)
			if err != nil {
				log.Printf("ERROR: Failed to check name conflict: %v", err)
				return createErrorResponse(500, "Failed to check name conflict"), nil
			}
			if conflictTag != nil {
				return createErrorResponse(409, "Tag with this name already exists"), nil
			}
		}
	}

	// Update tag
	updatedTag, err := h.updateTag(tagID, accountID, req)
	if err != nil {
		log.Printf("ERROR: Failed to update tag: %v", err)
		return createErrorResponse(500, "Failed to update tag"), nil
	}

	// Return success response
	response := UpdateTagResponse{
		Success: true,
		Message: "Tag updated successfully",
		Data:    updatedTag,
	}

	return createSuccessResponse(200, response), nil
}

func (h *UpdateTagHandler) getTag(tagID, accountID string) (*Tag, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

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
		return nil, nil
	}

	return &tag, nil
}

func (h *UpdateTagHandler) getTagByName(accountID, normalizedName string) (*Tag, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

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

func (h *UpdateTagHandler) updateTag(tagID, accountID string, req UpdateTagRequest) (*Tag, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	now := time.Now()
	
	// Build update expression
	updateExpression := "SET updatedAt = :updatedAt"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":updatedAt": {S: aws.String(now.Format(time.RFC3339))},
	}

	if req.Name != nil {
		updateExpression += ", #name = :name"
		expressionAttributeValues[":name"] = &dynamodb.AttributeValue{S: aws.String(*req.Name)}
	}

	if req.Description != nil {
		updateExpression += ", description = :description"
		expressionAttributeValues[":description"] = &dynamodb.AttributeValue{S: aws.String(*req.Description)}
	}

	if req.Color != nil {
		updateExpression += ", color = :color"
		expressionAttributeValues[":color"] = &dynamodb.AttributeValue{S: aws.String(*req.Color)}
	}

	if req.Category != nil {
		updateExpression += ", category = :category"
		expressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(*req.Category)}
	}

	if req.Metadata != nil {
		metadataAttr, err := dynamodbattribute.Marshal(req.Metadata)
		if err == nil {
			updateExpression += ", metadata = :metadata"
			expressionAttributeValues[":metadata"] = metadataAttr
		}
	}

	var expressionAttributeNames map[string]*string
	if req.Name != nil {
		expressionAttributeNames = map[string]*string{
			"#name": aws.String("name"),
		}
	}

	input := &dynamodb.UpdateItemInput{
		TableName: aws.String(tagsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"tagId": {S: aws.String(tagID)},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
		ConditionExpression:       aws.String("accountId = :accountId"),
		ReturnValues:              aws.String("ALL_NEW"),
	}

	if expressionAttributeNames != nil {
		input.ExpressionAttributeNames = expressionAttributeNames
	}

	// Add account ID to condition
	expressionAttributeValues[":accountId"] = &dynamodb.AttributeValue{S: aws.String(accountID)}

	result, err := h.db.UpdateItem(input)
	if err != nil {
		return nil, err
	}

	var updatedTag Tag
	err = dynamodbattribute.UnmarshalMap(result.Attributes, &updatedTag)
	if err != nil {
		return nil, err
	}

	return &updatedTag, nil
}

func createSuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "PUT, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := UpdateTagResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "PUT, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewUpdateTagHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}