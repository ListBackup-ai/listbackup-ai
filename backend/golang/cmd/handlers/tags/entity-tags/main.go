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

type EntityTagsHandler struct {
	db *dynamodb.DynamoDB
}

type EntityTag struct {
	EntityTagID string    `json:"entityTagId" dynamodbav:"entityTagId"`
	AccountID   string    `json:"accountId" dynamodbav:"accountId"`
	EntityID    string    `json:"entityId" dynamodbav:"entityId"`
	EntityType  string    `json:"entityType" dynamodbav:"entityType"`
	TagID       string    `json:"tagId" dynamodbav:"tagId"`
	UserID      string    `json:"userId" dynamodbav:"userId"`
	CreatedAt   time.Time `json:"createdAt" dynamodbav:"createdAt"`
}

type Tag struct {
	TagID       string                 `json:"tagId" dynamodbav:"tagId"`
	AccountID   string                 `json:"accountId" dynamodbav:"accountId"`
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

type AddEntityTagsRequest struct {
	EntityID   string   `json:"entityId"`
	EntityType string   `json:"entityType"`
	TagIDs     []string `json:"tagIds"`
}

type RemoveEntityTagsRequest struct {
	EntityID   string   `json:"entityId"`
	EntityType string   `json:"entityType"`
	TagIDs     []string `json:"tagIds"`
}

type GetEntityTagsResponse struct {
	Success bool  `json:"success"`
	Message string `json:"message,omitempty"`
	Data    *EntityTagsData `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

type EntityTagsData struct {
	EntityID   string `json:"entityId"`
	EntityType string `json:"entityType"`
	Tags       []Tag  `json:"tags"`
}

type EntityTagsResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func NewEntityTagsHandler() (*EntityTagsHandler, error) {
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

	return &EntityTagsHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *EntityTagsHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("EntityTags request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

	// Route based on HTTP method
	switch event.HTTPMethod {
	case "GET":
		return h.handleGetEntityTags(event, userID, accountID)
	case "POST":
		return h.handleAddEntityTags(event, userID, accountID)
	case "DELETE":
		return h.handleRemoveEntityTags(event, userID, accountID)
	default:
		return createErrorResponse(405, "Method not allowed"), nil
	}
}

func (h *EntityTagsHandler) handleGetEntityTags(event events.APIGatewayProxyRequest, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Extract entity info from query parameters
	entityID := event.QueryStringParameters["entityId"]
	entityType := event.QueryStringParameters["entityType"]

	if entityID == "" || entityType == "" {
		return createErrorResponse(400, "entityId and entityType are required"), nil
	}

	// Get entity tags
	tags, err := h.getEntityTags(accountID, entityID, entityType)
	if err != nil {
		log.Printf("ERROR: Failed to get entity tags: %v", err)
		return createErrorResponse(500, "Failed to retrieve entity tags"), nil
	}

	response := GetEntityTagsResponse{
		Success: true,
		Message: "Entity tags retrieved successfully",
		Data: &EntityTagsData{
			EntityID:   entityID,
			EntityType: entityType,
			Tags:       tags,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *EntityTagsHandler) handleAddEntityTags(event events.APIGatewayProxyRequest, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Parse request body
	var req AddEntityTagsRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.EntityID == "" || req.EntityType == "" || len(req.TagIDs) == 0 {
		return createErrorResponse(400, "entityId, entityType, and tagIds are required"), nil
	}

	// Validate entity type
	validEntityTypes := []string{"source", "connection", "group", "job", "client", "team", "account"}
	if !contains(validEntityTypes, req.EntityType) {
		return createErrorResponse(400, "Invalid entity type"), nil
	}

	// Add tags to entity
	addedTags, err := h.addEntityTags(accountID, userID, req.EntityID, req.EntityType, req.TagIDs)
	if err != nil {
		log.Printf("ERROR: Failed to add entity tags: %v", err)
		return createErrorResponse(500, "Failed to add entity tags"), nil
	}

	response := EntityTagsResponse{
		Success: true,
		Message: "Entity tags added successfully",
		Data: map[string]interface{}{
			"entityId":   req.EntityID,
			"entityType": req.EntityType,
			"addedTags":  addedTags,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *EntityTagsHandler) handleRemoveEntityTags(event events.APIGatewayProxyRequest, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Parse request body
	var req RemoveEntityTagsRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.EntityID == "" || req.EntityType == "" || len(req.TagIDs) == 0 {
		return createErrorResponse(400, "entityId, entityType, and tagIds are required"), nil
	}

	// Remove tags from entity
	removedCount, err := h.removeEntityTags(accountID, req.EntityID, req.EntityType, req.TagIDs)
	if err != nil {
		log.Printf("ERROR: Failed to remove entity tags: %v", err)
		return createErrorResponse(500, "Failed to remove entity tags"), nil
	}

	response := EntityTagsResponse{
		Success: true,
		Message: "Entity tags removed successfully",
		Data: map[string]interface{}{
			"entityId":     req.EntityID,
			"entityType":   req.EntityType,
			"removedCount": removedCount,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *EntityTagsHandler) getEntityTags(accountID, entityID, entityType string) ([]Tag, error) {
	entityTagsTable := os.Getenv("ENTITY_TAGS_TABLE")
	if entityTagsTable == "" {
		entityTagsTable = "listbackup-main-entity-tags"
	}

	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	// Get entity tag associations
	input := &dynamodb.QueryInput{
		TableName:              aws.String(entityTagsTable),
		IndexName:              aws.String("EntityIndex"),
		KeyConditionExpression: aws.String("entityId = :entityId AND entityType = :entityType"),
		FilterExpression:       aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":entityId":   {S: aws.String(entityID)},
			":entityType": {S: aws.String(entityType)},
			":accountId":  {S: aws.String(accountID)},
		},
	}

	result, err := h.db.Query(input)
	if err != nil {
		return nil, err
	}

	// Extract tag IDs
	var tagIDs []string
	for _, item := range result.Items {
		var entityTag EntityTag
		if err := dynamodbattribute.UnmarshalMap(item, &entityTag); err != nil {
			log.Printf("ERROR: Failed to unmarshal entity tag: %v", err)
			continue
		}
		tagIDs = append(tagIDs, entityTag.TagID)
	}

	if len(tagIDs) == 0 {
		return []Tag{}, nil
	}

	// Get tag details
	return h.getTagsByIDs(accountID, tagIDs)
}

func (h *EntityTagsHandler) getTagsByIDs(accountID string, tagIDs []string) ([]Tag, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	var tags []Tag
	
	// Batch get tags (DynamoDB BatchGetItem)
	for _, tagID := range tagIDs {
		input := &dynamodb.GetItemInput{
			TableName: aws.String(tagsTable),
			Key: map[string]*dynamodb.AttributeValue{
				"tagId": {S: aws.String(tagID)},
			},
		}

		result, err := h.db.GetItem(input)
		if err != nil {
			log.Printf("ERROR: Failed to get tag %s: %v", tagID, err)
			continue
		}

		if result.Item != nil {
			var tag Tag
			if err := dynamodbattribute.UnmarshalMap(result.Item, &tag); err != nil {
				log.Printf("ERROR: Failed to unmarshal tag: %v", err)
				continue
			}

			// Verify tag belongs to the same account
			if tag.AccountID == accountID {
				tags = append(tags, tag)
			}
		}
	}

	return tags, nil
}

func (h *EntityTagsHandler) addEntityTags(accountID, userID, entityID, entityType string, tagIDs []string) ([]string, error) {
	entityTagsTable := os.Getenv("ENTITY_TAGS_TABLE")
	if entityTagsTable == "" {
		entityTagsTable = "listbackup-main-entity-tags"
	}

	var addedTags []string
	now := time.Now()

	for _, tagID := range tagIDs {
		// Check if association already exists
		exists, err := h.entityTagExists(accountID, entityID, entityType, tagID)
		if err != nil {
			log.Printf("ERROR: Failed to check entity tag existence: %v", err)
			continue
		}

		if exists {
			continue // Skip if already exists
		}

		// Create new entity tag association
		entityTag := EntityTag{
			EntityTagID: uuid.New().String(),
			AccountID:   accountID,
			EntityID:    entityID,
			EntityType:  entityType,
			TagID:       tagID,
			UserID:      userID,
			CreatedAt:   now,
		}

		item, err := dynamodbattribute.MarshalMap(entityTag)
		if err != nil {
			log.Printf("ERROR: Failed to marshal entity tag: %v", err)
			continue
		}

		_, err = h.db.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(entityTagsTable),
			Item:      item,
		})
		if err != nil {
			log.Printf("ERROR: Failed to store entity tag: %v", err)
			continue
		}

		addedTags = append(addedTags, tagID)

		// Update tag usage count
		h.incrementTagUsageCount(tagID)
	}

	return addedTags, nil
}

func (h *EntityTagsHandler) removeEntityTags(accountID, entityID, entityType string, tagIDs []string) (int, error) {
	entityTagsTable := os.Getenv("ENTITY_TAGS_TABLE")
	if entityTagsTable == "" {
		entityTagsTable = "listbackup-main-entity-tags"
	}

	removedCount := 0

	for _, tagID := range tagIDs {
		// Find and delete entity tag association
		entityTagID, err := h.findEntityTagID(accountID, entityID, entityType, tagID)
		if err != nil {
			log.Printf("ERROR: Failed to find entity tag: %v", err)
			continue
		}

		if entityTagID == "" {
			continue // Association doesn't exist
		}

		_, err = h.db.DeleteItem(&dynamodb.DeleteItemInput{
			TableName: aws.String(entityTagsTable),
			Key: map[string]*dynamodb.AttributeValue{
				"entityTagId": {S: aws.String(entityTagID)},
			},
		})
		if err != nil {
			log.Printf("ERROR: Failed to delete entity tag: %v", err)
			continue
		}

		removedCount++

		// Update tag usage count
		h.decrementTagUsageCount(tagID)
	}

	return removedCount, nil
}

func (h *EntityTagsHandler) entityTagExists(accountID, entityID, entityType, tagID string) (bool, error) {
	entityTagsTable := os.Getenv("ENTITY_TAGS_TABLE")
	if entityTagsTable == "" {
		entityTagsTable = "listbackup-main-entity-tags"
	}

	input := &dynamodb.QueryInput{
		TableName:              aws.String(entityTagsTable),
		IndexName:              aws.String("EntityTagIndex"),
		KeyConditionExpression: aws.String("entityId = :entityId AND tagId = :tagId"),
		FilterExpression:       aws.String("accountId = :accountId AND entityType = :entityType"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":entityId":   {S: aws.String(entityID)},
			":tagId":      {S: aws.String(tagID)},
			":accountId":  {S: aws.String(accountID)},
			":entityType": {S: aws.String(entityType)},
		},
		Limit: aws.Int64(1),
	}

	result, err := h.db.Query(input)
	if err != nil {
		return false, err
	}

	return len(result.Items) > 0, nil
}

func (h *EntityTagsHandler) findEntityTagID(accountID, entityID, entityType, tagID string) (string, error) {
	entityTagsTable := os.Getenv("ENTITY_TAGS_TABLE")
	if entityTagsTable == "" {
		entityTagsTable = "listbackup-main-entity-tags"
	}

	input := &dynamodb.QueryInput{
		TableName:              aws.String(entityTagsTable),
		IndexName:              aws.String("EntityTagIndex"),
		KeyConditionExpression: aws.String("entityId = :entityId AND tagId = :tagId"),
		FilterExpression:       aws.String("accountId = :accountId AND entityType = :entityType"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":entityId":   {S: aws.String(entityID)},
			":tagId":      {S: aws.String(tagID)},
			":accountId":  {S: aws.String(accountID)},
			":entityType": {S: aws.String(entityType)},
		},
		Limit: aws.Int64(1),
	}

	result, err := h.db.Query(input)
	if err != nil {
		return "", err
	}

	if len(result.Items) == 0 {
		return "", nil
	}

	var entityTag EntityTag
	if err := dynamodbattribute.UnmarshalMap(result.Items[0], &entityTag); err != nil {
		return "", err
	}

	return entityTag.EntityTagID, nil
}

func (h *EntityTagsHandler) incrementTagUsageCount(tagID string) {
	h.updateTagUsageCount(tagID, 1)
}

func (h *EntityTagsHandler) decrementTagUsageCount(tagID string) {
	h.updateTagUsageCount(tagID, -1)
}

func (h *EntityTagsHandler) updateTagUsageCount(tagID string, delta int) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	_, err := h.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(tagsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"tagId": {S: aws.String(tagID)},
		},
		UpdateExpression: aws.String("ADD usageCount :delta SET updatedAt = :now"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":delta": {N: aws.String(string(rune(delta)))},
			":now":   {S: aws.String(time.Now().Format(time.RFC3339))},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to update tag usage count: %v", err)
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if strings.EqualFold(s, item) {
			return true
		}
	}
	return false
}

func createSuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := EntityTagsResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewEntityTagsHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}