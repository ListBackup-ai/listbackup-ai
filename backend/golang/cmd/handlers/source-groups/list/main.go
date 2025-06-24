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
)

type ListSourceGroupsHandler struct {
	db *dynamodb.DynamoDB
}

type SourceGroup struct {
	GroupID      string    `json:"groupId" dynamodbav:"groupId"`
	AccountID    string    `json:"accountId" dynamodbav:"accountId"`
	UserID       string    `json:"userId" dynamodbav:"userId"`
	ConnectionID string    `json:"connectionId" dynamodbav:"connectionId"`
	Name         string    `json:"name" dynamodbav:"name"`
	Description  string    `json:"description" dynamodbav:"description"`
	Status       string    `json:"status" dynamodbav:"status"`
	SourceCount  int       `json:"sourceCount" dynamodbav:"sourceCount"`
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

func NewListSourceGroupsHandler() (*ListSourceGroupsHandler, error) {
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

	// Create DynamoDB client
	db := dynamodb.New(sess)
	
	return &ListSourceGroupsHandler{db: db}, nil
}

func (h *ListSourceGroupsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List source groups request started")

	// Handle OPTIONS for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract auth context from lambda authorizer
	var userID, accountID string
	if authLambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
		if uid, exists := authLambda["userId"].(string); exists {
			userID = uid
		}
		if aid, exists := authLambda["accountId"].(string); exists {
			accountID = aid
		}
	} else {
		if uid, exists := event.RequestContext.Authorizer["userId"].(string); exists {
			userID = uid
		}
		if aid, exists := event.RequestContext.Authorizer["accountId"].(string); exists {
			accountID = aid
		}
	}

	if userID == "" || accountID == "" {
		log.Printf("Auth failed - userID: %s, accountID: %s", userID, accountID)
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "User not authenticated"}`,
		}, nil
	}

	// Get query parameters for filtering
	connectionID := ""
	status := ""
	if event.QueryStringParameters != nil {
		connectionID = event.QueryStringParameters["connectionId"]
		status = event.QueryStringParameters["status"]
	}

	log.Printf("List source groups request for user %s, account %s", userID, accountID)

	// Get source groups table name
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}

	var sourceGroups []SourceGroup

	if connectionID != "" {
		// Add connection: prefix if not present
		if !strings.HasPrefix(connectionID, "connection:") {
			connectionID = "connection:" + connectionID
		}
		
		// Query by connection ID using GSI
		result, err := h.db.Query(&dynamodb.QueryInput{
			TableName:              aws.String(sourceGroupsTable),
			IndexName:              aws.String("ConnectionIndex"),
			KeyConditionExpression: aws.String("connectionId = :connectionId"),
			FilterExpression:       aws.String("accountId = :accountId AND userId = :userId"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":connectionId": {S: aws.String(connectionID)},
				":accountId":    {S: aws.String(accountID)},
				":userId":       {S: aws.String(userID)},
			},
		})
		if err != nil {
			log.Printf("Failed to query source groups by connection: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 500,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
					"Content-Type":                 "application/json",
				},
				Body: `{"success": false, "error": "Failed to query source groups"}`,
			}, nil
		}

		// Unmarshal results
		for _, item := range result.Items {
			var group SourceGroup
			err := dynamodbattribute.UnmarshalMap(item, &group)
			if err != nil {
				log.Printf("Failed to unmarshal source group: %v", err)
				continue
			}
			sourceGroups = append(sourceGroups, group)
		}
	} else {
		// Query by user and account
		result, err := h.db.Query(&dynamodb.QueryInput{
			TableName:              aws.String(sourceGroupsTable),
			IndexName:              aws.String("UserIndex"),
			KeyConditionExpression: aws.String("userId = :userId"),
			FilterExpression:       aws.String("accountId = :accountId"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":userId":    {S: aws.String(userID)},
				":accountId": {S: aws.String(accountID)},
			},
		})
		if err != nil {
			log.Printf("Failed to query source groups by user: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 500,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
					"Content-Type":                 "application/json",
				},
				Body: `{"success": false, "error": "Failed to query source groups"}`,
			}, nil
		}

		// Unmarshal results
		for _, item := range result.Items {
			var group SourceGroup
			err := dynamodbattribute.UnmarshalMap(item, &group)
			if err != nil {
				log.Printf("Failed to unmarshal source group: %v", err)
				continue
			}
			sourceGroups = append(sourceGroups, group)
		}
	}

	// Apply status filter if provided
	if status != "" {
		var filteredGroups []SourceGroup
		for _, group := range sourceGroups {
			if group.Status == status {
				filteredGroups = append(filteredGroups, group)
			}
		}
		sourceGroups = filteredGroups
	}

	// Convert to response format (remove prefixes for cleaner API)
	var responseGroups []map[string]interface{}
	for _, group := range sourceGroups {
		responseGroup := map[string]interface{}{
			"groupId":      strings.TrimPrefix(group.GroupID, "group:"),
			"accountId":    group.AccountID,
			"userId":       group.UserID,
			"connectionId": strings.TrimPrefix(group.ConnectionID, "connection:"),
			"name":         group.Name,
			"description":  group.Description,
			"status":       group.Status,
			"sourceCount":  group.SourceCount,
			"createdAt":    group.CreatedAt,
			"updatedAt":    group.UpdatedAt,
		}
		responseGroups = append(responseGroups, responseGroup)
	}

	responseData := map[string]interface{}{
		"success": true,
		"data":    responseGroups,
		"total":   len(responseGroups),
		"filters": map[string]interface{}{
			"connectionId": connectionID,
			"status":       status,
		},
	}

	responseBody, err := json.Marshal(responseData)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create response"}`,
		}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Content-Type":                 "application/json",
		},
		Body: string(responseBody),
	}, nil
}

func main() {
	handler, err := NewListSourceGroupsHandler()
	if err != nil {
		log.Fatalf("Failed to create list source groups handler: %v", err)
	}

	lambda.Start(handler.Handle)
}