package main

import (
	"encoding/json"
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

type PlatformSource struct {
	PlatformSourceID string   `json:"platformSourceId" dynamodbav:"platformSourceId"`
	PlatformID       string   `json:"platformId" dynamodbav:"platformId"`
	Name             string   `json:"name" dynamodbav:"name"`
	Description      string   `json:"description" dynamodbav:"description"`
	Category         string   `json:"category" dynamodbav:"category"`
	DataType         string   `json:"dataType" dynamodbav:"dataType"`
	Status           string   `json:"status" dynamodbav:"status"`
	Popularity       int      `json:"popularity" dynamodbav:"popularity"`
	Features         []string `json:"features" dynamodbav:"features"`
	RequiredScopes   []string `json:"requiredScopes" dynamodbav:"requiredScopes"`
	DataPoints       []string `json:"dataPoints" dynamodbav:"dataPoints"`
	CreatedAt        string   `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        string   `json:"updatedAt" dynamodbav:"updatedAt"`
}

var platformSourcesTable = os.Getenv("PLATFORM_SOURCES_TABLE")

func Handle(event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Get platform source called with method: %s", event.RequestContext.HTTP.Method)

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

	platformId := event.PathParameters["platformId"]
	platformSourceId := event.PathParameters["platformSourceId"]
	
	if platformId == "" {
		return createErrorResponse(400, "Platform ID is required"), nil
	}
	if platformSourceId == "" {
		return createErrorResponse(400, "Platform Source ID is required"), nil
	}

	// Add prefixes if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}
	if len(platformSourceId) < 16 || platformSourceId[:16] != "platform-source:" {
		platformSourceId = "platform-source:" + platformSourceId
	}

	log.Printf("Get platform source request: %s from platform %s", platformSourceId, platformId)

	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Get platform source
	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(platformSourcesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"platformSourceId": {
				S: aws.String(platformSourceId),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get platform source %s: %v", platformSourceId, err)
		return createErrorResponse(500, "Failed to get platform source"), nil
	}

	if result.Item == nil {
		return createErrorResponse(404, "Platform source not found"), nil
	}

	var platformSource PlatformSource
	err = dynamodbattribute.UnmarshalMap(result.Item, &platformSource)
	if err != nil {
		log.Printf("Failed to unmarshal platform source: %v", err)
		return createErrorResponse(500, "Failed to parse platform source"), nil
	}

	// Verify the platform source belongs to the requested platform
	if platformSource.PlatformID != platformId {
		return createErrorResponse(404, "Platform source not found for this platform"), nil
	}

	response := Response{
		Success: true,
		Data:    platformSource,
	}

	return createSuccessResponse(response), nil
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