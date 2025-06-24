package main

import (
	"context"
	"encoding/json"
	"io"
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
	log.Printf("Stripe webhook request received")

	// Get Stripe signature from headers
	stripeSignature := event.Headers["stripe-signature"]
	if stripeSignature == "" {
		stripeSignature = event.Headers["Stripe-Signature"]
	}
	
	if stripeSignature == "" {
		log.Printf("Missing Stripe signature header")
		return util.CreateErrorResponse(400, "Missing Stripe signature")
	}

	// Get webhook payload
	payload := []byte(event.Body)
	if len(payload) == 0 {
		log.Printf("Empty webhook payload")
		return util.CreateErrorResponse(400, "Empty payload")
	}

	// Process the webhook
	err := stripeService.HandleWebhook(ctx, payload, stripeSignature)
	if err != nil {
		log.Printf("Failed to process webhook: %v", err)
		return util.CreateErrorResponse(500, "Failed to process webhook")
	}

	// Parse the webhook event to handle specific business logic
	var webhookEvent map[string]interface{}
	if err := json.Unmarshal(payload, &webhookEvent); err != nil {
		log.Printf("Failed to parse webhook JSON: %v", err)
		// Still return success since we processed it above
		return successResponse()
	}

	eventType, _ := webhookEvent["type"].(string)
	log.Printf("Processing webhook event type: %s", eventType)

	// Handle specific event types for additional business logic
	switch eventType {
	case "customer.subscription.created":
		err = handleSubscriptionCreated(ctx, webhookEvent)
	case "customer.subscription.updated":
		err = handleSubscriptionUpdated(ctx, webhookEvent)
	case "customer.subscription.deleted":
		err = handleSubscriptionDeleted(ctx, webhookEvent)
	case "invoice.payment_succeeded":
		err = handlePaymentSucceeded(ctx, webhookEvent)
	case "invoice.payment_failed":
		err = handlePaymentFailed(ctx, webhookEvent)
	case "customer.subscription.trial_will_end":
		err = handleTrialWillEnd(ctx, webhookEvent)
	default:
		log.Printf("Unhandled webhook event type: %s", eventType)
	}

	if err != nil {
		log.Printf("Failed to handle webhook event %s: %v", eventType, err)
		// Still return success to prevent Stripe retries for business logic errors
	}

	return successResponse()
}

func handleSubscriptionCreated(ctx context.Context, event map[string]interface{}) error {
	log.Printf("Handling subscription created event")
	
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return nil
	}
	
	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return nil
	}

	// Extract subscription details
	subscriptionID, _ := object["id"].(string)
	customerID, _ := object["customer"].(string)
	
	log.Printf("Subscription created: %s for customer: %s", subscriptionID, customerID)
	
	// Additional business logic here
	// e.g., send welcome email, setup account features, etc.
	
	return nil
}

func handleSubscriptionUpdated(ctx context.Context, event map[string]interface{}) error {
	log.Printf("Handling subscription updated event")
	
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return nil
	}
	
	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return nil
	}

	// Extract subscription details
	subscriptionID, _ := object["id"].(string)
	status, _ := object["status"].(string)
	
	log.Printf("Subscription updated: %s, status: %s", subscriptionID, status)
	
	// Update user groups based on new plan
	if metadata, ok := object["metadata"].(map[string]interface{}); ok {
		if accountID, ok := metadata["accountId"].(string); ok {
			if userID, ok := metadata["userId"].(string); ok {
				// Get new plan from subscription items
				if items, ok := object["items"].(map[string]interface{}); ok {
					if itemsData, ok := items["data"].([]interface{}); ok && len(itemsData) > 0 {
						if item, ok := itemsData[0].(map[string]interface{}); ok {
							if price, ok := item["price"].(map[string]interface{}); ok {
								if priceID, ok := price["id"].(string); ok {
									planID := extractPlanIDFromPrice(priceID)
									err := cognitoService.AssignUserToGroupByPlan(ctx, userID, planID)
									if err != nil {
										log.Printf("Failed to update user group: %v", err)
									}
								}
							}
						}
					}
				}
			}
		}
	}
	
	return nil
}

func handleSubscriptionDeleted(ctx context.Context, event map[string]interface{}) error {
	log.Printf("Handling subscription deleted event")
	
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return nil
	}
	
	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return nil
	}

	// Extract subscription details
	subscriptionID, _ := object["id"].(string)
	
	log.Printf("Subscription deleted: %s", subscriptionID)
	
	// Move user to free tier
	if metadata, ok := object["metadata"].(map[string]interface{}); ok {
		if userID, ok := metadata["userId"].(string); ok {
			err := cognitoService.AssignUserToGroupByPlan(ctx, userID, "plan_free")
			if err != nil {
				log.Printf("Failed to move user to free group: %v", err)
			}
		}
	}
	
	return nil
}

func handlePaymentSucceeded(ctx context.Context, event map[string]interface{}) error {
	log.Printf("Handling payment succeeded event")
	
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return nil
	}
	
	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return nil
	}

	// Extract invoice details
	invoiceID, _ := object["id"].(string)
	customerID, _ := object["customer"].(string)
	amountPaid, _ := object["amount_paid"].(float64)
	
	log.Printf("Payment succeeded for invoice: %s, customer: %s, amount: %.2f", invoiceID, customerID, amountPaid/100)
	
	// Record successful payment
	// Send receipt email
	// Update account status if needed
	
	return nil
}

func handlePaymentFailed(ctx context.Context, event map[string]interface{}) error {
	log.Printf("Handling payment failed event")
	
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return nil
	}
	
	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return nil
	}

	// Extract invoice details
	invoiceID, _ := object["id"].(string)
	customerID, _ := object["customer"].(string)
	
	log.Printf("Payment failed for invoice: %s, customer: %s", invoiceID, customerID)
	
	// Send payment failure notification
	// Update account status
	// Trigger retry logic if applicable
	
	return nil
}

func handleTrialWillEnd(ctx context.Context, event map[string]interface{}) error {
	log.Printf("Handling trial will end event")
	
	data, ok := event["data"].(map[string]interface{})
	if !ok {
		return nil
	}
	
	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return nil
	}

	// Extract subscription details
	subscriptionID, _ := object["id"].(string)
	customerID, _ := object["customer"].(string)
	
	log.Printf("Trial will end for subscription: %s, customer: %s", subscriptionID, customerID)
	
	// Send trial ending notification
	// Prompt user to add payment method
	
	return nil
}

func extractPlanIDFromPrice(priceID string) string {
	// Map Stripe price IDs to our plan IDs
	switch priceID {
	case "price_starter_monthly", "price_starter_yearly":
		return "plan_starter"
	case "price_pro_monthly", "price_pro_yearly":
		return "plan_pro"
	case "price_enterprise_monthly", "price_enterprise_yearly":
		return "plan_enterprise"
	default:
		return "plan_free"
	}
}

func successResponse() (events.APIGatewayProxyResponse, error) {
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: `{"status": "success"}`,
	}, nil
}

func main() {
	lambda.Start(handler)
}