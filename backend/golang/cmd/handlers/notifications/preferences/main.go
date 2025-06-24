package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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

type NotificationPreferencesHandler struct {
	db *dynamodb.DynamoDB
}

type NotificationPreferences struct {
	UserID                string                    `json:"userId" dynamodbav:"userId"`
	AccountID             string                    `json:"accountId" dynamodbav:"accountId"`
	EmailEnabled          bool                      `json:"emailEnabled" dynamodbav:"emailEnabled"`
	SMSEnabled            bool                      `json:"smsEnabled" dynamodbav:"smsEnabled"`
	AppEnabled            bool                      `json:"appEnabled" dynamodbav:"appEnabled"`
	SlackEnabled          bool                      `json:"slackEnabled" dynamodbav:"slackEnabled"`
	WebhookEnabled        bool                      `json:"webhookEnabled" dynamodbav:"webhookEnabled"`
	EmailAddress          string                    `json:"emailAddress,omitempty" dynamodbav:"emailAddress,omitempty"`
	PhoneNumber           string                    `json:"phoneNumber,omitempty" dynamodbav:"phoneNumber,omitempty"`
	SlackWebhookURL       string                    `json:"slackWebhookUrl,omitempty" dynamodbav:"slackWebhookUrl,omitempty"`
	WebhookURL            string                    `json:"webhookUrl,omitempty" dynamodbav:"webhookUrl,omitempty"`
	CategoryPreferences   map[string]CategoryPref   `json:"categoryPreferences" dynamodbav:"categoryPreferences"`
	PriorityPreferences   map[string]PriorityPref   `json:"priorityPreferences" dynamodbav:"priorityPreferences"`
	FrequencySettings     FrequencySettings         `json:"frequencySettings" dynamodbav:"frequencySettings"`
	QuietHours            QuietHours                `json:"quietHours" dynamodbav:"quietHours"`
	DigestSettings        DigestSettings            `json:"digestSettings" dynamodbav:"digestSettings"`
	GlobalSettings        GlobalSettings            `json:"globalSettings" dynamodbav:"globalSettings"`
	CreatedAt             time.Time                 `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt             time.Time                 `json:"updatedAt" dynamodbav:"updatedAt"`
}

type CategoryPref struct {
	Enabled  bool     `json:"enabled" dynamodbav:"enabled"`
	Channels []string `json:"channels" dynamodbav:"channels"`
	MinPriority string `json:"minPriority" dynamodbav:"minPriority"` // low, normal, high, urgent
}

type PriorityPref struct {
	Enabled  bool     `json:"enabled" dynamodbav:"enabled"`
	Channels []string `json:"channels" dynamodbav:"channels"`
	Immediate bool    `json:"immediate" dynamodbav:"immediate"` // Send immediately regardless of frequency settings
}

type FrequencySettings struct {
	Immediate   bool   `json:"immediate" dynamodbav:"immediate"`     // Send notifications immediately
	Batched     bool   `json:"batched" dynamodbav:"batched"`         // Batch notifications
	BatchWindow int    `json:"batchWindow" dynamodbav:"batchWindow"` // Minutes between batches (5, 15, 30, 60)
	MaxPerHour  int    `json:"maxPerHour" dynamodbav:"maxPerHour"`   // Maximum notifications per hour
	MaxPerDay   int    `json:"maxPerDay" dynamodbav:"maxPerDay"`     // Maximum notifications per day
}

type QuietHours struct {
	Enabled   bool   `json:"enabled" dynamodbav:"enabled"`
	StartTime string `json:"startTime" dynamodbav:"startTime"` // HH:MM format
	EndTime   string `json:"endTime" dynamodbav:"endTime"`     // HH:MM format
	Timezone  string `json:"timezone" dynamodbav:"timezone"`   // IANA timezone
	Weekends  bool   `json:"weekends" dynamodbav:"weekends"`   // Apply to weekends
}

type DigestSettings struct {
	DailyEnabled    bool   `json:"dailyEnabled" dynamodbav:"dailyEnabled"`
	WeeklyEnabled   bool   `json:"weeklyEnabled" dynamodbav:"weeklyEnabled"`
	DailyTime       string `json:"dailyTime" dynamodbav:"dailyTime"`       // HH:MM format
	WeeklyDay       int    `json:"weeklyDay" dynamodbav:"weeklyDay"`       // 0=Sunday, 1=Monday, etc.
	WeeklyTime      string `json:"weeklyTime" dynamodbav:"weeklyTime"`     // HH:MM format
	IncludeArchived bool   `json:"includeArchived" dynamodbav:"includeArchived"`
	MinPriority     string `json:"minPriority" dynamodbav:"minPriority"`
}

type GlobalSettings struct {
	DoNotDisturb      bool   `json:"doNotDisturb" dynamodbav:"doNotDisturb"`
	VacationMode      bool   `json:"vacationMode" dynamodbav:"vacationMode"`
	VacationStart     string `json:"vacationStart,omitempty" dynamodbav:"vacationStart,omitempty"`
	VacationEnd       string `json:"vacationEnd,omitempty" dynamodbav:"vacationEnd,omitempty"`
	AutoArchiveAfter  int    `json:"autoArchiveAfter" dynamodbav:"autoArchiveAfter"`   // Days
	AutoDeleteAfter   int    `json:"autoDeleteAfter" dynamodbav:"autoDeleteAfter"`     // Days
	LanguageCode      string `json:"languageCode" dynamodbav:"languageCode"`           // en, es, fr, etc.
	TimezoneOverride  string `json:"timezoneOverride,omitempty" dynamodbav:"timezoneOverride,omitempty"`
}

type PreferencesResponse struct {
	Success bool                     `json:"success"`
	Message string                   `json:"message,omitempty"`
	Data    *NotificationPreferences `json:"data,omitempty"`
	Error   string                   `json:"error,omitempty"`
}

func NewNotificationPreferencesHandler() (*NotificationPreferencesHandler, error) {
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

	return &NotificationPreferencesHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *NotificationPreferencesHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("NotificationPreferences request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
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

	switch event.HTTPMethod {
	case "GET":
		return h.getPreferences(userID, accountID)
	case "PUT", "POST":
		return h.updatePreferences(userID, accountID, event.Body)
	default:
		return createErrorResponse(405, "Method not allowed"), nil
	}
}

func (h *NotificationPreferencesHandler) getPreferences(userID, accountID string) (events.APIGatewayProxyResponse, error) {
	preferencesTable := os.Getenv("NOTIFICATION_PREFERENCES_TABLE")
	if preferencesTable == "" {
		preferencesTable = "listbackup-main-notification-preferences"
	}

	// Get user preferences
	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(preferencesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {S: aws.String(userID)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to get preferences: %v", err)
		return createErrorResponse(500, "Failed to retrieve preferences"), nil
	}

	var preferences *NotificationPreferences

	if result.Item == nil {
		// Create default preferences
		preferences = h.createDefaultPreferences(userID, accountID)
		
		// Save default preferences
		item, err := dynamodbattribute.MarshalMap(preferences)
		if err != nil {
			log.Printf("ERROR: Failed to marshal default preferences: %v", err)
			return createErrorResponse(500, "Failed to create default preferences"), nil
		}

		_, err = h.db.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(preferencesTable),
			Item:      item,
		})
		if err != nil {
			log.Printf("ERROR: Failed to save default preferences: %v", err)
			// Don't fail - return defaults anyway
		}
	} else {
		// Unmarshal existing preferences
		preferences = &NotificationPreferences{}
		err = dynamodbattribute.UnmarshalMap(result.Item, preferences)
		if err != nil {
			log.Printf("ERROR: Failed to unmarshal preferences: %v", err)
			return createErrorResponse(500, "Failed to process preferences"), nil
		}
	}

	response := PreferencesResponse{
		Success: true,
		Message: "Preferences retrieved successfully",
		Data:    preferences,
	}

	return createSuccessResponse(200, response), nil
}

func (h *NotificationPreferencesHandler) updatePreferences(userID, accountID, body string) (events.APIGatewayProxyResponse, error) {
	var req NotificationPreferences
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate preferences
	if err := h.validatePreferences(&req); err != nil {
		return createErrorResponse(400, err.Error()), nil
	}

	// Set system fields
	req.UserID = userID
	req.AccountID = accountID
	req.UpdatedAt = time.Now()

	// Get existing preferences to preserve CreatedAt
	preferencesTable := os.Getenv("NOTIFICATION_PREFERENCES_TABLE")
	if preferencesTable == "" {
		preferencesTable = "listbackup-main-notification-preferences"
	}

	existing, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(preferencesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {S: aws.String(userID)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to get existing preferences: %v", err)
		return createErrorResponse(500, "Failed to retrieve existing preferences"), nil
	}

	if existing.Item == nil {
		req.CreatedAt = time.Now()
	} else {
		var existingPrefs NotificationPreferences
		err = dynamodbattribute.UnmarshalMap(existing.Item, &existingPrefs)
		if err == nil {
			req.CreatedAt = existingPrefs.CreatedAt
		} else {
			req.CreatedAt = time.Now()
		}
	}

	// Save preferences
	item, err := dynamodbattribute.MarshalMap(req)
	if err != nil {
		log.Printf("ERROR: Failed to marshal preferences: %v", err)
		return createErrorResponse(500, "Failed to process preferences"), nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(preferencesTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("ERROR: Failed to save preferences: %v", err)
		return createErrorResponse(500, "Failed to save preferences"), nil
	}

	response := PreferencesResponse{
		Success: true,
		Message: "Preferences updated successfully",
		Data:    &req,
	}

	return createSuccessResponse(200, response), nil
}

func (h *NotificationPreferencesHandler) createDefaultPreferences(userID, accountID string) *NotificationPreferences {
	now := time.Now()
	
	return &NotificationPreferences{
		UserID:       userID,
		AccountID:    accountID,
		EmailEnabled: true,
		SMSEnabled:   false,
		AppEnabled:   true,
		SlackEnabled: false,
		WebhookEnabled: false,
		CategoryPreferences: map[string]CategoryPref{
			"backup":   {Enabled: true, Channels: []string{"app", "email"}, MinPriority: "normal"},
			"sync":     {Enabled: true, Channels: []string{"app", "email"}, MinPriority: "normal"},
			"system":   {Enabled: true, Channels: []string{"app"}, MinPriority: "high"},
			"security": {Enabled: true, Channels: []string{"app", "email", "sms"}, MinPriority: "high"},
			"billing":  {Enabled: true, Channels: []string{"app", "email"}, MinPriority: "normal"},
		},
		PriorityPreferences: map[string]PriorityPref{
			"low":    {Enabled: true, Channels: []string{"app"}, Immediate: false},
			"normal": {Enabled: true, Channels: []string{"app", "email"}, Immediate: false},
			"high":   {Enabled: true, Channels: []string{"app", "email"}, Immediate: true},
			"urgent": {Enabled: true, Channels: []string{"app", "email", "sms"}, Immediate: true},
		},
		FrequencySettings: FrequencySettings{
			Immediate:   true,
			Batched:     false,
			BatchWindow: 15,
			MaxPerHour:  10,
			MaxPerDay:   50,
		},
		QuietHours: QuietHours{
			Enabled:   false,
			StartTime: "22:00",
			EndTime:   "08:00",
			Timezone:  "America/New_York",
			Weekends:  true,
		},
		DigestSettings: DigestSettings{
			DailyEnabled:    false,
			WeeklyEnabled:   false,
			DailyTime:       "09:00",
			WeeklyDay:       1,
			WeeklyTime:      "09:00",
			IncludeArchived: false,
			MinPriority:     "normal",
		},
		GlobalSettings: GlobalSettings{
			DoNotDisturb:     false,
			VacationMode:     false,
			AutoArchiveAfter: 30,
			AutoDeleteAfter:  90,
			LanguageCode:     "en",
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func (h *NotificationPreferencesHandler) validatePreferences(prefs *NotificationPreferences) error {
	// Validate channels
	validChannels := []string{"app", "email", "sms", "slack", "webhook"}
	
	for category, categoryPref := range prefs.CategoryPreferences {
		for _, channel := range categoryPref.Channels {
			if !contains(validChannels, channel) {
				return fmt.Errorf("Invalid channel '%s' for category '%s'", channel, category)
			}
		}
	}

	for priority, priorityPref := range prefs.PriorityPreferences {
		for _, channel := range priorityPref.Channels {
			if !contains(validChannels, channel) {
				return fmt.Errorf("Invalid channel '%s' for priority '%s'", channel, priority)
			}
		}
	}

	// Validate priorities
	validPriorities := []string{"low", "normal", "high", "urgent"}
	for _, categoryPref := range prefs.CategoryPreferences {
		if !contains(validPriorities, categoryPref.MinPriority) {
			return fmt.Errorf("Invalid minimum priority: %s", categoryPref.MinPriority)
		}
	}

	// Validate frequency settings
	if prefs.FrequencySettings.BatchWindow < 5 || prefs.FrequencySettings.BatchWindow > 1440 {
		return errors.New("Batch window must be between 5 and 1440 minutes")
	}

	if prefs.FrequencySettings.MaxPerHour < 1 || prefs.FrequencySettings.MaxPerHour > 100 {
		return errors.New("Max per hour must be between 1 and 100")
	}

	if prefs.FrequencySettings.MaxPerDay < 1 || prefs.FrequencySettings.MaxPerDay > 1000 {
		return errors.New("Max per day must be between 1 and 1000")
	}

	return nil
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
			"Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := PreferencesResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewNotificationPreferencesHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}