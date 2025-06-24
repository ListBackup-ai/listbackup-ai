package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type DNSInstructionsResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("=== GET DNS INSTRUCTIONS FUNCTION START ===")
	log.Printf("Get DNS instructions function called with method: %s", event.RequestContext.HTTP.Method)

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

	// Extract auth context from event
	var userID, accountID string
	
	// Extract user ID from JWT authorizer context
	if event.RequestContext.Authorizer != nil && event.RequestContext.Authorizer.JWT != nil {
		claims := event.RequestContext.Authorizer.JWT.Claims
		if sub, ok := claims["sub"]; ok {
			userID = "user:" + sub
		}
		if userID != "" {
			accountID = "account:default"
		}
	}

	if userID == "" || accountID == "" {
		log.Printf("ERROR: Missing auth context - userID: %s, accountID: %s", userID, accountID)
		return createErrorResponse(401, "Unauthorized"), nil
	}

	// Get domain ID from path parameters
	domainID := event.PathParameters["domainId"]
	if domainID == "" {
		return createErrorResponse(400, "Domain ID is required"), nil
	}

	log.Printf("Get DNS instructions request validated - Domain ID: %s", domainID)

	// Return DNS instructions (stub implementation)
	response := DNSInstructionsResponse{
		Success: true,
		Message: "DNS instructions retrieved successfully",
		Data: map[string]interface{}{
			"domainId": domainID,
			"instructions": "To verify domain ownership, add the following DNS records to your domain:",
			"records": []map[string]interface{}{
				{
					"type":  "TXT",
					"name":  "_listbackup-verification",
					"value": "listbackup-verification=abc123",
					"ttl":   300,
				},
			},
			"steps": []string{
				"1. Log in to your domain registrar or DNS provider",
				"2. Navigate to DNS management",
				"3. Add the TXT record shown above",
				"4. Wait for DNS propagation (up to 48 hours)",
				"5. Return to verify your domain",
			},
		},
	}

	responseJSON, _ := json.Marshal(response)
	log.Printf("DNS instructions retrieved successfully for domain: %s", domainID)
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
	response := DNSInstructionsResponse{
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