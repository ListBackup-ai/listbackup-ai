package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type TagSuggestionsHandler struct {
	db *dynamodb.DynamoDB
}

type Tag struct {
	TagID       string                 `json:"tagId" dynamodbav:"tagId"`
	AccountID   string                 `json:"accountId" dynamodbav:"accountId"`
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

type TagSuggestion struct {
	TagID       string  `json:"tagId"`
	Name        string  `json:"name"`
	Color       string  `json:"color"`
	Category    string  `json:"category,omitempty"`
	UsageCount  int     `json:"usageCount"`
	Relevance   float64 `json:"relevance"`
	IsSystem    bool    `json:"isSystem"`
	Description string  `json:"description,omitempty"`
}

type TagSuggestionsResponse struct {
	Success bool             `json:"success"`
	Message string           `json:"message,omitempty"`
	Data    *SuggestionsData `json:"data,omitempty"`
	Error   string           `json:"error,omitempty"`
}

type SuggestionsData struct {
	Query       string          `json:"query"`
	Suggestions []TagSuggestion `json:"suggestions"`
	Total       int             `json:"total"`
}

func NewTagSuggestionsHandler() (*TagSuggestionsHandler, error) {
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

	return &TagSuggestionsHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *TagSuggestionsHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("TagSuggestions request: %+v", event)

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
	query := strings.TrimSpace(event.QueryStringParameters["q"])
	category := event.QueryStringParameters["category"]
	entityType := event.QueryStringParameters["entityType"]
	
	limit := 10 // Default limit
	if limitStr := event.QueryStringParameters["limit"]; limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	includeSystem := false
	if includeSystemStr := event.QueryStringParameters["includeSystem"]; includeSystemStr == "true" {
		includeSystem = true
	}

	// Get tag suggestions
	suggestions, err := h.getTagSuggestions(accountID, query, category, entityType, limit, includeSystem)
	if err != nil {
		log.Printf("ERROR: Failed to get tag suggestions: %v", err)
		return createErrorResponse(500, "Failed to retrieve tag suggestions"), nil
	}

	// Create response
	response := TagSuggestionsResponse{
		Success: true,
		Message: "Tag suggestions retrieved successfully",
		Data: &SuggestionsData{
			Query:       query,
			Suggestions: suggestions,
			Total:       len(suggestions),
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *TagSuggestionsHandler) getTagSuggestions(accountID, query, category, entityType string, limit int, includeSystem bool) ([]TagSuggestion, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	var suggestions []TagSuggestion

	if query == "" {
		// Return popular tags if no query provided
		return h.getPopularTags(accountID, category, entityType, limit, includeSystem)
	}

	// Search for tags matching the query
	matchingTags, err := h.searchTags(accountID, query, category, entityType, includeSystem)
	if err != nil {
		return nil, err
	}

	// Convert to suggestions with relevance scoring
	for _, tag := range matchingTags {
		relevance := h.calculateRelevance(tag, query)
		
		suggestion := TagSuggestion{
			TagID:       tag.TagID,
			Name:        tag.Name,
			Color:       tag.Color,
			Category:    tag.Category,
			UsageCount:  tag.UsageCount,
			Relevance:   relevance,
			IsSystem:    tag.IsSystem,
			Description: tag.Description,
		}
		
		suggestions = append(suggestions, suggestion)
	}

	// Sort by relevance (descending) and usage count (descending)
	suggestions = h.sortSuggestions(suggestions)

	// Limit results
	if len(suggestions) > limit {
		suggestions = suggestions[:limit]
	}

	// If we have fewer results than requested, add some auto-complete suggestions
	if len(suggestions) < limit {
		autoComplete := h.getAutoCompleteSuggestions(accountID, query, category, limit-len(suggestions))
		suggestions = append(suggestions, autoComplete...)
	}

	return suggestions, nil
}

func (h *TagSuggestionsHandler) searchTags(accountID, query, category, entityType string, includeSystem bool) ([]Tag, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	// Build filter expression
	var filterExpression string
	var expressionAttributeNames map[string]*string
	var expressionAttributeValues map[string]*dynamodb.AttributeValue

	filterParts := []string{}
	expressionAttributeValues = map[string]*dynamodb.AttributeValue{}
	expressionAttributeNames = map[string]*string{}

	// Add query filter (search in name and description)
	if query != "" {
		filterParts = append(filterParts, "(contains(#name, :query) OR contains(description, :query))")
		expressionAttributeNames["#name"] = aws.String("name")
		expressionAttributeValues[":query"] = &dynamodb.AttributeValue{S: aws.String(strings.ToLower(query))}
	}

	// Add category filter
	if category != "" {
		filterParts = append(filterParts, "category = :category")
		expressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(category)}
	}

	// Add system filter
	if !includeSystem {
		filterParts = append(filterParts, "isSystem = :isSystem")
		expressionAttributeValues[":isSystem"] = &dynamodb.AttributeValue{BOOL: aws.Bool(false)}
	}

	if len(filterParts) > 0 {
		filterExpression = strings.Join(filterParts, " AND ")
	}

	// Query for tags in the account
	input := &dynamodb.QueryInput{
		TableName:              aws.String(tagsTable),
		IndexName:              aws.String("AccountNameIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
		ScanIndexForward: aws.Bool(true),
	}

	// Add filter expression if we have one
	if filterExpression != "" {
		input.FilterExpression = aws.String(filterExpression)
		// Merge expression attribute values
		for k, v := range expressionAttributeValues {
			input.ExpressionAttributeValues[k] = v
		}
		if len(expressionAttributeNames) > 0 {
			input.ExpressionAttributeNames = expressionAttributeNames
		}
	}

	result, err := h.db.Query(input)
	if err != nil {
		return nil, err
	}

	// Unmarshal results
	var tags []Tag
	for _, item := range result.Items {
		var tag Tag
		if err := dynamodbattribute.UnmarshalMap(item, &tag); err != nil {
			log.Printf("ERROR: Failed to unmarshal tag: %v", err)
			continue
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func (h *TagSuggestionsHandler) getPopularTags(accountID, category, entityType string, limit int, includeSystem bool) ([]TagSuggestion, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	// Build filter expression for popular tags
	var filterExpression string
	var expressionAttributeValues map[string]*dynamodb.AttributeValue

	filterParts := []string{}
	expressionAttributeValues = map[string]*dynamodb.AttributeValue{}

	// Add category filter
	if category != "" {
		filterParts = append(filterParts, "category = :category")
		expressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(category)}
	}

	// Add system filter
	if !includeSystem {
		filterParts = append(filterParts, "isSystem = :isSystem")
		expressionAttributeValues[":isSystem"] = &dynamodb.AttributeValue{BOOL: aws.Bool(false)}
	}

	if len(filterParts) > 0 {
		filterExpression = strings.Join(filterParts, " AND ")
	}

	// Query for tags sorted by usage count
	input := &dynamodb.QueryInput{
		TableName:              aws.String(tagsTable),
		IndexName:              aws.String("AccountUsageIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
		ScanIndexForward: aws.Bool(false), // Descending order (most popular first)
		Limit:           aws.Int64(int64(limit * 2)), // Get more to filter
	}

	// Add filter expression if we have one
	if filterExpression != "" {
		input.FilterExpression = aws.String(filterExpression)
		// Merge expression attribute values
		for k, v := range expressionAttributeValues {
			input.ExpressionAttributeValues[k] = v
		}
	}

	result, err := h.db.Query(input)
	if err != nil {
		return nil, err
	}

	// Convert to suggestions
	var suggestions []TagSuggestion
	for _, item := range result.Items {
		var tag Tag
		if err := dynamodbattribute.UnmarshalMap(item, &tag); err != nil {
			log.Printf("ERROR: Failed to unmarshal tag: %v", err)
			continue
		}

		suggestion := TagSuggestion{
			TagID:       tag.TagID,
			Name:        tag.Name,
			Color:       tag.Color,
			Category:    tag.Category,
			UsageCount:  tag.UsageCount,
			Relevance:   1.0, // High relevance for popular tags
			IsSystem:    tag.IsSystem,
			Description: tag.Description,
		}

		suggestions = append(suggestions, suggestion)

		if len(suggestions) >= limit {
			break
		}
	}

	return suggestions, nil
}

func (h *TagSuggestionsHandler) getAutoCompleteSuggestions(accountID, query, category string, limit int) []TagSuggestion {
	// Generate auto-complete suggestions based on query
	var suggestions []TagSuggestion

	if query == "" {
		return suggestions
	}

	// Common tag patterns and suggestions
	commonSuggestions := h.getCommonTagSuggestions(query, category)
	
	for _, suggestion := range commonSuggestions {
		suggestions = append(suggestions, suggestion)
		if len(suggestions) >= limit {
			break
		}
	}

	return suggestions
}

func (h *TagSuggestionsHandler) getCommonTagSuggestions(query, category string) []TagSuggestion {
	// Pre-defined common tag patterns
	commonPatterns := map[string][]TagSuggestion{
		"priority": {
			{Name: "high-priority", Color: "#EF4444", Category: "priority", Relevance: 0.9},
			{Name: "medium-priority", Color: "#F59E0B", Category: "priority", Relevance: 0.8},
			{Name: "low-priority", Color: "#6B7280", Category: "priority", Relevance: 0.7},
		},
		"status": {
			{Name: "active", Color: "#10B981", Category: "status", Relevance: 0.9},
			{Name: "inactive", Color: "#6B7280", Category: "status", Relevance: 0.8},
			{Name: "archived", Color: "#9CA3AF", Category: "status", Relevance: 0.7},
		},
		"type": {
			{Name: "production", Color: "#EF4444", Category: "type", Relevance: 0.9},
			{Name: "staging", Color: "#F59E0B", Category: "type", Relevance: 0.8},
			{Name: "development", Color: "#3B82F6", Category: "type", Relevance: 0.7},
		},
		"department": {
			{Name: "marketing", Color: "#EC4899", Category: "department", Relevance: 0.9},
			{Name: "sales", Color: "#10B981", Category: "department", Relevance: 0.8},
			{Name: "support", Color: "#8B5CF6", Category: "department", Relevance: 0.7},
		},
	}

	var suggestions []TagSuggestion
	
	// Search for patterns that match the query
	queryLower := strings.ToLower(query)
	
	for pattern, patternSuggestions := range commonPatterns {
		if strings.Contains(pattern, queryLower) || strings.Contains(queryLower, pattern) {
			suggestions = append(suggestions, patternSuggestions...)
		}
	}

	// If no patterns match, create a suggestion based on the query
	if len(suggestions) == 0 {
		suggestions = append(suggestions, TagSuggestion{
			Name:      query,
			Color:     "#3B82F6",
			Category:  category,
			Relevance: 0.5,
		})
	}

	return suggestions
}

func (h *TagSuggestionsHandler) calculateRelevance(tag Tag, query string) float64 {
	queryLower := strings.ToLower(query)
	nameLower := strings.ToLower(tag.Name)
	
	// Exact match gets highest relevance
	if nameLower == queryLower {
		return 1.0
	}
	
	// Starts with query gets high relevance
	if strings.HasPrefix(nameLower, queryLower) {
		return 0.9
	}
	
	// Contains query gets medium relevance
	if strings.Contains(nameLower, queryLower) {
		return 0.7
	}
	
	// Check description if available
	if tag.Description != "" {
		descLower := strings.ToLower(tag.Description)
		if strings.Contains(descLower, queryLower) {
			return 0.5
		}
	}
	
	// Base relevance for usage count
	usageRelevance := float64(tag.UsageCount) / 100.0
	if usageRelevance > 0.3 {
		usageRelevance = 0.3
	}
	
	return usageRelevance
}

func (h *TagSuggestionsHandler) sortSuggestions(suggestions []TagSuggestion) []TagSuggestion {
	// Simple bubble sort by relevance (descending) then usage count (descending)
	n := len(suggestions)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if suggestions[j].Relevance < suggestions[j+1].Relevance ||
				(suggestions[j].Relevance == suggestions[j+1].Relevance && suggestions[j].UsageCount < suggestions[j+1].UsageCount) {
				suggestions[j], suggestions[j+1] = suggestions[j+1], suggestions[j]
			}
		}
	}
	return suggestions
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
	response := TagSuggestionsResponse{
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
	handler, err := NewTagSuggestionsHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}