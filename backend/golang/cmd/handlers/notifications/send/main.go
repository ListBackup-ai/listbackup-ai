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
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/aws/aws-sdk-go/service/sns"
)

type NotificationSendHandler struct {
	db  *dynamodb.DynamoDB
	ses *ses.SES
	sns *sns.SNS
}

type SendNotificationRequest struct {
	NotificationID  string                 `json:"notificationId,omitempty"`
	NotificationIDs []string               `json:"notificationIds,omitempty"`
	Channels        []string               `json:"channels,omitempty"`        // Override default channels
	Template        string                 `json:"template,omitempty"`        // Use specific template
	TemplateData    map[string]interface{} `json:"templateData,omitempty"`    // Data for template rendering
	Priority        string                 `json:"priority,omitempty"`        // Override priority
	ScheduleFor     *time.Time             `json:"scheduleFor,omitempty"`     // Schedule for later
	ForceImmediate  bool                   `json:"forceImmediate,omitempty"`  // Bypass user preferences
}

type SendNotificationResponse struct {
	Success     bool           `json:"success"`
	Message     string         `json:"message,omitempty"`
	Data        *SendResult    `json:"data,omitempty"`
	Error       string         `json:"error,omitempty"`
}

type SendResult struct {
	ProcessedCount int                    `json:"processedCount"`
	SuccessCount   int                    `json:"successCount"`
	FailedCount    int                    `json:"failedCount"`
	Results        []NotificationResult   `json:"results"`
}

type NotificationResult struct {
	NotificationID string         `json:"notificationId"`
	Success        bool           `json:"success"`
	Channels       []ChannelResult `json:"channels"`
	Error          string         `json:"error,omitempty"`
}

type ChannelResult struct {
	Channel   string    `json:"channel"`
	Success   bool      `json:"success"`
	MessageID string    `json:"messageId,omitempty"`
	Error     string    `json:"error,omitempty"`
	SentAt    time.Time `json:"sentAt,omitempty"`
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
}

type UserPreferences struct {
	UserID         string                    `json:"userId" dynamodbav:"userId"`
	EmailEnabled   bool                      `json:"emailEnabled" dynamodbav:"emailEnabled"`
	SMSEnabled     bool                      `json:"smsEnabled" dynamodbav:"smsEnabled"`
	EmailAddress   string                    `json:"emailAddress,omitempty" dynamodbav:"emailAddress,omitempty"`
	PhoneNumber    string                    `json:"phoneNumber,omitempty" dynamodbav:"phoneNumber,omitempty"`
	QuietHours     QuietHours                `json:"quietHours" dynamodbav:"quietHours"`
	GlobalSettings GlobalSettings            `json:"globalSettings" dynamodbav:"globalSettings"`
}

type QuietHours struct {
	Enabled   bool   `json:"enabled" dynamodbav:"enabled"`
	StartTime string `json:"startTime" dynamodbav:"startTime"`
	EndTime   string `json:"endTime" dynamodbav:"endTime"`
	Timezone  string `json:"timezone" dynamodbav:"timezone"`
}

type GlobalSettings struct {
	DoNotDisturb bool `json:"doNotDisturb" dynamodbav:"doNotDisturb"`
	VacationMode bool `json:"vacationMode" dynamodbav:"vacationMode"`
}

func NewNotificationSendHandler() (*NotificationSendHandler, error) {
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

	return &NotificationSendHandler{
		db:  dynamodb.New(sess),
		ses: ses.New(sess),
		sns: sns.New(sess),
	}, nil
}

func (h *NotificationSendHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("SendNotification request: %+v", event)

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
	var req SendNotificationRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate request
	var notificationIDs []string
	if req.NotificationID != "" {
		notificationIDs = []string{req.NotificationID}
	} else if len(req.NotificationIDs) > 0 {
		notificationIDs = req.NotificationIDs
	} else {
		return createErrorResponse(400, "Must specify notificationId or notificationIds"), nil
	}

	if len(notificationIDs) == 0 {
		return createErrorResponse(400, "No notifications to send"), nil
	}

	// Process notifications
	result := &SendResult{
		ProcessedCount: len(notificationIDs),
		Results:        make([]NotificationResult, 0, len(notificationIDs)),
	}

	for _, notificationID := range notificationIDs {
		notificationResult := h.sendNotification(notificationID, userID, accountID, req)
		result.Results = append(result.Results, notificationResult)
		
		if notificationResult.Success {
			result.SuccessCount++
		} else {
			result.FailedCount++
		}
	}

	response := SendNotificationResponse{
		Success: true,
		Message: "Notification send requests processed",
		Data:    result,
	}

	return createSuccessResponse(200, response), nil
}

func (h *NotificationSendHandler) sendNotification(notificationID, userID, accountID string, req SendNotificationRequest) NotificationResult {
	result := NotificationResult{
		NotificationID: notificationID,
		Channels:       make([]ChannelResult, 0),
	}

	// Get notification from database
	notification, err := h.getNotification(notificationID)
	if err != nil {
		result.Error = "Failed to retrieve notification: " + err.Error()
		return result
	}

	if notification == nil {
		result.Error = "Notification not found"
		return result
	}

	// Verify ownership
	if notification.UserID != userID && notification.AccountID != accountID {
		result.Error = "Access denied"
		return result
	}

	// Get user preferences
	preferences, err := h.getUserPreferences(notification.UserID)
	if err != nil {
		log.Printf("WARNING: Failed to get user preferences for %s: %v", notification.UserID, err)
		// Continue with default preferences
	}

	// Check if sending is allowed
	if !req.ForceImmediate && preferences != nil {
		if preferences.GlobalSettings.DoNotDisturb || preferences.GlobalSettings.VacationMode {
			result.Error = "User has notifications disabled"
			return result
		}

		if h.isQuietHours(preferences.QuietHours) {
			result.Error = "User is in quiet hours"
			return result
		}
	}

	// Determine channels to use
	channels := req.Channels
	if len(channels) == 0 {
		channels = notification.Channels
	}

	// Send via each channel
	for _, channel := range channels {
		channelResult := h.sendViaChannel(notification, channel, preferences, req)
		result.Channels = append(result.Channels, channelResult)
	}

	// Check if any channel succeeded
	for _, channelResult := range result.Channels {
		if channelResult.Success {
			result.Success = true
			break
		}
	}

	// Update notification delivery status
	if result.Success {
		h.markAsDelivered(notificationID)
	}

	return result
}

func (h *NotificationSendHandler) sendViaChannel(notification *Notification, channel string, preferences *UserPreferences, req SendNotificationRequest) ChannelResult {
	result := ChannelResult{
		Channel: channel,
		SentAt:  time.Now(),
	}

	switch channel {
	case "app":
		// In-app notifications are already stored in database
		result.Success = true
		result.MessageID = notification.NotificationID
	case "email":
		if preferences != nil && !preferences.EmailEnabled {
			result.Error = "Email notifications disabled by user"
		} else {
			result = h.sendEmailNotification(notification, preferences, req)
		}
	case "sms":
		if preferences != nil && !preferences.SMSEnabled {
			result.Error = "SMS notifications disabled by user"
		} else {
			result = h.sendSMSNotification(notification, preferences, req)
		}
	case "slack":
		result = h.sendSlackNotification(notification, req)
	case "webhook":
		result = h.sendWebhookNotification(notification, req)
	default:
		result.Error = "Unsupported channel: " + channel
	}

	return result
}

func (h *NotificationSendHandler) sendEmailNotification(notification *Notification, preferences *UserPreferences, req SendNotificationRequest) ChannelResult {
	result := ChannelResult{
		Channel: "email",
		SentAt:  time.Now(),
	}

	emailAddress := ""
	if preferences != nil && preferences.EmailAddress != "" {
		emailAddress = preferences.EmailAddress
	}

	if emailAddress == "" {
		result.Error = "No email address configured"
		return result
	}

	// Create email content
	subject := notification.Title
	if notification.Priority == "urgent" {
		subject = "[URGENT] " + subject
	} else if notification.Priority == "high" {
		subject = "[HIGH] " + subject
	}

	htmlBody := h.generateEmailHTML(notification, req)
	textBody := h.generateEmailText(notification, req)

	// Send email via SES
	input := &ses.SendEmailInput{
		Destination: &ses.Destination{
			ToAddresses: []*string{aws.String(emailAddress)},
		},
		Message: &ses.Message{
			Subject: &ses.Content{
				Data: aws.String(subject),
			},
			Body: &ses.Body{
				Html: &ses.Content{
					Data: aws.String(htmlBody),
				},
				Text: &ses.Content{
					Data: aws.String(textBody),
				},
			},
		},
		Source: aws.String("notifications@listbackup.ai"),
	}

	response, err := h.ses.SendEmail(input)
	if err != nil {
		result.Error = "Failed to send email: " + err.Error()
		log.Printf("ERROR: Failed to send email notification: %v", err)
		return result
	}

	result.Success = true
	result.MessageID = *response.MessageId
	log.Printf("Email notification sent: %s", result.MessageID)

	return result
}

func (h *NotificationSendHandler) sendSMSNotification(notification *Notification, preferences *UserPreferences, req SendNotificationRequest) ChannelResult {
	result := ChannelResult{
		Channel: "sms",
		SentAt:  time.Now(),
	}

	phoneNumber := ""
	if preferences != nil && preferences.PhoneNumber != "" {
		phoneNumber = preferences.PhoneNumber
	}

	if phoneNumber == "" {
		result.Error = "No phone number configured"
		return result
	}

	// Create SMS message
	message := notification.Title + ": " + notification.Message
	if len(message) > 160 {
		message = notification.Title + ": " + notification.Message[:150] + "..."
	}

	// Send SMS via SNS
	input := &sns.PublishInput{
		PhoneNumber: aws.String(phoneNumber),
		Message:     aws.String(message),
	}

	response, err := h.sns.Publish(input)
	if err != nil {
		result.Error = "Failed to send SMS: " + err.Error()
		log.Printf("ERROR: Failed to send SMS notification: %v", err)
		return result
	}

	result.Success = true
	result.MessageID = *response.MessageId
	log.Printf("SMS notification sent: %s", result.MessageID)

	return result
}

func (h *NotificationSendHandler) sendSlackNotification(notification *Notification, req SendNotificationRequest) ChannelResult {
	result := ChannelResult{
		Channel: "slack",
		SentAt:  time.Now(),
	}

	// Placeholder for Slack integration
	log.Printf("Slack notification: %s", notification.NotificationID)
	result.Success = true
	result.MessageID = "slack-" + notification.NotificationID

	return result
}

func (h *NotificationSendHandler) sendWebhookNotification(notification *Notification, req SendNotificationRequest) ChannelResult {
	result := ChannelResult{
		Channel: "webhook",
		SentAt:  time.Now(),
	}

	// Placeholder for webhook integration
	log.Printf("Webhook notification: %s", notification.NotificationID)
	result.Success = true
	result.MessageID = "webhook-" + notification.NotificationID

	return result
}

func (h *NotificationSendHandler) generateEmailHTML(notification *Notification, req SendNotificationRequest) string {
	// Basic HTML template
	html := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>` + notification.Title + `</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">` + notification.Title + `</h2>
        <p style="color: #666; line-height: 1.6;">` + notification.Message + `</p>
        
        ` + h.generateActionButton(notification) + `
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
            This notification was sent from ListBackup.ai<br>
            <a href="https://listbackup.ai/unsubscribe">Unsubscribe</a> | 
            <a href="https://listbackup.ai/notifications/preferences">Preferences</a>
        </p>
    </div>
</body>
</html>`

	return html
}

func (h *NotificationSendHandler) generateEmailText(notification *Notification, req SendNotificationRequest) string {
	text := notification.Title + "\n\n" + notification.Message + "\n\n"
	
	if notification.ActionURL != "" && notification.ActionLabel != "" {
		text += notification.ActionLabel + ": " + notification.ActionURL + "\n\n"
	}
	
	text += "---\nThis notification was sent from ListBackup.ai\n"
	text += "Unsubscribe: https://listbackup.ai/unsubscribe\n"
	text += "Preferences: https://listbackup.ai/notifications/preferences"
	
	return text
}

func (h *NotificationSendHandler) generateActionButton(notification *Notification) string {
	if notification.ActionURL == "" || notification.ActionLabel == "" {
		return ""
	}

	return `<a href="` + notification.ActionURL + `" style="display: inline-block; background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">` + notification.ActionLabel + `</a>`
}

func (h *NotificationSendHandler) getNotification(notificationID string) (*Notification, error) {
	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(notificationsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var notification Notification
	err = dynamodbattribute.UnmarshalMap(result.Item, &notification)
	if err != nil {
		return nil, err
	}

	return &notification, nil
}

func (h *NotificationSendHandler) getUserPreferences(userID string) (*UserPreferences, error) {
	preferencesTable := os.Getenv("NOTIFICATION_PREFERENCES_TABLE")
	if preferencesTable == "" {
		preferencesTable = "listbackup-main-notification-preferences"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(preferencesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {S: aws.String(userID)},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var preferences UserPreferences
	err = dynamodbattribute.UnmarshalMap(result.Item, &preferences)
	if err != nil {
		return nil, err
	}

	return &preferences, nil
}

func (h *NotificationSendHandler) isQuietHours(quietHours QuietHours) bool {
	if !quietHours.Enabled {
		return false
	}

	// For now, just return false. In production, you'd implement timezone-aware time checking
	return false
}

func (h *NotificationSendHandler) markAsDelivered(notificationID string) {
	notificationsTable := os.Getenv("NOTIFICATIONS_TABLE")
	if notificationsTable == "" {
		notificationsTable = "listbackup-main-notifications"
	}

	now := time.Now().Format(time.RFC3339)

	_, err := h.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(notificationsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"notificationId": {S: aws.String(notificationID)},
		},
		UpdateExpression: aws.String("SET deliveredAt = :deliveredAt, updatedAt = :updatedAt"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":deliveredAt": {S: aws.String(now)},
			":updatedAt":   {S: aws.String(now)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to mark notification as delivered: %v", err)
	}
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
	response := SendNotificationResponse{
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
	handler, err := NewNotificationSendHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}