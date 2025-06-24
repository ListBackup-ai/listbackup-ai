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

type UpdateNotificationHandler struct {
	db *dynamodb.DynamoDB
}

type UpdateNotificationRequest struct {
	Title       string                 `json:"title,omitempty"`
	Message     string                 `json:"message,omitempty"`
	Type        string                 `json:"type,omitempty"`
	Category    string                 `json:"category,omitempty"`
	Priority    string                 `json:"priority,omitempty"`
	Status      string                 `json:"status,omitempty"`
	Channels    []string               `json:"channels,omitempty"`
	EntityID    string                 `json:"entityId,omitempty"`
	EntityType  string                 `json:"entityType,omitempty"`
	ActionURL   string                 `json:"actionUrl,omitempty"`
	ActionLabel string                 `json:"actionLabel,omitempty"`
	ImageURL    string                 `json:"imageUrl,omitempty"`
	Data        map[string]interface{} `json:"data,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	ExpiresAt   *time.Time             `json:"expiresAt,omitempty"`
}

type UpdateNotificationResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message,omitempty"`
	Data    *Notification `json:"data,omitempty"`
	Error   string        `json:"error,omitempty"`
}

type Notification struct {
	NotificationID string                 `json:"notificationId" dynamodbav:"notificationId"`
	AccountID      string                 `json:"accountId" dynamodbav:"accountId"`
	UserID         string                 `json:"userId" dynamodbav:"userId"`
	Type           string                 `json:"type" dynamodbav:"type"`
	Category       string                 `json:"category" dynamodbav:"category"`
	Title          string                 `json:"title" dynamodbav:"title"`
	Message        string                 `json:"message" dynamodbav:"message"`
	Priority       string                 `json:"priority" dynamodbav:"priority"`
	Status         string                 `json:"status" dynamodbav:"status"`
	Channels       []string               `json:"channels" dynamodbav:"channels"`
	EntityID       string                 `json:"entityId,omitempty" dynamodbav:"entityId,omitempty"`
	EntityType     string                 `json:"entityType,omitempty" dynamodbav:"entityType,omitempty"`
	ActionURL      string                 `json:"actionUrl,omitempty" dynamodbav:"actionUrl,omitempty"`
	ActionLabel    string                 `json:"actionLabel,omitempty" dynamodbav:"actionLabel,omitempty"`
	ImageURL       string                 `json:"imageUrl,omitempty" dynamodbav:"imageUrl,omitempty"`
	Data           map[string]interface{} `json:"data,omitempty" dynamodbav:"data,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	ScheduledFor   string                 `json:"scheduledFor,omitempty" dynamodbav:"scheduledFor,omitempty"`
	ExpiresAt      string                 `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"`
	ReadAt         string                 `json:"readAt,omitempty" dynamodbav:"readAt,omitempty"`
	DeliveredAt    string                 `json:"deliveredAt,omitempty" dynamodbav:"deliveredAt,omitempty"`
	FailureReason  string                 `json:"failureReason,omitempty" dynamodbav:"failureReason,omitempty"`
	CreatedAt      string                 `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt      string                 `json:"updatedAt" dynamodbav:"updatedAt"`
}

func NewUpdateNotificationHandler() (*UpdateNotificationHandler, error) {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}

	return &UpdateNotificationHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *UpdateNotificationHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("UpdateNotification request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "PUT, PATCH, OPTIONS",
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

	// Get notification ID from path parameters
	notificationID := event.PathParameters["notificationId"]
	if notificationID == "" {
		return createErrorResponse(400, "Notification ID is required"), nil
	}

	// Parse request body
	var req UpdateNotificationRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Get notifications table name
	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	// Get existing notification
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(notificationsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to get notification: %v", err)
		return createErrorResponse(500, "Failed to retrieve notification"), nil
	}

	if result.Item == nil {
		return createErrorResponse(404, "Notification not found"), nil
	}

	// Unmarshal existing notification
	var notification Notification
	err = dynamodbattribute.UnmarshalMap(result.Item, &notification)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal notification: %v", err)
		return createErrorResponse(500, "Failed to process notification"), nil
	}

	// Verify ownership - user can only update their own notifications or account-level notifications
	if notification.UserID != userID && notification.AccountID != accountID {
		return createErrorResponse(403, "Access denied"), nil
	}

	// Build update expression and attribute values
	updateExpression := "SET updatedAt = :updatedAt"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":updatedAt": {S: aws.String(time.Now().Format(time.RFC3339))},
	}
	expressionAttributeNames := make(map[string]*string)

	// Update fields that were provided
	if req.Title != "" {
		updateExpression += ", title = :title"
		expressionAttributeValues[":title"] = &dynamodb.AttributeValue{S: aws.String(req.Title)}
		notification.Title = req.Title
	}

	if req.Message != "" {
		updateExpression += ", message = :message"
		expressionAttributeValues[":message"] = &dynamodb.AttributeValue{S: aws.String(req.Message)}
		notification.Message = req.Message
	}

	if req.Type != "" {
		// Validate type
		validTypes := []string{"info", "success", "warning", "error", "system"}
		if !contains(validTypes, req.Type) {
			return createErrorResponse(400, "Invalid notification type"), nil
		}
		updateExpression += ", #type = :type"
		expressionAttributeNames["#type"] = aws.String("type")
		expressionAttributeValues[":type"] = &dynamodb.AttributeValue{S: aws.String(req.Type)}
		notification.Type = req.Type
	}

	if req.Category != "" {
		updateExpression += ", category = :category"
		expressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(req.Category)}
		notification.Category = req.Category
	}

	if req.Priority != "" {
		// Validate priority
		validPriorities := []string{"low", "normal", "high", "urgent"}
		if !contains(validPriorities, req.Priority) {
			return createErrorResponse(400, "Invalid notification priority"), nil
		}
		updateExpression += ", priority = :priority"
		expressionAttributeValues[":priority"] = &dynamodb.AttributeValue{S: aws.String(req.Priority)}
		notification.Priority = req.Priority
	}

	if req.Status != "" {
		// Validate status
		validStatuses := []string{"unread", "read", "archived", "deleted"}
		if !contains(validStatuses, req.Status) {
			return createErrorResponse(400, "Invalid notification status"), nil
		}
		updateExpression += ", #status = :status"
		expressionAttributeNames["#status"] = aws.String("status")
		expressionAttributeValues[":status"] = &dynamodb.AttributeValue{S: aws.String(req.Status)}
		notification.Status = req.Status

		// Handle special status updates
		if req.Status == "read" && notification.ReadAt == "" {
			updateExpression += ", readAt = :readAt"
			readTime := time.Now().Format(time.RFC3339)
			expressionAttributeValues[":readAt"] = &dynamodb.AttributeValue{S: aws.String(readTime)}
			notification.ReadAt = readTime
		} else if req.Status == "unread" {
			updateExpression += " REMOVE readAt"
			notification.ReadAt = ""
		}
	}

	if len(req.Channels) > 0 {
		// Validate channels
		validChannels := []string{"app", "email", "sms", "slack", "webhook"}
		for _, channel := range req.Channels {
			if !contains(validChannels, channel) {
				return createErrorResponse(400, "Invalid notification channel: "+channel), nil
			}
		}

		channelsAttr, err := dynamodbattribute.Marshal(req.Channels)
		if err != nil {
			return createErrorResponse(500, "Failed to process channels"), nil
		}
		updateExpression += ", channels = :channels"
		expressionAttributeValues[":channels"] = channelsAttr
		notification.Channels = req.Channels
	}

	if req.EntityID != "" {
		updateExpression += ", entityId = :entityId"
		expressionAttributeValues[":entityId"] = &dynamodb.AttributeValue{S: aws.String(req.EntityID)}
		notification.EntityID = req.EntityID
	}

	if req.EntityType != "" {
		updateExpression += ", entityType = :entityType"
		expressionAttributeValues[":entityType"] = &dynamodb.AttributeValue{S: aws.String(req.EntityType)}
		notification.EntityType = req.EntityType
	}

	if req.ActionURL != "" {
		updateExpression += ", actionUrl = :actionUrl"
		expressionAttributeValues[":actionUrl"] = &dynamodb.AttributeValue{S: aws.String(req.ActionURL)}
		notification.ActionURL = req.ActionURL
	}

	if req.ActionLabel != "" {
		updateExpression += ", actionLabel = :actionLabel"
		expressionAttributeValues[":actionLabel"] = &dynamodb.AttributeValue{S: aws.String(req.ActionLabel)}
		notification.ActionLabel = req.ActionLabel
	}

	if req.ImageURL != "" {
		updateExpression += ", imageUrl = :imageUrl"
		expressionAttributeValues[":imageUrl"] = &dynamodb.AttributeValue{S: aws.String(req.ImageURL)}
		notification.ImageURL = req.ImageURL
	}

	if req.Data != nil {
		dataAttr, err := dynamodbattribute.Marshal(req.Data)
		if err != nil {
			return createErrorResponse(500, "Failed to process data"), nil
		}
		updateExpression += ", #data = :data"
		expressionAttributeNames["#data"] = aws.String("data")
		expressionAttributeValues[":data"] = dataAttr
		notification.Data = req.Data
	}

	if req.Metadata != nil {
		metadataAttr, err := dynamodbattribute.Marshal(req.Metadata)
		if err != nil {
			return createErrorResponse(500, "Failed to process metadata"), nil
		}
		updateExpression += ", metadata = :metadata"
		expressionAttributeValues[":metadata"] = metadataAttr
		notification.Metadata = req.Metadata
	}

	if req.ExpiresAt != nil {
		updateExpression += ", expiresAt = :expiresAt"
		expressionAttributeValues[":expiresAt"] = &dynamodb.AttributeValue{S: aws.String(req.ExpiresAt.Format(time.RFC3339))}
		notification.ExpiresAt = req.ExpiresAt.Format(time.RFC3339)
	}

	// Perform the update
	updateInput := &dynamodb.UpdateItemInput{
		TableName:                 aws.String(notificationsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
		ReturnValues:              aws.String("ALL_NEW"),
	}

	if len(expressionAttributeNames) > 0 {
		updateInput.ExpressionAttributeNames = expressionAttributeNames
	}

	updateResult, err := h.db.UpdateItem(updateInput)
	if err != nil {
		log.Printf("ERROR: Failed to update notification: %v", err)
		return createErrorResponse(500, "Failed to update notification"), nil
	}

	// Unmarshal updated notification
	var updatedNotification Notification
	err = dynamodbattribute.UnmarshalMap(updateResult.Attributes, &updatedNotification)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal updated notification: %v", err)
		// Return the notification we built locally instead
		notification.UpdatedAt = time.Now().Format(time.RFC3339)
		updatedNotification = notification
	}

	// Return updated notification
	response := UpdateNotificationResponse{
		Success: true,
		Message: "Notification updated successfully",
		Data:    &updatedNotification,
	}

	return createSuccessResponse(200, response), nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
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
			"Access-Control-Allow-Methods": "PUT, PATCH, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := UpdateNotificationResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "PUT, PATCH, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewUpdateNotificationHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}