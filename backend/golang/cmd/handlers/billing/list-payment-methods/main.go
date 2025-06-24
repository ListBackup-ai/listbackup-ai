package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/util"
)

type ListPaymentMethodsResponse struct {
	PaymentMethods []services.StripePaymentMethod `json:"paymentMethods"`
}

var (
	billingService *services.BillingService
	stripeService  *services.StripeService
	tableName      string
)

func init() {
	tableName = os.Getenv("DYNAMODB_TABLE")
	
	if tableName == "" {
		log.Fatal("DYNAMODB_TABLE environment variable is required")
	}

	// Initialize AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}

	// Initialize services
	dynamoClient := dynamodb.NewFromConfig(cfg)
	billingService = services.NewBillingService(dynamoClient, tableName)
	stripeService = services.NewStripeService(billingService)
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List payment methods request: %+v", event)

	// Extract auth context
	userID, accountID := extractAuthContext(event)
	if userID == "" || accountID == "" {
		return util.CreateErrorResponse(401, "Unauthorized")
	}

	// Get billing customer
	customer, err := billingService.GetBillingCustomer(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get billing customer: %v", err)
		return util.CreateErrorResponse(404, "Billing customer not found")
	}

	// Get payment methods from Stripe
	paymentMethods, err := stripeService.ListPaymentMethods(ctx, customer.StripeCustomerID)
	if err != nil {
		log.Printf("Failed to list payment methods: %v", err)
		return util.CreateErrorResponse(500, "Failed to get payment methods")
	}

	response := ListPaymentMethodsResponse{
		PaymentMethods: paymentMethods,
	}

	responseBody, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Methods": "GET,OPTIONS",
		},
		Body: string(responseBody),
	}, nil
}

func extractAuthContext(event events.APIGatewayProxyRequest) (string, string) {
	var userID, accountID string

	// Try lambda authorizer context first
	if event.RequestContext.Authorizer.Lambda != nil {
		if lambdaContext, ok := event.RequestContext.Authorizer.Lambda.(map[string]interface{}); ok {
			if uid, exists := lambdaContext["userId"]; exists {
				if uidStr, ok := uid.(string); ok {
					userID = uidStr
				}
			}
			if aid, exists := lambdaContext["accountId"]; exists {
				if aidStr, ok := aid.(string); ok {
					accountID = aidStr
				}
			}
		}
	}

	// Fallback to direct authorizer context
	if userID == "" {
		if uid, exists := event.RequestContext.Authorizer["userId"]; exists {
			if uidStr, ok := uid.(string); ok {
				userID = uidStr
			}
		}
	}
	if accountID == "" {
		if aid, exists := event.RequestContext.Authorizer["accountId"]; exists {
			if aidStr, ok := aid.(string); ok {
				accountID = aidStr
			}
		}
	}

	return userID, accountID
}

func main() {
	lambda.Start(handler)
}