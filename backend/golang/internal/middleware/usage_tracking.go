package middleware

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/listbackup/api/internal/services"
)

// UsageTracker middleware for tracking API usage for billing
type UsageTracker struct {
	billingService *services.BillingService
	enabled        bool
}

// NewUsageTracker creates a new usage tracker middleware
func NewUsageTracker() *UsageTracker {
	tableName := os.Getenv("DYNAMODB_TABLE")
	enabled := os.Getenv("USAGE_TRACKING_ENABLED") != "false"
	
	if !enabled || tableName == "" {
		return &UsageTracker{enabled: false}
	}

	// Initialize AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Printf("Failed to load AWS config for usage tracking: %v", err)
		return &UsageTracker{enabled: false}
	}

	// Initialize billing service
	dynamoClient := dynamodb.NewFromConfig(cfg)
	billingService := services.NewBillingService(dynamoClient, tableName)

	return &UsageTracker{
		billingService: billingService,
		enabled:        true,
	}
}

// TrackAPICall tracks an API call for billing purposes
func (u *UsageTracker) TrackAPICall(ctx context.Context, event events.APIGatewayProxyRequest) {
	if !u.enabled {
		return
	}

	// Extract auth context
	userID, accountID := extractAuthContext(event)
	if userID == "" || accountID == "" {
		return // Don't track unauthenticated calls
	}

	// Get subscription for the account
	subscription, err := u.billingService.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get subscription for usage tracking: %v", err)
		return
	}

	// Record API call usage
	err = u.billingService.RecordUsage(ctx, accountID, subscription.SubscriptionID, "api_calls", 1)
	if err != nil {
		log.Printf("Failed to record API call usage: %v", err)
	}
}

// TrackBackupOperation tracks a backup operation
func (u *UsageTracker) TrackBackupOperation(ctx context.Context, accountID string) {
	if !u.enabled {
		return
	}

	subscription, err := u.billingService.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get subscription for backup tracking: %v", err)
		return
	}

	err = u.billingService.RecordUsage(ctx, accountID, subscription.SubscriptionID, "backups", 1)
	if err != nil {
		log.Printf("Failed to record backup usage: %v", err)
	}
}

// TrackStorageUsage tracks storage usage in GB
func (u *UsageTracker) TrackStorageUsage(ctx context.Context, accountID string, storageGB int64) {
	if !u.enabled {
		return
	}

	subscription, err := u.billingService.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get subscription for storage tracking: %v", err)
		return
	}

	err = u.billingService.RecordUsage(ctx, accountID, subscription.SubscriptionID, "storage_gb", storageGB)
	if err != nil {
		log.Printf("Failed to record storage usage: %v", err)
	}
}

// TrackSourceCreation tracks when a new source is created
func (u *UsageTracker) TrackSourceCreation(ctx context.Context, accountID string) {
	if !u.enabled {
		return
	}

	subscription, err := u.billingService.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		log.Printf("Failed to get subscription for source tracking: %v", err)
		return
	}

	err = u.billingService.RecordUsage(ctx, accountID, subscription.SubscriptionID, "sources", 1)
	if err != nil {
		log.Printf("Failed to record source usage: %v", err)
	}
}

// CheckPlanLimits checks if an account has exceeded plan limits
func (u *UsageTracker) CheckPlanLimits(ctx context.Context, accountID, limitType string) (bool, error) {
	if !u.enabled {
		return true, nil // Allow everything if tracking is disabled
	}

	planLimits, err := u.billingService.CheckPlanLimits(ctx, accountID)
	if err != nil {
		return false, err
	}

	// Get current usage for this billing period
	subscription, err := u.billingService.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		return false, err
	}

	currentPeriod := subscription.CurrentPeriodStart.Format("2006-01")
	usage, err := u.billingService.GetUsageForPeriod(ctx, accountID, currentPeriod)
	if err != nil {
		return false, err
	}

	// Calculate current usage totals
	var apiCalls, backups, sources, storageGB int64
	for _, record := range usage {
		switch record.MetricType {
		case "api_calls":
			apiCalls += record.Quantity
		case "backups":
			backups += record.Quantity
		case "sources":
			sources += record.Quantity
		case "storage_gb":
			if record.Quantity > storageGB {
				storageGB = record.Quantity
			}
		}
	}

	// Check limits based on type
	switch limitType {
	case "api_calls":
		if planLimits.MaxAPICallsPerMonth > 0 && apiCalls >= int64(planLimits.MaxAPICallsPerMonth) {
			return false, nil
		}
	case "backups":
		if planLimits.MaxBackupsPerMonth > 0 && backups >= int64(planLimits.MaxBackupsPerMonth) {
			return false, nil
		}
	case "sources":
		if planLimits.MaxSources > 0 && sources >= int64(planLimits.MaxSources) {
			return false, nil
		}
	case "storage":
		if planLimits.MaxStorageGB > 0 && storageGB >= int64(planLimits.MaxStorageGB) {
			return false, nil
		}
	}

	return true, nil
}

// IsFeatureAvailable checks if a feature is available for an account
func (u *UsageTracker) IsFeatureAvailable(ctx context.Context, accountID, feature string) (bool, error) {
	if !u.enabled {
		return true, nil // Allow everything if tracking is disabled
	}

	return u.billingService.IsFeatureAvailable(ctx, accountID, feature)
}

// extractAuthContext extracts user and account ID from the API Gateway event
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

// CreateUsageTrackingWrapper creates a wrapper function for Lambda handlers that includes usage tracking
func CreateUsageTrackingWrapper(handler func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error)) func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	tracker := NewUsageTracker()
	
	return func(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		// Track the API call before processing
		tracker.TrackAPICall(ctx, event)
		
		// Call the original handler
		response, err := handler(ctx, event)
		
		// Additional tracking based on response could go here
		// For example, track successful operations differently
		
		return response, err
	}
}