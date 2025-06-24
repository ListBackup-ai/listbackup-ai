package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"

	"github.com/listbackup/api/internal/types"
)

type AddDomainHandler struct {
	db           *dynamodb.DynamoDB
	domainsTable string
}

func NewAddDomainHandler() (*AddDomainHandler, error) {
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

	// Get environment variables
	domainsTable := os.Getenv("DOMAINS_TABLE")
	if domainsTable == "" {
		domainsTable = "listbackup-main-domains"
	}

	return &AddDomainHandler{
		db:           db,
		domainsTable: domainsTable,
	}, nil
}

func (h *AddDomainHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Add domain request started")

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

	// Parse request body
	var req types.AddDomainRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("JSON parse error: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Invalid JSON format in request body"}`,
		}, nil
	}

	// Validate required fields
	if req.DomainName == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Domain name is required"}`,
		}, nil
	}

	// Set default domain type if not provided
	if req.DomainType == "" {
		req.DomainType = "site"
	}

	// Validate domain type
	validTypes := []string{"site", "api", "mail"}
	validType := false
	for _, t := range validTypes {
		if req.DomainType == t {
			validType = true
			break
		}
	}
	if !validType {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Invalid domain type. Must be: site, api, or mail"}`,
		}, nil
	}

	log.Printf("Adding domain: %s, type: %s for account: %s", req.DomainName, req.DomainType, accountID)

	// Generate domain ID
	domainID := uuid.New().String()

	// Create domain object  
	domain := types.Domain{
		DomainID:           domainID,
		AccountID:          accountID,
		DomainName:         req.DomainName,
		DomainType:         req.DomainType,
		BrandingID:         req.BrandingID,
		Status:             "pending",
		VerificationStatus: "pending",
		SSLStatus:          "pending",
		Configuration:      req.Configuration,
		CreatedAt:          time.Now(),
		CreatedBy:          userID,
		UpdatedAt:          time.Now(),
		UpdatedBy:          userID,
		DNSRecords:         []types.DNSRecord{},
	}

	// Save domain to DynamoDB
	domainItem, err := dynamodbattribute.MarshalMap(domain)
	if err != nil {
		log.Printf("Failed to marshal domain: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to add domain"}`,
		}, nil
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(h.domainsTable),
		Item:      domainItem,
	})
	if err != nil {
		log.Printf("Failed to create domain record: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to add domain"}`,
		}, nil
	}

	log.Printf("Domain created successfully: %s", domainID)

	// Build response
	domainResponse := map[string]interface{}{
		"domainId":           domain.DomainID,
		"domainName":         domain.DomainName,
		"domainType":         domain.DomainType,
		"status":             domain.Status,
		"verificationStatus": domain.VerificationStatus,
		"sslStatus":          domain.SSLStatus,
		"createdAt":          domain.CreatedAt,
		"verificationRequired": true,
		"instructions":       "Domain has been added. Verification will be available in the DNS instructions endpoint.",
	}

	responseData := map[string]interface{}{
		"success": true,
		"data":    domainResponse,
		"message": "Domain added successfully",
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
		StatusCode: 201,
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
	handler, err := NewAddDomainHandler()
	if err != nil {
		log.Fatalf("Failed to create domain handler: %v", err)
	}

	lambda.Start(handler.Handle)
}