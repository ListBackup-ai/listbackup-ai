package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/acm"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/route53"
	"github.com/aws/aws-sdk-go/service/s3"

	"github.com/listbackup/api/internal/services"
)

type VerifyDomainHandler struct {
	domainService *services.DomainService
}

func NewVerifyDomainHandler() (*VerifyDomainHandler, error) {
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

	// Create AWS service clients
	db := dynamodb.New(sess)
	acmClient := acm.New(sess)
	route53Client := route53.New(sess)
	s3Client := s3.New(sess)

	// Get environment variables
	domainsTable := os.Getenv("DOMAINS_TABLE")
	brandingTable := os.Getenv("BRANDING_TABLE")
	verificationTable := os.Getenv("DOMAIN_VERIFICATION_TABLE")
	hostedZoneID := os.Getenv("HOSTED_ZONE_ID")

	// Create domain service
	domainService := services.NewDomainService(db, acmClient, route53Client, s3Client, domainsTable, brandingTable, verificationTable, hostedZoneID)

	return &VerifyDomainHandler{domainService: domainService}, nil
}

func (h *VerifyDomainHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Verify domain request started")

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

	// Get domain ID from path parameters
	domainID := event.PathParameters["domainId"]
	if domainID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Domain ID is required"}`,
		}, nil
	}

	log.Printf("Verifying domain: %s for account: %s", domainID, accountID)

	// Use domain service to verify domain
	err := h.domainService.VerifyDomain(ctx, domainID, accountID)
	if err != nil {
		log.Printf("Failed to verify domain: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to verify domain"}`,
		}, nil
	}

	// Get updated domain information
	domain, err := h.domainService.GetDomain(ctx, domainID, accountID)
	if err != nil {
		log.Printf("Failed to get domain after verification: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to get domain status"}`,
		}, nil
	}

	// Build response
	responseData := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"domainId":           domain.DomainID,
			"domainName":         domain.DomainName,
			"verificationStatus": domain.VerificationStatus,
			"status":             domain.Status,
			"sslStatus":          domain.SSLStatus,
			"updatedAt":          domain.UpdatedAt,
		},
		"message": "Domain verification checked",
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
	handler, err := NewVerifyDomainHandler()
	if err != nil {
		log.Fatalf("Failed to create verify domain handler: %v", err)
	}

	lambda.Start(handler.Handle)
}