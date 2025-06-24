package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/aws/aws-sdk-go/service/sns"
	"github.com/google/uuid"
)

type NotificationService struct {
	db  *dynamodb.DynamoDB
	ses *ses.SES
	sns *sns.SNS
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
	ScheduledFor   *time.Time             `json:"scheduledFor,omitempty" dynamodbav:"scheduledFor,omitempty"`
	ExpiresAt      *time.Time             `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"`
	ReadAt         *time.Time             `json:"readAt,omitempty" dynamodbav:"readAt,omitempty"`
	DeliveredAt    *time.Time             `json:"deliveredAt,omitempty" dynamodbav:"deliveredAt,omitempty"`
	FailureReason  string                 `json:"failureReason,omitempty" dynamodbav:"failureReason,omitempty"`
	CreatedAt      time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type NotificationTemplate struct {
	TemplateID    string                 `json:"templateId" dynamodbav:"templateId"`
	AccountID     string                 `json:"accountId" dynamodbav:"accountId"`
	Name          string                 `json:"name" dynamodbav:"name"`
	Category      string                 `json:"category" dynamodbav:"category"`
	Type          string                 `json:"type" dynamodbav:"type"`
	Priority      string                 `json:"priority" dynamodbav:"priority"`
	Subject       string                 `json:"subject" dynamodbav:"subject"`
	EmailHTML     string                 `json:"emailHtml,omitempty" dynamodbav:"emailHtml,omitempty"`
	EmailText     string                 `json:"emailText,omitempty" dynamodbav:"emailText,omitempty"`
	SMSTemplate   string                 `json:"smsTemplate,omitempty" dynamodbav:"smsTemplate,omitempty"`
	AppTemplate   string                 `json:"appTemplate,omitempty" dynamodbav:"appTemplate,omitempty"`
	Variables     []TemplateVariable     `json:"variables" dynamodbav:"variables"`
	Channels      []string               `json:"channels" dynamodbav:"channels"`
	IsSystem      bool                   `json:"isSystem" dynamodbav:"isSystem"`
	IsActive      bool                   `json:"isActive" dynamodbav:"isActive"`
	Language      string                 `json:"language" dynamodbav:"language"`
}

type TemplateVariable struct {
	Name         string `json:"name" dynamodbav:"name"`
	Type         string `json:"type" dynamodbav:"type"`
	Description  string `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Required     bool   `json:"required" dynamodbav:"required"`
	DefaultValue string `json:"defaultValue,omitempty" dynamodbav:"defaultValue,omitempty"`
}

type NotificationPreferences struct {
	UserID                string                    `json:"userId" dynamodbav:"userId"`
	AccountID             string                    `json:"accountId" dynamodbav:"accountId"`
	EmailEnabled          bool                      `json:"emailEnabled" dynamodbav:"emailEnabled"`
	SMSEnabled            bool                      `json:"smsEnabled" dynamodbav:"smsEnabled"`
	AppEnabled            bool                      `json:"appEnabled" dynamodbav:"appEnabled"`
	EmailAddress          string                    `json:"emailAddress,omitempty" dynamodbav:"emailAddress,omitempty"`
	PhoneNumber           string                    `json:"phoneNumber,omitempty" dynamodbav:"phoneNumber,omitempty"`
	CategoryPreferences   map[string]CategoryPref   `json:"categoryPreferences" dynamodbav:"categoryPreferences"`
	PriorityPreferences   map[string]PriorityPref   `json:"priorityPreferences" dynamodbav:"priorityPreferences"`
	FrequencySettings     FrequencySettings         `json:"frequencySettings" dynamodbav:"frequencySettings"`
	QuietHours            QuietHours                `json:"quietHours" dynamodbav:"quietHours"`
	GlobalSettings        GlobalSettings            `json:"globalSettings" dynamodbav:"globalSettings"`
}

type CategoryPref struct {
	Enabled     bool     `json:"enabled" dynamodbav:"enabled"`
	Channels    []string `json:"channels" dynamodbav:"channels"`
	MinPriority string   `json:"minPriority" dynamodbav:"minPriority"`
}

type PriorityPref struct {
	Enabled   bool     `json:"enabled" dynamodbav:"enabled"`
	Channels  []string `json:"channels" dynamodbav:"channels"`
	Immediate bool     `json:"immediate" dynamodbav:"immediate"`
}

type FrequencySettings struct {
	Immediate   bool `json:"immediate" dynamodbav:"immediate"`
	Batched     bool `json:"batched" dynamodbav:"batched"`
	BatchWindow int  `json:"batchWindow" dynamodbav:"batchWindow"`
	MaxPerHour  int  `json:"maxPerHour" dynamodbav:"maxPerHour"`
	MaxPerDay   int  `json:"maxPerDay" dynamodbav:"maxPerDay"`
}

type QuietHours struct {
	Enabled   bool   `json:"enabled" dynamodbav:"enabled"`
	StartTime string `json:"startTime" dynamodbav:"startTime"`
	EndTime   string `json:"endTime" dynamodbav:"endTime"`
	Timezone  string `json:"timezone" dynamodbav:"timezone"`
	Weekends  bool   `json:"weekends" dynamodbav:"weekends"`
}

type GlobalSettings struct {
	DoNotDisturb      bool   `json:"doNotDisturb" dynamodbav:"doNotDisturb"`
	VacationMode      bool   `json:"vacationMode" dynamodbav:"vacationMode"`
	VacationStart     string `json:"vacationStart,omitempty" dynamodbav:"vacationStart,omitempty"`
	VacationEnd       string `json:"vacationEnd,omitempty" dynamodbav:"vacationEnd,omitempty"`
	AutoArchiveAfter  int    `json:"autoArchiveAfter" dynamodbav:"autoArchiveAfter"`
	AutoDeleteAfter   int    `json:"autoDeleteAfter" dynamodbav:"autoDeleteAfter"`
	LanguageCode      string `json:"languageCode" dynamodbav:"languageCode"`
	TimezoneOverride  string `json:"timezoneOverride,omitempty" dynamodbav:"timezoneOverride,omitempty"`
}

type CreateNotificationOptions struct {
	UserID         string                 `json:"userId"`
	AccountID      string                 `json:"accountId"`
	Type           string                 `json:"type"`
	Category       string                 `json:"category"`
	Title          string                 `json:"title"`
	Message        string                 `json:"message"`
	Priority       string                 `json:"priority,omitempty"`
	Channels       []string               `json:"channels,omitempty"`
	EntityID       string                 `json:"entityId,omitempty"`
	EntityType     string                 `json:"entityType,omitempty"`
	ActionURL      string                 `json:"actionUrl,omitempty"`
	ActionLabel    string                 `json:"actionLabel,omitempty"`
	ImageURL       string                 `json:"imageUrl,omitempty"`
	Data           map[string]interface{} `json:"data,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	ScheduledFor   *time.Time             `json:"scheduledFor,omitempty"`
	ExpiresAt      *time.Time             `json:"expiresAt,omitempty"`
	SendImmediately bool                  `json:"sendImmediately,omitempty"`
	TemplateID     string                 `json:"templateId,omitempty"`
	TemplateData   map[string]interface{} `json:"templateData,omitempty"`
}

type SendResult struct {
	Success     bool            `json:"success"`
	Channels    []ChannelResult `json:"channels"`
	Error       string          `json:"error,omitempty"`
	DeliveredAt *time.Time      `json:"deliveredAt,omitempty"`
}

type ChannelResult struct {
	Channel   string     `json:"channel"`
	Success   bool       `json:"success"`
	MessageID string     `json:"messageId,omitempty"`
	Error     string     `json:"error,omitempty"`
	SentAt    *time.Time `json:"sentAt,omitempty"`
}

func NewNotificationService() (*NotificationService, error) {
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

	return &NotificationService{
		db:  dynamodb.New(sess),
		ses: ses.New(sess),
		sns: sns.New(sess),
	}, nil
}

// CreateNotification creates a new notification
func (s *NotificationService) CreateNotification(opts CreateNotificationOptions) (*Notification, error) {
	// Set defaults
	if opts.Priority == "" {
		opts.Priority = "normal"
	}
	if len(opts.Channels) == 0 {
		opts.Channels = []string{"app"}
	}

	// Validate required fields
	if opts.UserID == "" {
		return nil, fmt.Errorf("UserID is required")
	}
	if opts.AccountID == "" {
		return nil, fmt.Errorf("AccountID is required")
	}
	if opts.Type == "" {
		return nil, fmt.Errorf("Type is required")
	}
	if opts.Category == "" {
		return nil, fmt.Errorf("Category is required")
	}
	if opts.Title == "" {
		return nil, fmt.Errorf("Title is required")
	}
	if opts.Message == "" {
		return nil, fmt.Errorf("Message is required")
	}

	// Create notification
	now := time.Now()
	notification := &Notification{
		NotificationID: uuid.New().String(),
		AccountID:      opts.AccountID,
		UserID:         opts.UserID,
		Type:           opts.Type,
		Category:       opts.Category,
		Title:          opts.Title,
		Message:        opts.Message,
		Priority:       opts.Priority,
		Status:         "unread",
		Channels:       opts.Channels,
		EntityID:       opts.EntityID,
		EntityType:     opts.EntityType,
		ActionURL:      opts.ActionURL,
		ActionLabel:    opts.ActionLabel,
		ImageURL:       opts.ImageURL,
		Data:           opts.Data,
		Metadata:       opts.Metadata,
		ScheduledFor:   opts.ScheduledFor,
		ExpiresAt:      opts.ExpiresAt,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	// If using a template, apply template data
	if opts.TemplateID != "" {
		err := s.applyTemplate(notification, opts.TemplateID, opts.TemplateData)
		if err != nil {
			log.Printf("WARNING: Failed to apply template %s: %v", opts.TemplateID, err)
		}
	}

	// Store in database
	err := s.saveNotification(notification)
	if err != nil {
		return nil, fmt.Errorf("failed to save notification: %v", err)
	}

	// Send immediately if requested
	if opts.SendImmediately {
		go func() {
			result := s.SendNotification(notification.NotificationID)
			if !result.Success {
				log.Printf("WARNING: Failed to send notification %s: %s", notification.NotificationID, result.Error)
			}
		}()
	}

	return notification, nil
}

// SendNotification sends a notification via configured channels
func (s *NotificationService) SendNotification(notificationID string) *SendResult {
	result := &SendResult{
		Channels: make([]ChannelResult, 0),
	}

	// Get notification
	notification, err := s.GetNotification(notificationID)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to get notification: %v", err)
		return result
	}

	if notification == nil {
		result.Error = "Notification not found"
		return result
	}

	// Get user preferences
	preferences, err := s.GetUserPreferences(notification.UserID)
	if err != nil {
		log.Printf("WARNING: Failed to get user preferences for %s: %v", notification.UserID, err)
		// Continue with default behavior
	}

	// Check if sending is allowed
	if preferences != nil && s.shouldSkipSending(preferences) {
		result.Error = "Sending skipped due to user preferences"
		return result
	}

	// Send via each channel
	for _, channel := range notification.Channels {
		channelResult := s.sendViaChannel(notification, channel, preferences)
		result.Channels = append(result.Channels, channelResult)
	}

	// Check if any channel succeeded
	for _, channelResult := range result.Channels {
		if channelResult.Success {
			result.Success = true
			now := time.Now()
			result.DeliveredAt = &now
			break
		}
	}

	// Update delivery status
	if result.Success {
		s.markAsDelivered(notificationID)
	}

	return result
}

// GetNotification retrieves a notification by ID
func (s *NotificationService) GetNotification(notificationID string) (*Notification, error) {
	tableName := s.getNotificationsTableName()

	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
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

// GetUserPreferences retrieves user notification preferences
func (s *NotificationService) GetUserPreferences(userID string) (*NotificationPreferences, error) {
	tableName := s.getPreferencesTableName()

	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
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

	var preferences NotificationPreferences
	err = dynamodbattribute.UnmarshalMap(result.Item, &preferences)
	if err != nil {
		return nil, err
	}

	return &preferences, nil
}

// GetTemplate retrieves a notification template by ID
func (s *NotificationService) GetTemplate(templateID string) (*NotificationTemplate, error) {
	tableName := s.getTemplatesTableName()

	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"templateId": {S: aws.String(templateID)},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var template NotificationTemplate
	err = dynamodbattribute.UnmarshalMap(result.Item, &template)
	if err != nil {
		return nil, err
	}

	return &template, nil
}

// Helper methods

func (s *NotificationService) saveNotification(notification *Notification) error {
	tableName := s.getNotificationsTableName()

	item, err := dynamodbattribute.MarshalMap(notification)
	if err != nil {
		return err
	}

	_, err = s.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	return err
}

func (s *NotificationService) applyTemplate(notification *Notification, templateID string, templateData map[string]interface{}) error {
	template, err := s.GetTemplate(templateID)
	if err != nil {
		return err
	}

	if template == nil {
		return fmt.Errorf("template %s not found", templateID)
	}

	if !template.IsActive {
		return fmt.Errorf("template %s is not active", templateID)
	}

	// Apply template values
	notification.Type = template.Type
	notification.Category = template.Category
	notification.Priority = template.Priority
	notification.Channels = template.Channels

	// Apply template with variable substitution
	notification.Title = s.substituteVariables(template.Subject, templateData)
	if template.AppTemplate != "" {
		notification.Message = s.substituteVariables(template.AppTemplate, templateData)
	}

	// Store template data for other channels
	if notification.Metadata == nil {
		notification.Metadata = make(map[string]interface{})
	}
	notification.Metadata["templateId"] = templateID
	notification.Metadata["templateData"] = templateData

	return nil
}

func (s *NotificationService) substituteVariables(template string, data map[string]interface{}) string {
	result := template
	for key, value := range data {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		result = strings.ReplaceAll(result, placeholder, replacement)
	}
	return result
}

func (s *NotificationService) shouldSkipSending(preferences *NotificationPreferences) bool {
	return preferences.GlobalSettings.DoNotDisturb || preferences.GlobalSettings.VacationMode
}

func (s *NotificationService) sendViaChannel(notification *Notification, channel string, preferences *NotificationPreferences) ChannelResult {
	result := ChannelResult{
		Channel: channel,
		SentAt:  &time.Time{},
	}
	*result.SentAt = time.Now()

	switch channel {
	case "app":
		// In-app notifications are already stored in database
		result.Success = true
		result.MessageID = notification.NotificationID
	case "email":
		if preferences != nil && !preferences.EmailEnabled {
			result.Error = "Email notifications disabled by user"
		} else {
			result = s.sendEmailNotification(notification, preferences)
		}
	case "sms":
		if preferences != nil && !preferences.SMSEnabled {
			result.Error = "SMS notifications disabled by user"
		} else {
			result = s.sendSMSNotification(notification, preferences)
		}
	default:
		result.Error = "Unsupported channel: " + channel
	}

	return result
}

func (s *NotificationService) sendEmailNotification(notification *Notification, preferences *NotificationPreferences) ChannelResult {
	result := ChannelResult{
		Channel: "email",
		SentAt:  &time.Time{},
	}
	*result.SentAt = time.Now()

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

	htmlBody := s.generateEmailHTML(notification)
	textBody := s.generateEmailText(notification)

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

	response, err := s.ses.SendEmail(input)
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

func (s *NotificationService) sendSMSNotification(notification *Notification, preferences *NotificationPreferences) ChannelResult {
	result := ChannelResult{
		Channel: "sms",
		SentAt:  &time.Time{},
	}
	*result.SentAt = time.Now()

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

	response, err := s.sns.Publish(input)
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

func (s *NotificationService) generateEmailHTML(notification *Notification) string {
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>%s</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">%s</h2>
        <p style="color: #666; line-height: 1.6;">%s</p>
        
        %s
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
            This notification was sent from ListBackup.ai<br>
            <a href="https://listbackup.ai/unsubscribe">Unsubscribe</a> | 
            <a href="https://listbackup.ai/notifications/preferences">Preferences</a>
        </p>
    </div>
</body>
</html>`, notification.Title, notification.Title, notification.Message, s.generateActionButton(notification))

	return html
}

func (s *NotificationService) generateEmailText(notification *Notification) string {
	text := notification.Title + "\n\n" + notification.Message + "\n\n"
	
	if notification.ActionURL != "" && notification.ActionLabel != "" {
		text += notification.ActionLabel + ": " + notification.ActionURL + "\n\n"
	}
	
	text += "---\nThis notification was sent from ListBackup.ai\n"
	text += "Unsubscribe: https://listbackup.ai/unsubscribe\n"
	text += "Preferences: https://listbackup.ai/notifications/preferences"
	
	return text
}

func (s *NotificationService) generateActionButton(notification *Notification) string {
	if notification.ActionURL == "" || notification.ActionLabel == "" {
		return ""
	}

	return fmt.Sprintf(`<a href="%s" style="display: inline-block; background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">%s</a>`, notification.ActionURL, notification.ActionLabel)
}

func (s *NotificationService) markAsDelivered(notificationID string) {
	tableName := s.getNotificationsTableName()
	now := time.Now()

	_, err := s.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
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
}

func (s *NotificationService) getNotificationsTableName() string {
	tableName := os.Getenv("NOTIFICATIONS_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-notifications"
	}
	return tableName
}

func (s *NotificationService) getPreferencesTableName() string {
	tableName := os.Getenv("NOTIFICATION_PREFERENCES_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-notification-preferences"
	}
	return tableName
}

func (s *NotificationService) getTemplatesTableName() string {
	tableName := os.Getenv("NOTIFICATION_TEMPLATES_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-notification-templates"
	}
	return tableName
}

// Convenience methods for common notification types

func (s *NotificationService) CreateBackupNotification(userID, accountID, sourceID, sourceName string, success bool, details string) (*Notification, error) {
	var notificationType, title, message string
	if success {
		notificationType = "success"
		title = fmt.Sprintf("Backup Completed: %s", sourceName)
		message = fmt.Sprintf("Backup completed successfully for %s. %s", sourceName, details)
	} else {
		notificationType = "error"
		title = fmt.Sprintf("Backup Failed: %s", sourceName)
		message = fmt.Sprintf("Backup failed for %s. %s", sourceName, details)
	}

	return s.CreateNotification(CreateNotificationOptions{
		UserID:         userID,
		AccountID:      accountID,
		Type:           notificationType,
		Category:       "backup",
		Title:          title,
		Message:        message,
		Priority:       "normal",
		Channels:       []string{"app", "email"},
		EntityID:       sourceID,
		EntityType:     "source",
		ActionURL:      fmt.Sprintf("/dashboard/sources/%s", sourceID),
		ActionLabel:    "View Source",
		SendImmediately: true,
	})
}

func (s *NotificationService) CreateSecurityNotification(userID, accountID, title, message string) (*Notification, error) {
	return s.CreateNotification(CreateNotificationOptions{
		UserID:         userID,
		AccountID:      accountID,
		Type:           "warning",
		Category:       "security",
		Title:          title,
		Message:        message,
		Priority:       "high",
		Channels:       []string{"app", "email", "sms"},
		SendImmediately: true,
	})
}

func (s *NotificationService) CreateSystemNotification(userID, accountID, title, message string) (*Notification, error) {
	return s.CreateNotification(CreateNotificationOptions{
		UserID:         userID,
		AccountID:      accountID,
		Type:           "info",
		Category:       "system",
		Title:          title,
		Message:        message,
		Priority:       "normal",
		Channels:       []string{"app"},
		SendImmediately: false,
	})
}