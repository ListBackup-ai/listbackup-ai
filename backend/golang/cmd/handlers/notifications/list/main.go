package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type ListNotificationsHandler struct {
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
}

type ListNotificationsResponse struct {
	Success      bool           `json:"success"`
	Message      string         `json:"message,omitempty"`
	Data         []Notification `json:"data,omitempty"`
	Error        string         `json:"error,omitempty"`
	Pagination   *Pagination    `json:"pagination,omitempty"`
	UnreadCount  int            `json:"unreadCount,omitempty"`
	TotalCount   int            `json:"totalCount,omitempty"`
}

type Pagination struct {
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	Total      int    `json:"total"`
	HasMore    bool   `json:"hasMore"`
	NextCursor string `json:"nextCursor,omitempty"`
}

func NewListNotificationsHandler() (*ListNotificationsHandler, error) {
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

	return &ListNotificationsHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *ListNotificationsHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("ListNotifications request: %+v", event)

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
	status := event.QueryStringParameters["status"]        // "read", "unread", "all"
	category := event.QueryStringParameters["category"]    // filter by category
	priority := event.QueryStringParameters["priority"]    // filter by priority
	notificationType := event.QueryStringParameters["type"] // filter by type
	
	// Pagination parameters
	page := 1
	limit := 20
	cursor := event.QueryStringParameters["cursor"]
	
	if pageStr := event.QueryStringParameters["page"]; pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	
	if limitStr := event.QueryStringParameters["limit"]; limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Get notifications table name
	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	// Build query
	var queryInput *dynamodb.QueryInput
	var scanInput *dynamodb.ScanInput

	// Use GSI to query by userId and accountId
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":userId":    {S: aws.String(userID)},
		":accountId": {S: aws.String(accountID)},
	}
	
	filterExpression := ""
	keyConditionExpression := "userId = :userId AND accountId = :accountId"

	// Add filters
	if status != "" && status != "all" {
		if status == "unread" {
			filterExpression = "attribute_not_exists(readAt) OR readAt = :emptyString"
			expressionAttributeValues[":emptyString"] = &dynamodb.AttributeValue{S: aws.String("")}
		} else if status == "read" {
			filterExpression = "attribute_exists(readAt) AND readAt <> :emptyString"
			expressionAttributeValues[":emptyString"] = &dynamodb.AttributeValue{S: aws.String("")}
		}
	}

	if category != "" {
		if filterExpression != "" {
			filterExpression += " AND "
		}
		filterExpression += "category = :category"
		expressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(category)}
	}

	if priority != "" {
		if filterExpression != "" {
			filterExpression += " AND "
		}
		filterExpression += "priority = :priority"
		expressionAttributeValues[":priority"] = &dynamodb.AttributeValue{S: aws.String(priority)}
	}

	if notificationType != "" {
		if filterExpression != "" {
			filterExpression += " AND "
		}
		filterExpression += "#type = :type"
		expressionAttributeValues[":type"] = &dynamodb.AttributeValue{S: aws.String(notificationType)}
	}

	// For now, use scan (in production, you'd want to use GSI for better performance)
	scanInput = &dynamodb.ScanInput{
		TableName:                 aws.String(notificationsTable),
		FilterExpression:          buildFilterExpression(userID, accountID, status, category, priority, notificationType),
		ExpressionAttributeValues: expressionAttributeValues,
		Limit:                     aws.Int64(int64(limit)),
		ScanIndexForward:          aws.Bool(false), // Most recent first
	}

	if notificationType != "" {
		scanInput.ExpressionAttributeNames = map[string]*string{
			"#type": aws.String("type"),
		}
	}

	if cursor != "" {
		// Implement cursor-based pagination
		scanInput.ExclusiveStartKey = map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(cursor)},
		}
	}

	result, err := h.db.Scan(scanInput)
	if err != nil {
		log.Printf("ERROR: Failed to scan notifications: %v", err)
		return createErrorResponse(500, "Failed to retrieve notifications"), nil
	}

	// Unmarshal notifications
	var notifications []Notification
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &notifications)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal notifications: %v", err)
		return createErrorResponse(500, "Failed to process notifications"), nil
	}

	// Count unread notifications
	unreadCount := 0
	for _, notification := range notifications {
		if notification.ReadAt == "" {
			unreadCount++
		}
	}

	// Create pagination info
	pagination := &Pagination{
		Page:    page,
		Limit:   limit,
		Total:   len(notifications),
		HasMore: result.LastEvaluatedKey != nil,
	}

	if result.LastEvaluatedKey != nil {
		if notificationID, exists := result.LastEvaluatedKey["notificationId"]; exists && notificationID.S != nil {
			pagination.NextCursor = *notificationID.S
		}
	}

	// Return response
	response := ListNotificationsResponse{
		Success:     true,
		Message:     "Notifications retrieved successfully",
		Data:        notifications,
		Pagination:  pagination,
		UnreadCount: unreadCount,
		TotalCount:  len(notifications),
	}

	return createSuccessResponse(200, response), nil
}

func buildFilterExpression(userID, accountID, status, category, priority, notificationType string) *string {
	expression := "userId = :userId AND accountId = :accountId"

	if status == "unread" {
		expression += " AND (attribute_not_exists(readAt) OR readAt = :emptyString)"
	} else if status == "read" {
		expression += " AND (attribute_exists(readAt) AND readAt <> :emptyString)"
	}

	if category != "" {
		expression += " AND category = :category"
	}

	if priority != "" {
		expression += " AND priority = :priority"
	}

	if notificationType != "" {
		expression += " AND #type = :type"
	}

	return aws.String(expression)
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
	response := ListNotificationsResponse{
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
	handler, err := NewListNotificationsHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}