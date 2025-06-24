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

type DeleteTagHandler struct {
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

type EntityTag struct {
	EntityTagID string `json:"entityTagId" dynamodbav:"entityTagId"`
	AccountID   string `json:"accountId" dynamodbav:"accountId"`
	EntityID    string `json:"entityId" dynamodbav:"entityId"`
	EntityType  string `json:"entityType" dynamodbav:"entityType"`
	TagID       string `json:"tagId" dynamodbav:"tagId"`
}

type DeleteTagResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

func NewDeleteTagHandler() (*DeleteTagHandler, error) {
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

	return &DeleteTagHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *DeleteTagHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("DeleteTag request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "DELETE, OPTIONS",
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

	// Get existing tag to validate ownership and check if it's a system tag
	existingTag, err := h.getTag(tagID, accountID)
	if err != nil {
		log.Printf("ERROR: Failed to get existing tag: %v", err)
		return createErrorResponse(500, "Failed to get existing tag"), nil
	}

	if existingTag == nil {
		return createErrorResponse(404, "Tag not found"), nil
	}

	// Don't allow deleting system tags
	if existingTag.IsSystem {
		return createErrorResponse(403, "Cannot delete system tags"), nil
	}

	// Check if tag is in use (has entity associations)
	inUse, err := h.isTagInUse(tagID)
	if err != nil {
		log.Printf("ERROR: Failed to check tag usage: %v", err)
		return createErrorResponse(500, "Failed to check tag usage"), nil
	}

	if inUse {
		// Get query parameter to force deletion
		forceDelete := event.QueryStringParameters["force"] == "true"
		
		if !forceDelete {
			return createErrorResponse(409, "Tag is in use. Use ?force=true to delete anyway"), nil
		}

		// Remove all entity associations first
		err = h.removeAllEntityAssociations(tagID)
		if err != nil {
			log.Printf("ERROR: Failed to remove entity associations: %v", err)
			return createErrorResponse(500, "Failed to remove entity associations"), nil
		}
	}

	// Delete the tag
	err = h.deleteTag(tagID, accountID)
	if err != nil {
		log.Printf("ERROR: Failed to delete tag: %v", err)
		return createErrorResponse(500, "Failed to delete tag"), nil
	}

	// Return success response
	response := DeleteTagResponse{
		Success: true,
		Message: "Tag deleted successfully",
	}

	return createSuccessResponse(200, response), nil
}

func (h *DeleteTagHandler) getTag(tagID, accountID string) (*Tag, error) {
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

func (h *DeleteTagHandler) isTagInUse(tagID string) (bool, error) {
	entityTagsTable := os.Getenv("ENTITY_TAGS_TABLE")
	if entityTagsTable == "" {
		entityTagsTable = "listbackup-main-entity-tags"
	}

	input := &dynamodb.QueryInput{
		TableName:              aws.String(entityTagsTable),
		IndexName:              aws.String("TagIndex"),
		KeyConditionExpression: aws.String("tagId = :tagId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":tagId": {S: aws.String(tagID)},
		},
		Limit: aws.Int64(1), // We only need to know if ANY associations exist
	}

	result, err := h.db.Query(input)
	if err != nil {
		return false, err
	}

	return len(result.Items) > 0, nil
}

func (h *DeleteTagHandler) removeAllEntityAssociations(tagID string) error {
	entityTagsTable := os.Getenv("ENTITY_TAGS_TABLE")
	if entityTagsTable == "" {
		entityTagsTable = "listbackup-main-entity-tags"
	}

	// Get all entity associations for this tag
	input := &dynamodb.QueryInput{
		TableName:              aws.String(entityTagsTable),
		IndexName:              aws.String("TagIndex"),
		KeyConditionExpression: aws.String("tagId = :tagId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":tagId": {S: aws.String(tagID)},
		},
	}

	result, err := h.db.Query(input)
	if err != nil {
		return err
	}

	// Batch delete all associations
	if len(result.Items) > 0 {
		var writeRequests []*dynamodb.WriteRequest
		
		for _, item := range result.Items {
			var entityTag EntityTag
			err = dynamodbattribute.UnmarshalMap(item, &entityTag)
			if err != nil {
				log.Printf("WARNING: Failed to unmarshal entity tag: %v", err)
				continue
			}

			writeRequests = append(writeRequests, &dynamodb.WriteRequest{
				DeleteRequest: &dynamodb.DeleteRequest{
					Key: map[string]*dynamodb.AttributeValue{
						"entityTagId": {S: aws.String(entityTag.EntityTagID)},
					},
				},
			})
		}

		// Process in batches of 25 (DynamoDB BatchWriteItem limit)
		for i := 0; i < len(writeRequests); i += 25 {
			end := i + 25
			if end > len(writeRequests) {
				end = len(writeRequests)
			}

			batch := writeRequests[i:end]
			batchInput := &dynamodb.BatchWriteItemInput{
				RequestItems: map[string][]*dynamodb.WriteRequest{
					entityTagsTable: batch,
				},
			}

			_, err := h.db.BatchWriteItem(batchInput)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (h *DeleteTagHandler) deleteTag(tagID, accountID string) error {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	input := &dynamodb.DeleteItemInput{
		TableName: aws.String(tagsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"tagId": {S: aws.String(tagID)},
		},
		ConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
	}

	_, err := h.db.DeleteItem(input)
	return err
}

func createSuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := DeleteTagResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewDeleteTagHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}