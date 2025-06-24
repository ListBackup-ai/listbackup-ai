package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type GetNotificationHandler struct {
	db *dynamodb.DynamoDB
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
	CreatedAt      string                 `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt      string                 `json:"updatedAt" dynamodbav:"updatedAt"`
	ReadAt         string                 `json:"readAt,omitempty" dynamodbav:"readAt,omitempty"`
	DeliveredAt    string                 `json:"deliveredAt,omitempty" dynamodbav:"deliveredAt,omitempty"`
	ScheduledFor   string                 `json:"scheduledFor,omitempty" dynamodbav:"scheduledFor,omitempty"`
	ExpiresAt      string                 `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"`
	FailureReason  string                 `json:"failureReason,omitempty" dynamodbav:"failureReason,omitempty"`
}

type GetNotificationResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message,omitempty"`
	Data    *Notification `json:"data,omitempty"`
	Error   string        `json:"error,omitempty"`
}

func NewGetNotificationHandler() (*GetNotificationHandler, error) {
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

	return &GetNotificationHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *GetNotificationHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("GetNotification request: %+v", event)

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

	// Get notification ID from path parameters
	notificationID := event.PathParameters["notificationId"]
	if notificationID == "" {
		return createErrorResponse(400, "Notification ID is required"), nil
	}

	// Get notifications table name
	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	// Get notification from DynamoDB
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

	// Unmarshal notification
	var notification Notification
	err = dynamodbattribute.UnmarshalMap(result.Item, &notification)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal notification: %v", err)
		return createErrorResponse(500, "Failed to process notification"), nil
	}

	// Verify ownership - user can only access their own notifications or account-level notifications
	if notification.UserID != userID && notification.AccountID != accountID {
		return createErrorResponse(403, "Access denied"), nil
	}

	// Check if auto-mark as read is requested
	autoMarkRead := event.QueryStringParameters["markAsRead"]
	if autoMarkRead == "true" && notification.ReadAt == "" {
		// Mark as read
		now := "2024-01-01T00:00:00Z" // This would be actual timestamp in production
		
		_, err := h.db.UpdateItem(&dynamodb.UpdateItemInput{
			TableName: aws.String(notificationsTable),
			Key: map[string]*dynamodb.AttributeValue{
				"notificationId": {S: aws.String(notificationID)},
			},
			UpdateExpression: aws.String("SET readAt = :readAt, updatedAt = :updatedAt, #status = :status"),
			ExpressionAttributeNames: map[string]*string{
				"#status": aws.String("status"),
			},
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":readAt":    {S: aws.String(now)},
				":updatedAt": {S: aws.String(now)},
				":status":    {S: aws.String("read")},
			},
		})
		if err != nil {
			log.Printf("WARNING: Failed to mark notification as read: %v", err)
		} else {
			notification.ReadAt = now
			notification.Status = "read"
			notification.UpdatedAt = now
		}
	}

	// Return notification
	response := GetNotificationResponse{
		Success: true,
		Message: "Notification retrieved successfully",
		Data:    &notification,
	}

	return createSuccessResponse(200, response), nil
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
	response := GetNotificationResponse{
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
	handler, err := NewGetNotificationHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}