package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type Platform struct {
	PlatformID      string               `json:"platformId" dynamodbav:"platformId"`
	Name            string               `json:"name" dynamodbav:"name"`
	DisplayName     string               `json:"displayName" dynamodbav:"displayName"`
	Category        string               `json:"category" dynamodbav:"category"`
	Description     string               `json:"description" dynamodbav:"description"`
	Icon            string               `json:"icon" dynamodbav:"icon"`
	Status          string               `json:"status" dynamodbav:"status"`
	DataTypes       []string             `json:"dataTypes" dynamodbav:"dataTypes"`
	SupportedScopes []string             `json:"supportedScopes" dynamodbav:"supportedScopes"`
	APIConfig       APIConfiguration     `json:"apiConfig" dynamodbav:"apiConfig"`
	OAuth           *OAuthConfiguration  `json:"oauth,omitempty" dynamodbav:"oauth"`
	CreatedAt       string               `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       string               `json:"updatedAt" dynamodbav:"updatedAt"`
}

type APIConfiguration struct {
	AuthType      string            `json:"authType" dynamodbav:"authType"`
	BaseURL       string            `json:"baseUrl" dynamodbav:"baseUrl"`
	RateLimit     int               `json:"rateLimit" dynamodbav:"rateLimit"`
	Headers       map[string]string `json:"headers" dynamodbav:"headers"`
	CustomConfig  map[string]string `json:"customConfig" dynamodbav:"customConfig"`
}

type OAuthConfiguration struct {
	AuthURL      string   `json:"authUrl" dynamodbav:"authUrl"`
	Scopes       []string `json:"scopes" dynamodbav:"scopes"`
	ResponseType string   `json:"responseType" dynamodbav:"responseType"`
}

var (
	platformsTable = os.Getenv("PLATFORMS_TABLE")
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

	// Try to get platformId first (for consistency), then fall back to id
	platformID := event.PathParameters["platformId"]
	if platformID == "" {
		platformID = event.PathParameters["id"]
	}
	if platformID == "" {
		return createErrorResponse(400, "Platform ID is required"), nil
	}

	log.Printf("Get platform request: %s", platformID)

	// Add platform: prefix if not present
	if len(platformID) < 9 || platformID[:9] != "platform:" {
		platformID = "platform:" + platformID
	}

	// Get table name from environment
	if platformsTable == "" {
		platformsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}

	// Get platform
	platform, err := getPlatform(platformID)
	if err != nil {
		log.Printf("Failed to get platform %s: %v", platformID, err)
		if err.Error() == "item not found" {
			return createErrorResponse(404, "Platform not found"), nil
		}
		return createErrorResponse(500, "Failed to get platform"), nil
	}

	// Remove sensitive OAuth client secrets from response
	if platform.OAuth != nil {
		platform.OAuth = &OAuthConfiguration{
			AuthURL:      platform.OAuth.AuthURL,
			Scopes:       platform.OAuth.Scopes,
			ResponseType: platform.OAuth.ResponseType,
		}
	}

	return createSuccessResponse(Response{
		Success: true,
		Data:    platform,
	}), nil
}

func getPlatform(platformID string) (*Platform, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(platformsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"platformId": {
				S: aws.String(platformID),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("item not found")
	}

	var platform Platform
	err = dynamodbattribute.UnmarshalMap(result.Item, &platform)
	if err != nil {
		return nil, err
	}

	return &platform, nil
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