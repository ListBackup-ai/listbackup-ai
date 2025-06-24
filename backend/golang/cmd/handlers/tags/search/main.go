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

type SearchTagsHandler struct {
	db *dynamodb.DynamoDB
}

type Tag struct {
	TagID       string                 `json:"tagId" dynamodbav:"tagId"`
	AccountID   string                 `json:"accountId" dynamodbav:"accountId"`
	UserID      string                 `json:"userId" dynamodbav:"userId"`
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

type SearchTagsResponse struct {
	Success    bool      `json:"success"`
	Message    string    `json:"message,omitempty"`
	Data       *TagsList `json:"data,omitempty"`
	Error      string    `json:"error,omitempty"`
}

type TagsList struct {
	Tags       []Tag  `json:"tags"`
	TotalCount int    `json:"totalCount"`
	Query      string `json:"query"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	HasMore    bool   `json:"hasMore"`
}

func NewSearchTagsHandler() (*SearchTagsHandler, error) {
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

	return &SearchTagsHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *SearchTagsHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("SearchTags request: %+v", event)

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
	if query == "" {
		return createErrorResponse(400, "Search query is required"), nil
	}

	category := event.QueryStringParameters["category"]
	
	limit := 50 // Default limit
	if limitStr := event.QueryStringParameters["limit"]; limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	page := 1 // Default page
	if pageStr := event.QueryStringParameters["page"]; pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	// Search tags
	tags, totalCount, err := h.searchTags(accountID, query, category, limit, page)
	if err != nil {
		log.Printf("ERROR: Failed to search tags: %v", err)
		return createErrorResponse(500, "Failed to search tags"), nil
	}

	// Calculate pagination info
	hasMore := totalCount > (page * limit)

	// Create response
	response := SearchTagsResponse{
		Success: true,
		Message: "Tags searched successfully",
		Data: &TagsList{
			Tags:       tags,
			TotalCount: totalCount,
			Query:      query,
			Page:       page,
			Limit:      limit,
			HasMore:    hasMore,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *SearchTagsHandler) searchTags(accountID, query, category string, limit, page int) ([]Tag, int, error) {
	tagsTable := os.Getenv("TAGS_TABLE")
	if tagsTable == "" {
		tagsTable = "listbackup-main-tags"
	}

	// First, get all tags for the account using the AccountNameIndex
	input := &dynamodb.QueryInput{
		TableName:              aws.String(tagsTable),
		IndexName:              aws.String("AccountNameIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {S: aws.String(accountID)},
		},
	}

	// Add category filter if specified
	if category != "" {
		input.FilterExpression = aws.String("category = :category")
		input.ExpressionAttributeValues[":category"] = &dynamodb.AttributeValue{S: aws.String(category)}
	}

	result, err := h.db.Query(input)
	if err != nil {
		return nil, 0, err
	}

	// Unmarshal all results
	var allTags []Tag
	for _, item := range result.Items {
		var tag Tag
		if err := dynamodbattribute.UnmarshalMap(item, &tag); err != nil {
			log.Printf("ERROR: Failed to unmarshal tag: %v", err)
			continue
		}
		allTags = append(allTags, tag)
	}

	// Filter tags based on search query (client-side filtering for simplicity)
	// In production, you might want to use ElasticSearch or implement more sophisticated search
	var matchedTags []Tag
	queryLower := strings.ToLower(query)
	
	for _, tag := range allTags {
		// Check if query matches tag name, description, or category
		nameMatch := strings.Contains(strings.ToLower(tag.Name), queryLower)
		descMatch := strings.Contains(strings.ToLower(tag.Description), queryLower)
		categoryMatch := strings.Contains(strings.ToLower(tag.Category), queryLower)
		
		if nameMatch || descMatch || categoryMatch {
			matchedTags = append(matchedTags, tag)
		}
	}

	// Apply pagination
	totalCount := len(matchedTags)
	offset := (page - 1) * limit
	
	var paginatedTags []Tag
	if offset < len(matchedTags) {
		endIndex := offset + limit
		if endIndex > len(matchedTags) {
			endIndex = len(matchedTags)
		}
		paginatedTags = matchedTags[offset:endIndex]
	}

	// Sort by relevance (name matches first, then by usage count)
	h.sortTagsByRelevance(paginatedTags, queryLower)

	return paginatedTags, totalCount, nil
}

func (h *SearchTagsHandler) sortTagsByRelevance(tags []Tag, query string) {
	// Simple relevance sorting:
	// 1. Exact name matches first
	// 2. Name starts with query
	// 3. Name contains query
	// 4. Sort by usage count within each group
	
	for i := 0; i < len(tags)-1; i++ {
		for j := i + 1; j < len(tags); j++ {
			iScore := h.calculateRelevanceScore(tags[i], query)
			jScore := h.calculateRelevanceScore(tags[j], query)
			
			// Higher score = more relevant = should come first
			if jScore > iScore {
				tags[i], tags[j] = tags[j], tags[i]
			}
		}
	}
}

func (h *SearchTagsHandler) calculateRelevanceScore(tag Tag, query string) int {
	tagNameLower := strings.ToLower(tag.Name)
	score := 0
	
	// Exact match
	if tagNameLower == query {
		score += 1000
	}
	
	// Starts with query
	if strings.HasPrefix(tagNameLower, query) {
		score += 500
	}
	
	// Contains query
	if strings.Contains(tagNameLower, query) {
		score += 100
	}
	
	// Description contains query
	if strings.Contains(strings.ToLower(tag.Description), query) {
		score += 50
	}
	
	// Category contains query
	if strings.Contains(strings.ToLower(tag.Category), query) {
		score += 25
	}
	
	// Add usage count as tiebreaker
	score += tag.UsageCount
	
	return score
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
	response := SearchTagsResponse{
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
	handler, err := NewSearchTagsHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}