package main

import (
	"context"
	"encoding/json"
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

type CancelSubscriptionRequest struct {
	CancelAtPeriodEnd bool   `json:"cancelAtPeriodEnd"`
	CancellationReason string `json:"cancellationReason,omitempty"`
}

type CancelSubscriptionResponse struct {
	SubscriptionID    string `json:"subscriptionId"`
	Status            string `json:"status"`
	CancelAtPeriodEnd bool   `json:"cancelAtPeriodEnd"`
	Message           string `json:"message"`
}

var (
	billingService *services.BillingService
	stripeService  *services.StripeService
	cognitoService *services.CognitoGroupsService
	tableName      string
	userPoolID     string
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
	log.Printf("Cancel subscription request: %+v", event)

	// Extract auth context
	userID, accountID := extractAuthContext(event)
	if userID == "" || accountID == "" {
		return util.CreateErrorResponse(401, "Unauthorized")
	}

	// Parse request body
	var req CancelSubscriptionRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return util.CreateErrorResponse(400, "Invalid request body")
	}

	// Get current subscription
	subscription, err := billingService.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get subscription: %v", err)
		return util.CreateErrorResponse(404, "Subscription not found")
	}

	// Check if subscription is already canceled
	if subscription.Status == "canceled" {
		return util.CreateErrorResponse(409, "Subscription is already canceled")
	}

	// Cancel subscription in Stripe
	err = stripeService.CancelSubscription(ctx, subscription.StripeSubID, req.CancelAtPeriodEnd)
	if err != nil {
		log.Printf("Failed to cancel Stripe subscription: %v", err)
		return util.CreateErrorResponse(500, "Failed to cancel subscription")
	}

	// Update subscription in database
	err = billingService.CancelSubscription(ctx, subscription.SubscriptionID, req.CancelAtPeriodEnd)
	if err != nil {
		log.Printf("Failed to update subscription: %v", err)
		return util.CreateErrorResponse(500, "Failed to update subscription")
	}

	// If immediate cancellation, move user to free tier
	if !req.CancelAtPeriodEnd {
		err = cognitoService.AssignUserToGroupByPlan(ctx, userID, "plan_free")
		if err != nil {
			log.Printf("Failed to assign user to free group: %v", err)
			// Don't fail the cancellation for this
		}
	}

	// Record cancellation event
	err = billingService.RecordUsage(ctx, accountID, subscription.SubscriptionID, "subscription_canceled", 1)
	if err != nil {
		log.Printf("Failed to record cancellation usage: %v", err)
	}

	// Determine response message
	var message string
	if req.CancelAtPeriodEnd {
		message = "Subscription will be canceled at the end of the current billing period"
	} else {
		message = "Subscription has been canceled immediately"
	}

	response := CancelSubscriptionResponse{
		SubscriptionID:    subscription.SubscriptionID,
		Status:            "canceled",
		CancelAtPeriodEnd: req.CancelAtPeriodEnd,
		Message:           message,
	}

	responseBody, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
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

func main() {
	lambda.Start(handler)
}