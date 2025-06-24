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
	"github.com/google/uuid"
)

type NotificationTemplatesHandler struct {
	db *dynamodb.DynamoDB
}

type NotificationTemplate struct {
	TemplateID    string                 `json:"templateId" dynamodbav:"templateId"`
	AccountID     string                 `json:"accountId" dynamodbav:"accountId"`
	Name          string                 `json:"name" dynamodbav:"name"`
	Description   string                 `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Category      string                 `json:"category" dynamodbav:"category"`
	Type          string                 `json:"type" dynamodbav:"type"`
	Priority      string                 `json:"priority" dynamodbav:"priority"`
	Subject       string                 `json:"subject" dynamodbav:"subject"`
	EmailHTML     string                 `json:"emailHtml,omitempty" dynamodbav:"emailHtml,omitempty"`
	EmailText     string                 `json:"emailText,omitempty" dynamodbav:"emailText,omitempty"`
	SMSTemplate   string                 `json:"smsTemplate,omitempty" dynamodbav:"smsTemplate,omitempty"`
	AppTemplate   string                 `json:"appTemplate,omitempty" dynamodbav:"appTemplate,omitempty"`
	SlackTemplate string                 `json:"slackTemplate,omitempty" dynamodbav:"slackTemplate,omitempty"`
	Variables     []TemplateVariable     `json:"variables" dynamodbav:"variables"`
	Actions       []TemplateAction       `json:"actions,omitempty" dynamodbav:"actions,omitempty"`
	Channels      []string               `json:"channels" dynamodbav:"channels"`
	IsSystem      bool                   `json:"isSystem" dynamodbav:"isSystem"`
	IsActive      bool                   `json:"isActive" dynamodbav:"isActive"`
	Language      string                 `json:"language" dynamodbav:"language"`
	Version       int                    `json:"version" dynamodbav:"version"`
	Metadata      map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	CreatedBy     string                 `json:"createdBy" dynamodbav:"createdBy"`
	CreatedAt     time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt     time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type TemplateVariable struct {
	Name         string `json:"name" dynamodbav:"name"`
	Type         string `json:"type" dynamodbav:"type"`                 // string, number, boolean, date, url
	Description  string `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Required     bool   `json:"required" dynamodbav:"required"`
	DefaultValue string `json:"defaultValue,omitempty" dynamodbav:"defaultValue,omitempty"`
	Format       string `json:"format,omitempty" dynamodbav:"format,omitempty"` // For dates: "YYYY-MM-DD", etc.
}

type TemplateAction struct {
	Label   string `json:"label" dynamodbav:"label"`
	URL     string `json:"url" dynamodbav:"url"`         // Can contain variables like {{actionUrl}}
	Style   string `json:"style" dynamodbav:"style"`     // primary, secondary, danger
	Target  string `json:"target,omitempty" dynamodbav:"target,omitempty"` // _blank, _self
}

type TemplateRequest struct {
	Name          string             `json:"name"`
	Description   string             `json:"description,omitempty"`
	Category      string             `json:"category"`
	Type          string             `json:"type"`
	Priority      string             `json:"priority"`
	Subject       string             `json:"subject"`
	EmailHTML     string             `json:"emailHtml,omitempty"`
	EmailText     string             `json:"emailText,omitempty"`
	SMSTemplate   string             `json:"smsTemplate,omitempty"`
	AppTemplate   string             `json:"appTemplate,omitempty"`
	SlackTemplate string             `json:"slackTemplate,omitempty"`
	Variables     []TemplateVariable `json:"variables"`
	Actions       []TemplateAction   `json:"actions,omitempty"`
	Channels      []string           `json:"channels"`
	Language      string             `json:"language,omitempty"`
}

type TemplateResponse struct {
	Success bool                    `json:"success"`
	Message string                  `json:"message,omitempty"`
	Data    interface{}             `json:"data,omitempty"`
	Error   string                  `json:"error,omitempty"`
}

type TemplateListResponse struct {
	Templates   []NotificationTemplate `json:"templates"`
	TotalCount  int                    `json:"totalCount"`
	SystemCount int                    `json:"systemCount"`
	CustomCount int                    `json:"customCount"`
}

func NewNotificationTemplatesHandler() (*NotificationTemplatesHandler, error) {
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

	return &NotificationTemplatesHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *NotificationTemplatesHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("NotificationTemplates request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

	templateID := event.PathParameters["templateId"]

	switch event.HTTPMethod {
	case "GET":
		if templateID != "" {
			return h.getTemplate(templateID, accountID)
		}
		return h.listTemplates(accountID, event.QueryStringParameters)
	case "POST":
		return h.createTemplate(userID, accountID, event.Body)
	case "PUT":
		if templateID == "" {
			return createErrorResponse(400, "Template ID is required for updates"), nil
		}
		return h.updateTemplate(templateID, userID, accountID, event.Body)
	case "DELETE":
		if templateID == "" {
			return createErrorResponse(400, "Template ID is required for deletion"), nil
		}
		return h.deleteTemplate(templateID, accountID)
	default:
		return createErrorResponse(405, "Method not allowed"), nil
	}
}

func (h *NotificationTemplatesHandler) listTemplates(accountID string, queryParams map[string]string) (events.APIGatewayProxyResponse, error) {
	templatesTable := os.Getenv("NOTIFICATION_TEMPLATES_TABLE")
	if templatesTable == "" {
		templatesTable = "listbackup-main-notification-templates"
	}

	// Build filter expression
	filterExpression := "accountId = :accountId OR isSystem = :isSystem"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":accountId": {S: aws.String(accountID)},
		":isSystem":  {BOOL: aws.Bool(true)},
	}

	// Add category filter if specified
	if category := queryParams["category"]; category != "" {
		filterExpression += " AND category = :category"
		expressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(category)}
	}

	// Add type filter if specified
	if templateType := queryParams["type"]; templateType != "" {
		filterExpression += " AND #type = :type"
		expressionAttributeValues[":type"] = &dynamodb.AttributeValue{S: aws.String(templateType)}
	}

	// Add language filter if specified
	if language := queryParams["language"]; language != "" {
		filterExpression += " AND #language = :language"
		expressionAttributeValues[":language"] = &dynamodb.AttributeValue{S: aws.String(language)}
	}

	// Add active filter
	if active := queryParams["active"]; active == "true" {
		filterExpression += " AND isActive = :isActive"
		expressionAttributeValues[":isActive"] = &dynamodb.AttributeValue{BOOL: aws.Bool(true)}
	}

	scanInput := &dynamodb.ScanInput{
		TableName:                 aws.String(templatesTable),
		FilterExpression:          aws.String(filterExpression),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	if templateType := queryParams["type"]; templateType != "" || queryParams["language"] != "" {
		scanInput.ExpressionAttributeNames = map[string]*string{
			"#type":     aws.String("type"),
			"#language": aws.String("language"),
		}
	}

	result, err := h.db.Scan(scanInput)
	if err != nil {
		log.Printf("ERROR: Failed to scan templates: %v", err)
		return createErrorResponse(500, "Failed to retrieve templates"), nil
	}

	var templates []NotificationTemplate
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &templates)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal templates: %v", err)
		return createErrorResponse(500, "Failed to process templates"), nil
	}

	// Count system vs custom templates
	systemCount := 0
	customCount := 0
	for _, template := range templates {
		if template.IsSystem {
			systemCount++
		} else {
			customCount++
		}
	}

	response := TemplateResponse{
		Success: true,
		Message: "Templates retrieved successfully",
		Data: TemplateListResponse{
			Templates:   templates,
			TotalCount:  len(templates),
			SystemCount: systemCount,
			CustomCount: customCount,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *NotificationTemplatesHandler) getTemplate(templateID, accountID string) (events.APIGatewayProxyResponse, error) {
	templatesTable := os.Getenv("NOTIFICATION_TEMPLATES_TABLE")
	if templatesTable == "" {
		templatesTable = "listbackup-main-notification-templates"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(templatesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"templateId": {S: aws.String(templateID)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to get template: %v", err)
		return createErrorResponse(500, "Failed to retrieve template"), nil
	}

	if result.Item == nil {
		return createErrorResponse(404, "Template not found"), nil
	}

	var template NotificationTemplate
	err = dynamodbattribute.UnmarshalMap(result.Item, &template)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal template: %v", err)
		return createErrorResponse(500, "Failed to process template"), nil
	}

	// Check access - user can access system templates or their own account templates
	if !template.IsSystem && template.AccountID != accountID {
		return createErrorResponse(403, "Access denied"), nil
	}

	response := TemplateResponse{
		Success: true,
		Message: "Template retrieved successfully",
		Data:    template,
	}

	return createSuccessResponse(200, response), nil
}

func (h *NotificationTemplatesHandler) createTemplate(userID, accountID, body string) (events.APIGatewayProxyResponse, error) {
	var req TemplateRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.Name == "" {
		return createErrorResponse(400, "Template name is required"), nil
	}
	if req.Category == "" {
		return createErrorResponse(400, "Template category is required"), nil
	}
	if req.Type == "" {
		return createErrorResponse(400, "Template type is required"), nil
	}
	if req.Subject == "" {
		return createErrorResponse(400, "Template subject is required"), nil
	}

	// Set defaults
	if req.Priority == "" {
		req.Priority = "normal"
	}
	if req.Language == "" {
		req.Language = "en"
	}
	if len(req.Channels) == 0 {
		req.Channels = []string{"app", "email"}
	}

	// Create template
	now := time.Now()
	template := NotificationTemplate{
		TemplateID:    uuid.New().String(),
		AccountID:     accountID,
		Name:          req.Name,
		Description:   req.Description,
		Category:      req.Category,
		Type:          req.Type,
		Priority:      req.Priority,
		Subject:       req.Subject,
		EmailHTML:     req.EmailHTML,
		EmailText:     req.EmailText,
		SMSTemplate:   req.SMSTemplate,
		AppTemplate:   req.AppTemplate,
		SlackTemplate: req.SlackTemplate,
		Variables:     req.Variables,
		Actions:       req.Actions,
		Channels:      req.Channels,
		IsSystem:      false,
		IsActive:      true,
		Language:      req.Language,
		Version:       1,
		CreatedBy:     userID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	// Save to database
	templatesTable := os.Getenv("NOTIFICATION_TEMPLATES_TABLE")
	if templatesTable == "" {
		templatesTable = "listbackup-main-notification-templates"
	}

	item, err := dynamodbattribute.MarshalMap(template)
	if err != nil {
		log.Printf("ERROR: Failed to marshal template: %v", err)
		return createErrorResponse(500, "Failed to create template"), nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(templatesTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("ERROR: Failed to save template: %v", err)
		return createErrorResponse(500, "Failed to save template"), nil
	}

	response := TemplateResponse{
		Success: true,
		Message: "Template created successfully",
		Data:    template,
	}

	return createSuccessResponse(201, response), nil
}

func (h *NotificationTemplatesHandler) updateTemplate(templateID, userID, accountID, body string) (events.APIGatewayProxyResponse, error) {
	// Get existing template
	templatesTable := os.Getenv("NOTIFICATION_TEMPLATES_TABLE")
	if templatesTable == "" {
		templatesTable = "listbackup-main-notification-templates"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(templatesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"templateId": {S: aws.String(templateID)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to get template: %v", err)
		return createErrorResponse(500, "Failed to retrieve template"), nil
	}

	if result.Item == nil {
		return createErrorResponse(404, "Template not found"), nil
	}

	var existingTemplate NotificationTemplate
	err = dynamodbattribute.UnmarshalMap(result.Item, &existingTemplate)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal existing template: %v", err)
		return createErrorResponse(500, "Failed to process existing template"), nil
	}

	// Check access - user can only update their own account templates
	if existingTemplate.IsSystem || existingTemplate.AccountID != accountID {
		return createErrorResponse(403, "Cannot modify system templates or templates from other accounts"), nil
	}

	// Parse update request
	var req TemplateRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Update template
	now := time.Now()
	existingTemplate.Name = req.Name
	existingTemplate.Description = req.Description
	existingTemplate.Category = req.Category
	existingTemplate.Type = req.Type
	existingTemplate.Priority = req.Priority
	existingTemplate.Subject = req.Subject
	existingTemplate.EmailHTML = req.EmailHTML
	existingTemplate.EmailText = req.EmailText
	existingTemplate.SMSTemplate = req.SMSTemplate
	existingTemplate.AppTemplate = req.AppTemplate
	existingTemplate.SlackTemplate = req.SlackTemplate
	existingTemplate.Variables = req.Variables
	existingTemplate.Actions = req.Actions
	existingTemplate.Channels = req.Channels
	existingTemplate.Language = req.Language
	existingTemplate.Version++
	existingTemplate.UpdatedAt = now

	// Save updated template
	item, err := dynamodbattribute.MarshalMap(existingTemplate)
	if err != nil {
		log.Printf("ERROR: Failed to marshal updated template: %v", err)
		return createErrorResponse(500, "Failed to update template"), nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(templatesTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("ERROR: Failed to save updated template: %v", err)
		return createErrorResponse(500, "Failed to save updated template"), nil
	}

	response := TemplateResponse{
		Success: true,
		Message: "Template updated successfully",
		Data:    existingTemplate,
	}

	return createSuccessResponse(200, response), nil
}

func (h *NotificationTemplatesHandler) deleteTemplate(templateID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Get existing template to verify ownership
	templatesTable := os.Getenv("NOTIFICATION_TEMPLATES_TABLE")
	if templatesTable == "" {
		templatesTable = "listbackup-main-notification-templates"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(templatesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"templateId": {S: aws.String(templateID)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to get template: %v", err)
		return createErrorResponse(500, "Failed to retrieve template"), nil
	}

	if result.Item == nil {
		return createErrorResponse(404, "Template not found"), nil
	}

	var template NotificationTemplate
	err = dynamodbattribute.UnmarshalMap(result.Item, &template)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal template: %v", err)
		return createErrorResponse(500, "Failed to process template"), nil
	}

	// Check access - user can only delete their own account templates
	if template.IsSystem || template.AccountID != accountID {
		return createErrorResponse(403, "Cannot delete system templates or templates from other accounts"), nil
	}

	// Delete template
	_, err = h.db.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(templatesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"templateId": {S: aws.String(templateID)},
		},
	})
	if err != nil {
		log.Printf("ERROR: Failed to delete template: %v", err)
		return createErrorResponse(500, "Failed to delete template"), nil
	}

	response := TemplateResponse{
		Success: true,
		Message: "Template deleted successfully",
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
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := TemplateResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewNotificationTemplatesHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}