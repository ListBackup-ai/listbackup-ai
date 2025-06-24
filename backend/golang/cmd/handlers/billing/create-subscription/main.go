package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/util"
)

type CreateSubscriptionRequest struct {
	PlanID            string `json:"planId"`
	PaymentMethodID   string `json:"paymentMethodId"`
	BillingCycle      string `json:"billingCycle"` // monthly|yearly
}

type CreateSubscriptionResponse struct {
	SubscriptionID   string `json:"subscriptionId"`
	Status           string `json:"status"`
	ClientSecret     string `json:"clientSecret,omitempty"`
}

var (
	billingService     *services.BillingService
	stripeService      *services.StripeService
	cognitoService     *services.CognitoGroupsService
	tableName          string
	userPoolID         string
)

func init() {
	tableName = os.Getenv("DYNAMODB_TABLE")
	userPoolID = os.Getenv("COGNITO_USER_POOL_ID")
	
	if tableName == "" {
		log.Fatal("DYNAMODB_TABLE environment variable is required")
	}
	if userPoolID == "" {
		log.Fatal("COGNITO_USER_POOL_ID environment variable is required")
	}

	// Initialize AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}

	// Initialize services
	dynamoClient := dynamodb.NewFromConfig(cfg)
	cognitoClient := cognitoidentityprovider.NewFromConfig(cfg)
	
	billingService = services.NewBillingService(dynamoClient, tableName)
	stripeService = services.NewStripeService(billingService)
	cognitoService = services.NewCognitoGroupsService(cognitoClient, dynamoClient, userPoolID, tableName)
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Create subscription request: %+v", event)

	// Extract auth context
	userID, accountID := extractAuthContext(event)
	if userID == "" || accountID == "" {
		return util.CreateErrorResponse(401, "Unauthorized")
	}

	// Parse request body
	var req CreateSubscriptionRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return util.CreateErrorResponse(400, "Invalid request body")
	}

	// Validate required fields
	if req.PlanID == "" {
		return util.CreateErrorResponse(400, "planId is required")
	}
	if req.PaymentMethodID == "" {
		return util.CreateErrorResponse(400, "paymentMethodId is required")
	}
	if req.BillingCycle == "" {
		req.BillingCycle = "monthly"
	}

	// Check if account already has a subscription
	existingSubscription, err := billingService.GetSubscriptionByAccount(ctx, accountID)
	if err == nil && existingSubscription != nil {
		return util.CreateErrorResponse(409, "Account already has an active subscription")
	}

	// Get billing plan details
	plan, err := billingService.GetBillingPlan(ctx, req.PlanID)
	if err != nil {
		log.Printf("Failed to get billing plan: %v", err)
		return util.CreateErrorResponse(404, "Billing plan not found")
	}

	// Get or create Stripe customer
	customer, err := getOrCreateStripeCustomer(ctx, accountID, userID)
	if err != nil {
		log.Printf("Failed to get/create Stripe customer: %v", err)
		return util.CreateErrorResponse(500, "Failed to create customer")
	}

	// Attach payment method to customer
	err = stripeService.AttachPaymentMethod(ctx, req.PaymentMethodID, customer.ID)
	if err != nil {
		log.Printf("Failed to attach payment method: %v", err)
		return util.CreateErrorResponse(500, "Failed to attach payment method")
	}

	// Create Stripe subscription
	stripePrice := getStripePriceForPlan(plan.PlanID, req.BillingCycle)
	stripeSubscription, err := stripeService.CreateSubscription(ctx, customer.ID, stripePrice, accountID)
	if err != nil {
		log.Printf("Failed to create Stripe subscription: %v", err)
		return util.CreateErrorResponse(500, "Failed to create subscription")
	}

	// Create local subscription record
	subscription, err := billingService.CreateSubscription(ctx, accountID, req.PlanID, customer.ID, stripeSubscription.ID)
	if err != nil {
		log.Printf("Failed to create subscription record: %v", err)
		return util.CreateErrorResponse(500, "Failed to create subscription")
	}

	// Assign user to appropriate Cognito group
	err = cognitoService.AssignUserToGroupByPlan(ctx, userID, req.PlanID)
	if err != nil {
		log.Printf("Failed to assign user to Cognito group: %v", err)
		// Don't fail the subscription creation for this
	}

	// Record usage event
	err = billingService.RecordUsage(ctx, accountID, subscription.SubscriptionID, "subscription_created", 1)
	if err != nil {
		log.Printf("Failed to record usage: %v", err)
	}

	response := CreateSubscriptionResponse{
		SubscriptionID: subscription.SubscriptionID,
		Status:         subscription.Status,
	}

	responseBody, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Methods": "POST,OPTIONS",
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

func getOrCreateStripeCustomer(ctx context.Context, accountID, userID string) (*services.StripeCustomer, error) {
	// Try to get existing customer
	customer, err := billingService.GetBillingCustomer(ctx, accountID)
	if err == nil && customer != nil {
		// Return existing Stripe customer
		return stripeService.GetCustomer(ctx, customer.StripeCustomerID)
	}

	// Create new customer
	// In production, you'd get user details from user service
	email := fmt.Sprintf("user+%s@example.com", userID)
	name := fmt.Sprintf("User %s", userID)
	
	return stripeService.CreateCustomer(ctx, email, name, accountID)
}

func getStripePriceForPlan(planID, billingCycle string) string {
	// Map internal plan IDs to Stripe price IDs
	priceMap := map[string]map[string]string{
		"plan_starter": {
			"monthly": "price_starter_monthly",
			"yearly":  "price_starter_yearly",
		},
		"plan_pro": {
			"monthly": "price_pro_monthly",
			"yearly":  "price_pro_yearly",
		},
		"plan_enterprise": {
			"monthly": "price_enterprise_monthly",
			"yearly":  "price_enterprise_yearly",
		},
	}

	if planPrices, exists := priceMap[planID]; exists {
		if price, exists := planPrices[billingCycle]; exists {
			return price
		}
	}

	// Default to starter monthly
	return "price_starter_monthly"
}

func main() {
	lambda.Start(handler)
}