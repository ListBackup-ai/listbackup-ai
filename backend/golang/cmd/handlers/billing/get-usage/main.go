package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/internal/util"
)

type GetUsageResponse struct {
	BillingPeriod string                  `json:"billingPeriod"`
	Usage         []types.UsageRecord     `json:"usage"`
	Summary       UsageSummary            `json:"summary"`
	PlanLimits    *types.PlanLimits       `json:"planLimits"`
}

type UsageSummary struct {
	APICallsTotal      int64 `json:"apiCallsTotal"`
	StorageGBTotal     int64 `json:"storageGbTotal"`
	BackupsTotal       int64 `json:"backupsTotal"`
	SourcesTotal       int64 `json:"sourcesTotal"`
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
	log.Printf("Get usage request: %+v", event)

	// Extract auth context
	userID, accountID := extractAuthContext(event)
	if userID == "" || accountID == "" {
		return util.CreateErrorResponse(401, "Unauthorized")
	}

	// Get billing period from query parameters (default to current month)
	billingPeriod := event.QueryStringParameters["period"]
	if billingPeriod == "" {
		billingPeriod = time.Now().Format("2006-01")
	}

	// Validate billing period format
	if !isValidBillingPeriod(billingPeriod) {
		return util.CreateErrorResponse(400, "Invalid billing period format. Use YYYY-MM")
	}

	// Get usage records for the period
	usage, err := billingService.GetUsageForPeriod(ctx, accountID, billingPeriod)
	if err != nil {
		log.Printf("Failed to get usage: %v", err)
		return util.CreateErrorResponse(500, "Failed to get usage data")
	}

	// Calculate usage summary
	summary := calculateUsageSummary(usage)

	// Get plan limits
	planLimits, err := billingService.CheckPlanLimits(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get plan limits: %v", err)
		planLimits = nil // Don't fail the request for this
	}

	response := GetUsageResponse{
		BillingPeriod: billingPeriod,
		Usage:         usage,
		Summary:       summary,
		PlanLimits:    planLimits,
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

func isValidBillingPeriod(period string) bool {
	// Validate YYYY-MM format
	_, err := time.Parse("2006-01", period)
	return err == nil
}

func calculateUsageSummary(usage []types.UsageRecord) UsageSummary {
	summary := UsageSummary{}
	
	for _, record := range usage {
		switch record.MetricType {
		case "api_calls":
			summary.APICallsTotal += record.Quantity
		case "storage_gb":
			summary.StorageGBTotal += record.Quantity
		case "backups":
			summary.BackupsTotal += record.Quantity
		case "sources":
			summary.SourcesTotal += record.Quantity
		}
	}
	
	return summary
}

func main() {
	lambda.Start(handler)
}