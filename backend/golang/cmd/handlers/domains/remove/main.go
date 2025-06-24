package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

type RemoveDomainResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

var (
	domainsTable = os.Getenv("DOMAINS_TABLE")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("=== REMOVE DOMAIN FUNCTION START ===")
	log.Printf("Remove domain function called with method: %s", event.RequestContext.HTTP.Method)

	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract auth context from event
	var userID, accountID string
	
	// Extract user ID from JWT authorizer context
	if event.RequestContext.Authorizer != nil && event.RequestContext.Authorizer.JWT != nil {
		claims := event.RequestContext.Authorizer.JWT.Claims
		if sub, ok := claims["sub"]; ok {
			userID = "user:" + sub
		}
		// For domains, we need accountId - this would be set by custom authorizer
		// For now, generate a default account
		if userID != "" {
			accountID = "account:default"
		}
	}

	if userID == "" || accountID == "" {
		log.Printf("ERROR: Missing auth context - userID: %s, accountID: %s", userID, accountID)
		return createErrorResponse(401, "Unauthorized"), nil
	}

	// Validate environment variables
	if domainsTable == "" {
		log.Printf("ERROR: Missing DOMAINS_TABLE configuration")
		return createErrorResponse(500, "Domain service not configured"), nil
	}

	// Get domain ID from path parameters
	domainID := event.PathParameters["domainId"]
	if domainID == "" {
		return createErrorResponse(400, "Domain ID is required"), nil
	}

	log.Printf("Remove domain request validated - Domain ID: %s", domainID)

	// Create AWS session
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		log.Printf("Failed to create AWS session: %v", err)
		return createErrorResponse(500, "Domain removal failed"), nil
	}

	// Create AWS service clients
	dynamoClient := dynamodb.New(sess)

	// Delete domain from DynamoDB
	_, err = dynamoClient.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(domainsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"domainId": {
				S: aws.String(domainID),
			},
		},
		ConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {
				S: aws.String(accountID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to delete domain record: %v", err)
		return createErrorResponse(500, "Domain removal failed"), nil
	}

	log.Printf("Domain deleted successfully: %s", domainID)

	// Success response
	response := RemoveDomainResponse{
		Success: true,
		Message: "Domain removed successfully",
		Data: map[string]interface{}{
			"domainId": domainID,
			"message":  fmt.Sprintf("Domain %s has been removed", domainID),
		},
	}

	responseJSON, _ := json.Marshal(response)
	log.Printf("Domain removal successful: %s", domainID)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}, nil
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := RemoveDomainResponse{
		Success: false,
		Error:   message,
	}
	responseJSON, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}
}

func main() {
	lambda.Start(Handle)
}