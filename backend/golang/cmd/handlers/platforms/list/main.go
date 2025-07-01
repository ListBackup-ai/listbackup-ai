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
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
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
	log.Printf("List platforms request")

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

	// Get table name from environment
	if platformsTable == "" {
		platformsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}

	// Get query parameters
	category := event.QueryStringParameters["category"]
	status := event.QueryStringParameters["status"]

	// List platforms
	platforms, err := listPlatforms(category, status)
	if err != nil {
		log.Printf("Failed to list platforms: %v", err)
		return createErrorResponse(500, "Failed to list platforms"), nil
	}

	// Remove sensitive OAuth client secrets from response
	for i := range platforms {
		if platforms[i].OAuth != nil {
			// Keep only public OAuth config
			platforms[i].OAuth = &OAuthConfiguration{
				AuthURL:      platforms[i].OAuth.AuthURL,
				Scopes:       platforms[i].OAuth.Scopes,
				ResponseType: platforms[i].OAuth.ResponseType,
			}
		}
	}

	log.Printf("Found %d platforms", len(platforms))
	return createSuccessResponse(Response{
		Success: true,
		Data: map[string]interface{}{
			"platforms": platforms,
			"total":     len(platforms),
		},
	}), nil
}

func listPlatforms(category, status string) ([]Platform, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	var platforms []Platform

	if category != "" {
		// Query by category using GSI
		expr, err := expression.NewBuilder().
			WithKeyCondition(expression.Key("category").Equal(expression.Value(category))).
			Build()
		if err != nil {
			return nil, err
		}

		result, err := svc.Query(&dynamodb.QueryInput{
			TableName:                 aws.String(platformsTable),
			IndexName:                 aws.String("CategoryIndex"),
			KeyConditionExpression:    expr.KeyCondition(),
			ExpressionAttributeNames:  expr.Names(),
			ExpressionAttributeValues: expr.Values(),
		})
		if err != nil {
			return nil, err
		}

		for _, item := range result.Items {
			var platform Platform
			if err := dynamodbattribute.UnmarshalMap(item, &platform); err != nil {
				log.Printf("Error unmarshaling platform: %v", err)
				continue
			}
			platforms = append(platforms, platform)
		}
	} else if status != "" {
		// Query by status using GSI
		expr, err := expression.NewBuilder().
			WithKeyCondition(expression.Key("status").Equal(expression.Value(status))).
			Build()
		if err != nil {
			return nil, err
		}

		result, err := svc.Query(&dynamodb.QueryInput{
			TableName:                 aws.String(platformsTable),
			IndexName:                 aws.String("StatusIndex"),
			KeyConditionExpression:    expr.KeyCondition(),
			ExpressionAttributeNames:  expr.Names(),
			ExpressionAttributeValues: expr.Values(),
		})
		if err != nil {
			return nil, err
		}

		for _, item := range result.Items {
			var platform Platform
			if err := dynamodbattribute.UnmarshalMap(item, &platform); err != nil {
				log.Printf("Error unmarshaling platform: %v", err)
				continue
			}
			platforms = append(platforms, platform)
		}
	} else {
		// Scan all platforms
		result, err := svc.Scan(&dynamodb.ScanInput{
			TableName: aws.String(platformsTable),
		})
		if err != nil {
			return nil, err
		}

		for _, item := range result.Items {
			var platform Platform
			if err := dynamodbattribute.UnmarshalMap(item, &platform); err != nil {
				log.Printf("Error unmarshaling platform: %v", err)
				continue
			}
			platforms = append(platforms, platform)
		}
	}

	return platforms, nil
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