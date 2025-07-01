package main

import (
	"encoding/json"
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
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type PlatformConnection struct {
	ConnectionID string                 `json:"connectionId" dynamodbav:"connectionId"`
	AccountID    string                 `json:"accountId" dynamodbav:"accountId"`
	UserID       string                 `json:"userId" dynamodbav:"userId"`
	PlatformID   string                 `json:"platformId" dynamodbav:"platformId"`
	Name         string                 `json:"name" dynamodbav:"name"`
	Status       string                 `json:"status" dynamodbav:"status"`
	AuthType     string                 `json:"authType" dynamodbav:"authType"`
	Credentials  map[string]interface{} `json:"credentials,omitempty" dynamodbav:"credentials"`
	ExpiresAt    *time.Time             `json:"expiresAt,omitempty" dynamodbav:"expiresAt"`
	CreatedAt    time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

var (
	platformConnectionsTable = os.Getenv("PLATFORM_CONNECTIONS_TABLE")
)

func Handle(event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	platformID := event.PathParameters["platformId"]
	if platformID == "" {
		return createErrorResponse(400, "Platform ID is required"), nil
	}

	// Add platform: prefix if not present
	if len(platformID) < 9 || platformID[:9] != "platform:" {
		platformID = "platform:" + platformID
	}

	// Extract user ID from JWT claims
	userID := extractUserID(event)
	if userID == "" {
		return createErrorResponse(401, "User not authenticated"), nil
	}

	log.Printf("List platform connections request for platform %s, user %s", platformID, userID)

	// Get table name from environment
	if platformConnectionsTable == "" {
		platformConnectionsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platform-connections"
	}

	// List user's platform connections for this platform
	connections, err := listUserPlatformConnections(platformID, userID)
	if err != nil {
		log.Printf("Failed to list platform connections: %v", err)
		return createErrorResponse(500, "Failed to list platform connections"), nil
	}

	// Remove sensitive credential information
	for i := range connections {
		connections[i].Credentials = nil
	}

	log.Printf("Found %d platform connections for user %s on platform %s", len(connections), userID, platformID)
	return createSuccessResponse(Response{
		Success: true,
		Data: map[string]interface{}{
			"connections": connections,
			"total":       len(connections),
			"platformId":  platformID,
		},
	}), nil
}

func listUserPlatformConnections(platformID, userID string) ([]PlatformConnection, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Query by platformId using GSI and filter by userId
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("platformId").Equal(expression.Value(platformID))).
		WithFilter(expression.Name("userId").Equal(expression.Value(userID))).
		Build()
	if err != nil {
		return nil, err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(platformConnectionsTable),
		IndexName:                 aws.String("PlatformIndex"),
		KeyConditionExpression:    expr.KeyCondition(),
		FilterExpression:          expr.Filter(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return nil, err
	}

	var connections []PlatformConnection
	for _, item := range result.Items {
		var conn PlatformConnection
		if err := dynamodbattribute.UnmarshalMap(item, &conn); err != nil {
			log.Printf("Error unmarshaling connection: %v", err)
			continue
		}
		connections = append(connections, conn)
	}

	return connections, nil
}

func extractUserID(event events.APIGatewayV2HTTPRequest) string {
	if event.RequestContext.Authorizer != nil {
		if jwt := event.RequestContext.Authorizer.JWT; jwt != nil {
			if sub, ok := jwt.Claims["sub"]; ok {
				return fmt.Sprintf("user:%s", sub)
			}
		}
		if lambda := event.RequestContext.Authorizer.Lambda; lambda != nil {
			if userID, ok := lambda["userId"].(string); ok {
				return userID
			}
		}
	}
	return ""
}

func createSuccessResponse(data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := Response{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func main() {
	lambda.Start(Handle)
}