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

type MarkReadHandler struct {
	db *dynamodb.DynamoDB
}

type MarkReadRequest struct {
	NotificationID  string   `json:"notificationId,omitempty"`
	NotificationIDs []string `json:"notificationIds,omitempty"`
	MarkAll         bool     `json:"markAll,omitempty"`
	Action          string   `json:"action"` // "read", "unread", "archive", "delete"
}

type MarkReadResponse struct {
	Success     bool     `json:"success"`
	Message     string   `json:"message,omitempty"`
	Data        *Result  `json:"data,omitempty"`
	Error       string   `json:"error,omitempty"`
}

type Result struct {
	ProcessedCount int      `json:"processedCount"`
	FailedCount    int      `json:"failedCount"`
	FailedIDs      []string `json:"failedIds,omitempty"`
}

func NewMarkReadHandler() (*MarkReadHandler, error) {
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

	return &MarkReadHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *MarkReadHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("MarkRead request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "PUT, PATCH, POST, OPTIONS",
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
	var req MarkReadRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate action
	validActions := []string{"read", "unread", "archive", "delete"}
	if !contains(validActions, req.Action) {
		return createErrorResponse(400, "Invalid action. Must be one of: read, unread, archive, delete"), nil
	}

	// Get notifications table name
	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	var notificationIDs []string
	var processedCount, failedCount int
	var failedIDs []string

	// Determine which notifications to process
	if req.MarkAll {
		// Get all user's notifications
		var err error
		notificationIDs, err = h.getAllUserNotificationIDs(notificationsTable, userID, accountID)
		if err != nil {
			log.Printf("ERROR: Failed to get user notifications: %v", err)
			return createErrorResponse(500, "Failed to retrieve user notifications"), nil
		}
	} else if req.NotificationID != "" {
		notificationIDs = []string{req.NotificationID}
	} else if len(req.NotificationIDs) > 0 {
		notificationIDs = req.NotificationIDs
	} else {
		return createErrorResponse(400, "Must specify notificationId, notificationIds, or markAll"), nil
	}

	if len(notificationIDs) == 0 {
		return createSuccessResponse(200, MarkReadResponse{
			Success: true,
			Message: "No notifications to process",
			Data: &Result{
				ProcessedCount: 0,
				FailedCount:    0,
			},
		}), nil
	}

	// Process each notification
	now := time.Now().Format(time.RFC3339)

	for _, notificationID := range notificationIDs {
		err := h.processNotification(notificationsTable, notificationID, userID, accountID, req.Action, now)
		if err != nil {
			log.Printf("ERROR: Failed to process notification %s: %v", notificationID, err)
			failedCount++
			failedIDs = append(failedIDs, notificationID)
		} else {
			processedCount++
		}
	}

	// Create response
	message := ""
	switch req.Action {
	case "read":
		message = "Notifications marked as read"
	case "unread":
		message = "Notifications marked as unread"
	case "archive":
		message = "Notifications archived"
	case "delete":
		message = "Notifications deleted"
	}

	if failedCount > 0 {
		message += " (with some failures)"
	}

	response := MarkReadResponse{
		Success: true,
		Message: message,
		Data: &Result{
			ProcessedCount: processedCount,
			FailedCount:    failedCount,
			FailedIDs:      failedIDs,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *MarkReadHandler) getAllUserNotificationIDs(tableName, userID, accountID string) ([]string, error) {
	result, err := h.db.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("userId = :userId AND accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId":    {S: aws.String(userID)},
			":accountId": {S: aws.String(accountID)},
		},
		ProjectionExpression: aws.String("notificationId"),
	})
	if err != nil {
		return nil, err
	}

	var notificationIDs []string
	for _, item := range result.Items {
		if notificationID, exists := item["notificationId"]; exists && notificationID.S != nil {
			notificationIDs = append(notificationIDs, *notificationID.S)
		}
	}

	return notificationIDs, nil
}

func (h *MarkReadHandler) processNotification(tableName, notificationID, userID, accountID, action, timestamp string) error {
	// First, verify the notification belongs to the user
	getResult, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
		ProjectionExpression: aws.String("userId, accountId"),
	})
	if err != nil {
		return err
	}

	if getResult.Item == nil {
		return nil // Notification not found, skip silently
	}

	// Verify ownership
	var notification struct {
		UserID    string `dynamodbav:"userId"`
		AccountID string `dynamodbav:"accountId"`
	}
	err = dynamodbattribute.UnmarshalMap(getResult.Item, &notification)
	if err != nil {
		return err
	}

	if notification.UserID != userID && notification.AccountID != accountID {
		return nil // Not authorized, skip silently
	}

	// Perform the action
	switch action {
	case "read":
		return h.markAsRead(tableName, notificationID, timestamp)
	case "unread":
		return h.markAsUnread(tableName, notificationID, timestamp)
	case "archive":
		return h.archiveNotification(tableName, notificationID, timestamp)
	case "delete":
		return h.deleteNotification(tableName, notificationID)
	default:
		return nil
	}
}

func (h *MarkReadHandler) markAsRead(tableName, notificationID, timestamp string) error {
	_, err := h.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
		UpdateExpression: aws.String("SET readAt = :readAt, updatedAt = :updatedAt, #status = :status"),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":readAt":    {S: aws.String(timestamp)},
			":updatedAt": {S: aws.String(timestamp)},
			":status":    {S: aws.String("read")},
		},
	})
	return err
}

func (h *MarkReadHandler) markAsUnread(tableName, notificationID, timestamp string) error {
	_, err := h.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
		UpdateExpression: aws.String("REMOVE readAt SET updatedAt = :updatedAt, #status = :status"),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":updatedAt": {S: aws.String(timestamp)},
			":status":    {S: aws.String("unread")},
		},
	})
	return err
}

func (h *MarkReadHandler) archiveNotification(tableName, notificationID, timestamp string) error {
	_, err := h.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
		UpdateExpression: aws.String("SET archivedAt = :archivedAt, updatedAt = :updatedAt, #status = :status"),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":archivedAt": {S: aws.String(timestamp)},
			":updatedAt":  {S: aws.String(timestamp)},
			":status":     {S: aws.String("archived")},
		},
	})
	return err
}

func (h *MarkReadHandler) deleteNotification(tableName, notificationID string) error {
	_, err := h.db.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
	})
	return err
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
			"Access-Control-Allow-Methods": "PUT, PATCH, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := MarkReadResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "PUT, PATCH, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewMarkReadHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}