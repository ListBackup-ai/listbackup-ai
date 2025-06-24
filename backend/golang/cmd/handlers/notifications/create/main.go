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
	"github.com/aws/aws-sdk-go/service/sns"
	"github.com/google/uuid"
)

type CreateNotificationHandler struct {
	db  *dynamodb.DynamoDB
	sns *sns.SNS
}

type Notification struct {
	NotificationID string                 `json:"notificationId" dynamodbav:"notificationId"`
	AccountID      string                 `json:"accountId" dynamodbav:"accountId"`
	UserID         string                 `json:"userId" dynamodbav:"userId"`
	Type           string                 `json:"type" dynamodbav:"type"` // "info", "success", "warning", "error", "system"
	Category       string                 `json:"category" dynamodbav:"category"`
	Title          string                 `json:"title" dynamodbav:"title"`
	Message        string                 `json:"message" dynamodbav:"message"`
	Priority       string                 `json:"priority" dynamodbav:"priority"` // "low", "normal", "high", "urgent"
	Status         string                 `json:"status" dynamodbav:"status"`     // "unread", "read", "archived"
	Channels       []string               `json:"channels" dynamodbav:"channels"` // "app", "email", "sms", "slack", "webhook"
	EntityID       string                 `json:"entityId,omitempty" dynamodbav:"entityId,omitempty"`
	EntityType     string                 `json:"entityType,omitempty" dynamodbav:"entityType,omitempty"`
	ActionURL      string                 `json:"actionUrl,omitempty" dynamodbav:"actionUrl,omitempty"`
	ActionLabel    string                 `json:"actionLabel,omitempty" dynamodbav:"actionLabel,omitempty"`
	ImageURL       string                 `json:"imageUrl,omitempty" dynamodbav:"imageUrl,omitempty"`
	Data           map[string]interface{} `json:"data,omitempty" dynamodbav:"data,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	ScheduledFor   *time.Time             `json:"scheduledFor,omitempty" dynamodbav:"scheduledFor,omitempty"`
	ExpiresAt      *time.Time             `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"`
	ReadAt         *time.Time             `json:"readAt,omitempty" dynamodbav:"readAt,omitempty"`
	DeliveredAt    *time.Time             `json:"deliveredAt,omitempty" dynamodbav:"deliveredAt,omitempty"`
	FailureReason  string                 `json:"failureReason,omitempty" dynamodbav:"failureReason,omitempty"`
	CreatedAt      time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type CreateNotificationRequest struct {
	UserID        string                 `json:"userId,omitempty"`        // If empty, uses current user
	Type          string                 `json:"type"`                    // Required
	Category      string                 `json:"category"`                // Required
	Title         string                 `json:"title"`                   // Required
	Message       string                 `json:"message"`                 // Required
	Priority      string                 `json:"priority,omitempty"`      // Default: "normal"
	Channels      []string               `json:"channels,omitempty"`      // Default: ["app"]
	EntityID      string                 `json:"entityId,omitempty"`
	EntityType    string                 `json:"entityType,omitempty"`
	ActionURL     string                 `json:"actionUrl,omitempty"`
	ActionLabel   string                 `json:"actionLabel,omitempty"`
	ImageURL      string                 `json:"imageUrl,omitempty"`
	Data          map[string]interface{} `json:"data,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	ScheduledFor  *time.Time             `json:"scheduledFor,omitempty"`
	ExpiresAt     *time.Time             `json:"expiresAt,omitempty"`
	SendImmediately bool                 `json:"sendImmediately,omitempty"` // Send via channels immediately
}

type CreateNotificationResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message,omitempty"`
	Data    *Notification `json:"data,omitempty"`
	Error   string        `json:"error,omitempty"`
}

func NewCreateNotificationHandler() (*CreateNotificationHandler, error) {
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

	return &CreateNotificationHandler{
		db:  dynamodb.New(sess),
		sns: sns.New(sess),
	}, nil
}

func (h *CreateNotificationHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("CreateNotification request: %+v", event)

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
	var req CreateNotificationRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.Type == "" {
		return createErrorResponse(400, "Notification type is required"), nil
	}
	if req.Category == "" {
		return createErrorResponse(400, "Notification category is required"), nil
	}
	if req.Title == "" {
		return createErrorResponse(400, "Notification title is required"), nil
	}
	if req.Message == "" {
		return createErrorResponse(400, "Notification message is required"), nil
	}

	// Set defaults
	targetUserID := req.UserID
	if targetUserID == "" {
		targetUserID = userID
	}

	if req.Priority == "" {
		req.Priority = "normal"
	}

	if len(req.Channels) == 0 {
		req.Channels = []string{"app"}
	}

	// Validate values
	validTypes := []string{"info", "success", "warning", "error", "system"}
	if !contains(validTypes, req.Type) {
		return createErrorResponse(400, "Invalid notification type"), nil
	}

	validPriorities := []string{"low", "normal", "high", "urgent"}
	if !contains(validPriorities, req.Priority) {
		return createErrorResponse(400, "Invalid notification priority"), nil
	}

	validChannels := []string{"app", "email", "sms", "slack", "webhook"}
	for _, channel := range req.Channels {
		if !contains(validChannels, channel) {
			return createErrorResponse(400, "Invalid notification channel: "+channel), nil
		}
	}

	// Create notification
	notificationID := uuid.New().String()
	now := time.Now()

	notification := &Notification{
		NotificationID: notificationID,
		AccountID:      accountID,
		UserID:         targetUserID,
		Type:           req.Type,
		Category:       req.Category,
		Title:          req.Title,
		Message:        req.Message,
		Priority:       req.Priority,
		Status:         "unread",
		Channels:       req.Channels,
		EntityID:       req.EntityID,
		EntityType:     req.EntityType,
		ActionURL:      req.ActionURL,
		ActionLabel:    req.ActionLabel,
		ImageURL:       req.ImageURL,
		Data:           req.Data,
		Metadata:       req.Metadata,
		ScheduledFor:   req.ScheduledFor,
		ExpiresAt:      req.ExpiresAt,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	// Store in DynamoDB
	item, err := dynamodbattribute.MarshalMap(notification)
	if err != nil {
		log.Printf("ERROR: Failed to marshal notification: %v", err)
		return createErrorResponse(500, "Failed to create notification"), nil
	}

	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(notificationsTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("ERROR: Failed to store notification: %v", err)
		return createErrorResponse(500, "Failed to create notification"), nil
	}

	// Send immediately if requested
	if req.SendImmediately {
		go h.sendNotification(notification)
	}

	// Return success response
	response := CreateNotificationResponse{
		Success: true,
		Message: "Notification created successfully",
		Data:    notification,
	}

	return createSuccessResponse(201, response), nil
}

func (h *CreateNotificationHandler) sendNotification(notification *Notification) {
	// Send notification via all specified channels
	for _, channel := range notification.Channels {
		switch channel {
		case "app":
			// In-app notification is already stored in DB, mark as delivered
			h.markAsDelivered(notification.NotificationID, channel)
		case "email":
			h.sendEmailNotification(notification)
		case "sms":
			h.sendSMSNotification(notification)
		case "slack":
			h.sendSlackNotification(notification)
		case "webhook":
			h.sendWebhookNotification(notification)
		}
	}
}

func (h *CreateNotificationHandler) sendEmailNotification(notification *Notification) {
	// Implementation would use SES to send email
	log.Printf("Sending email notification: %s", notification.NotificationID)
	
	// For now, just mark as delivered
	h.markAsDelivered(notification.NotificationID, "email")
}

func (h *CreateNotificationHandler) sendSMSNotification(notification *Notification) {
	// Implementation would use SNS to send SMS
	log.Printf("Sending SMS notification: %s", notification.NotificationID)
	
	// For now, just mark as delivered
	h.markAsDelivered(notification.NotificationID, "sms")
}

func (h *CreateNotificationHandler) sendSlackNotification(notification *Notification) {
	// Implementation would use Slack webhook/API
	log.Printf("Sending Slack notification: %s", notification.NotificationID)
	
	// For now, just mark as delivered
	h.markAsDelivered(notification.NotificationID, "slack")
}

func (h *CreateNotificationHandler) sendWebhookNotification(notification *Notification) {
	// Implementation would make HTTP request to configured webhook
	log.Printf("Sending webhook notification: %s", notification.NotificationID)
	
	// For now, just mark as delivered
	h.markAsDelivered(notification.NotificationID, "webhook")
}

func (h *CreateNotificationHandler) markAsDelivered(notificationID, channel string) {
	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	now := time.Now()

	// Update delivery status
	_, err := h.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(notificationsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
		UpdateExpression: aws.String("SET deliveredAt = :deliveredAt, updatedAt = :updatedAt"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":deliveredAt": {S: aws.String(now.Format(time.RFC3339))},
			":updatedAt":   {S: aws.String(now.Format(time.RFC3339))},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to mark notification as delivered: %v", err)
	}

	log.Printf("Marked notification %s as delivered via %s", notificationID, channel)
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
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := CreateNotificationResponse{
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
	handler, err := NewCreateNotificationHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}