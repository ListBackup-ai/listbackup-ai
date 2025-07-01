package main

import (
	"encoding/json"
	"log"
	"os"
	"sort"

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
	log.Printf("List platform sources called with method: %s", event.RequestContext.HTTP.Method)

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
	if platformId == "" {
		return createErrorResponse(400, "Platform ID is required"), nil
	}

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

	log.Printf("List platform sources request for platform: %s", platformId)

	// Get query parameters for filtering
	category := event.QueryStringParameters["category"]
	dataType := event.QueryStringParameters["dataType"]
	status := event.QueryStringParameters["status"]
	popularSort := event.QueryStringParameters["popular"] == "true"

	var platformSources []PlatformSource
	var err error

	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	if category != "" {
		// Filter by category using GSI
		platformSources, err = queryByGSI(svc, "CategoryIndex", "category", category)
		if err == nil {
			platformSources = filterByPlatform(platformSources, platformId)
		}
	} else if dataType != "" {
		// Filter by data type using GSI
		platformSources, err = queryByGSI(svc, "DataTypeIndex", "dataType", dataType)
		if err == nil {
			platformSources = filterByPlatform(platformSources, platformId)
		}
	} else if status != "" {
		// Filter by status using GSI
		platformSources, err = queryByGSIWithReservedWord(svc, "StatusIndex", "status", status)
		if err == nil {
			platformSources = filterByPlatform(platformSources, platformId)
		}
	} else if popularSort {
		// Sort by popularity using GSI
		platformSources, err = queryByGSI(svc, "PopularityIndex", "platformId", platformId)
	} else {
		// Get all platform sources for this platform
		platformSources, err = queryByGSI(svc, "PlatformIndex", "platformId", platformId)
	}

	if err != nil {
		log.Printf("Failed to list platform sources: %v", err)
		return createErrorResponse(500, "Failed to list platform sources"), nil
	}

	// Sort by popularity if not already sorted by GSI
	if !popularSort && len(platformSources) > 0 {
		sort.Slice(platformSources, func(i, j int) bool {
			return platformSources[i].Popularity > platformSources[j].Popularity
		})
	}

	log.Printf("Found %d platform sources for platform %s", len(platformSources), platformId)
	
	response := Response{
		Success: true,
		Data: map[string]interface{}{
			"platformSources": platformSources,
			"total":          len(platformSources),
			"platformId":     platformId,
		},
	}
	
	return createSuccessResponse(response), nil
}

func queryByGSI(svc *dynamodb.DynamoDB, indexName, attributeName, attributeValue string) ([]PlatformSource, error) {
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key(attributeName).Equal(expression.Value(attributeValue))).
		Build()
	if err != nil {
		return nil, err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(platformSourcesTable),
		IndexName:                 aws.String(indexName),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return nil, err
	}

	var sources []PlatformSource
	for _, item := range result.Items {
		var source PlatformSource
		if err := dynamodbattribute.UnmarshalMap(item, &source); err != nil {
			continue
		}
		sources = append(sources, source)
	}

	return sources, nil
}

func queryByGSIWithReservedWord(svc *dynamodb.DynamoDB, indexName, attributeName, attributeValue string) ([]PlatformSource, error) {
	result, err := svc.Query(&dynamodb.QueryInput{
		TableName: aws.String(platformSourcesTable),
		IndexName: aws.String(indexName),
		KeyConditionExpression: aws.String("#status = :status"),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":status": {
				S: aws.String(attributeValue),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	var sources []PlatformSource
	for _, item := range result.Items {
		var source PlatformSource
		if err := dynamodbattribute.UnmarshalMap(item, &source); err != nil {
			continue
		}
		sources = append(sources, source)
	}

	return sources, nil
}

func filterByPlatform(sources []PlatformSource, platformId string) []PlatformSource {
	var filtered []PlatformSource
	for _, source := range sources {
		if source.PlatformID == platformId {
			filtered = append(filtered, source)
		}
	}
	return filtered
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