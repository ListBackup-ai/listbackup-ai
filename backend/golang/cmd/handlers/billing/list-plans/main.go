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
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/internal/util"
)

type ListPlansResponse struct {
	Plans []types.BillingPlan `json:"plans"`
}

var (
	billingService *services.BillingService
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
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List plans request: %+v", event)

	// This endpoint doesn't require authentication as it's public pricing info
	// But we can still extract auth context if available
	userID, accountID := extractAuthContext(event)
	log.Printf("User context: userID=%s, accountID=%s", userID, accountID)

	// Get all active billing plans
	plans, err := billingService.ListBillingPlans(ctx)
	if err != nil {
		log.Printf("Failed to list billing plans: %v", err)
		return util.CreateErrorResponse(500, "Failed to get billing plans")
	}

	// Sort plans by popularity or price if needed
	sortedPlans := sortPlansByPopularity(plans)

	response := ListPlansResponse{
		Plans: sortedPlans,
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

func sortPlansByPopularity(plans []types.BillingPlan) []types.BillingPlan {
	// Sort plans by popularity flag and then by amount
	// Popular plans first, then by increasing price
	
	var popularPlans []types.BillingPlan
	var regularPlans []types.BillingPlan
	
	for _, plan := range plans {
		if plan.Popular {
			popularPlans = append(popularPlans, plan)
		} else {
			regularPlans = append(regularPlans, plan)
		}
	}
	
	// Simple bubble sort by amount (for small arrays this is fine)
	for i := 0; i < len(popularPlans); i++ {
		for j := i + 1; j < len(popularPlans); j++ {
			if popularPlans[i].Amount > popularPlans[j].Amount {
				popularPlans[i], popularPlans[j] = popularPlans[j], popularPlans[i]
			}
		}
	}
	
	for i := 0; i < len(regularPlans); i++ {
		for j := i + 1; j < len(regularPlans); j++ {
			if regularPlans[i].Amount > regularPlans[j].Amount {
				regularPlans[i], regularPlans[j] = regularPlans[j], regularPlans[i]
			}
		}
	}
	
	// Combine popular plans first, then regular plans
	result := append(popularPlans, regularPlans...)
	return result
}

func main() {
	lambda.Start(handler)
}