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

type BillingAnalyticsResponse struct {
	RevenueAnalytics RevenueMetrics     `json:"revenueAnalytics"`
	UsageAnalytics   UsageMetrics       `json:"usageAnalytics"`
	PlanAnalytics    PlanMetrics        `json:"planAnalytics"`
	TrendAnalytics   []TrendData        `json:"trendAnalytics"`
	Period           string             `json:"period"`
}

type RevenueMetrics struct {
	TotalRevenue     int64   `json:"totalRevenue"`      // In cents
	MonthlyRevenue   int64   `json:"monthlyRevenue"`    // Current month
	AverageRevenuePerUser int64 `json:"averageRevenuePerUser"`
	RevenueGrowth    float64 `json:"revenueGrowth"`     // Percentage
	ChurnRate        float64 `json:"churnRate"`         // Percentage
}

type UsageMetrics struct {
	TotalAPICallsPerMonth  int64   `json:"totalApiCallsPerMonth"`
	TotalStorageGB         int64   `json:"totalStorageGb"`
	TotalBackupsPerMonth   int64   `json:"totalBackupsPerMonth"`
	AverageUsagePerAccount float64 `json:"averageUsagePerAccount"`
	TopUsageAccounts       []AccountUsage `json:"topUsageAccounts"`
}

type PlanMetrics struct {
	PlanDistribution    []PlanDistribution `json:"planDistribution"`
	ConversionRates     []ConversionRate   `json:"conversionRates"`
	UpgradeDowngradeRate float64           `json:"upgradeDowngradeRate"`
}

type TrendData struct {
	Date            string  `json:"date"`
	Revenue         int64   `json:"revenue"`
	NewSubscriptions int     `json:"newSubscriptions"`
	Cancellations   int     `json:"cancellations"`
	Usage           int64   `json:"usage"`
}

type AccountUsage struct {
	AccountID string `json:"accountId"`
	Usage     int64  `json:"usage"`
	PlanName  string `json:"planName"`
}

type PlanDistribution struct {
	PlanID   string  `json:"planId"`
	PlanName string  `json:"planName"`
	Count    int     `json:"count"`
	Revenue  int64   `json:"revenue"`
	Percent  float64 `json:"percent"`
}

type ConversionRate struct {
	FromPlan string  `json:"fromPlan"`
	ToPlan   string  `json:"toPlan"`
	Rate     float64 `json:"rate"`
	Count    int     `json:"count"`
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
	log.Printf("Billing analytics request: %+v", event)

	// Extract auth context (admin/enterprise only)
	userID, accountID := extractAuthContext(event)
	if userID == "" || accountID == "" {
		return util.CreateErrorResponse(401, "Unauthorized")
	}

	// Check if user has permission for analytics (enterprise feature)
	hasAccess, err := checkAnalyticsAccess(ctx, accountID)
	if err != nil {
		log.Printf("Failed to check analytics access: %v", err)
		return util.CreateErrorResponse(500, "Failed to verify access")
	}
	if !hasAccess {
		return util.CreateErrorResponse(403, "Analytics feature requires Enterprise plan")
	}

	// Get period from query parameters
	period := event.QueryStringParameters["period"]
	if period == "" {
		period = "month" // Default to current month
	}

	// Validate period
	if !isValidPeriod(period) {
		return util.CreateErrorResponse(400, "Invalid period. Use 'week', 'month', 'quarter', or 'year'")
	}

	// Calculate date range based on period
	startDate, endDate := calculateDateRange(period)
	log.Printf("Analytics period: %s, range: %s to %s", period, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))

	// Generate analytics
	analytics := BillingAnalyticsResponse{
		Period: period,
	}

	// Get revenue analytics
	analytics.RevenueAnalytics = generateRevenueAnalytics(ctx, startDate, endDate)
	
	// Get usage analytics
	analytics.UsageAnalytics = generateUsageAnalytics(ctx, startDate, endDate)
	
	// Get plan analytics
	analytics.PlanAnalytics = generatePlanAnalytics(ctx, startDate, endDate)
	
	// Get trend analytics
	analytics.TrendAnalytics = generateTrendAnalytics(ctx, startDate, endDate, period)

	responseBody, _ := json.Marshal(analytics)
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

func checkAnalyticsAccess(ctx context.Context, accountID string) (bool, error) {
	// Check if account has Enterprise plan or admin privileges
	return billingService.IsFeatureAvailable(ctx, accountID, "advancedReporting")
}

func isValidPeriod(period string) bool {
	validPeriods := []string{"week", "month", "quarter", "year"}
	for _, valid := range validPeriods {
		if period == valid {
			return true
		}
	}
	return false
}

func calculateDateRange(period string) (time.Time, time.Time) {
	now := time.Now()
	var startDate, endDate time.Time

	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
		endDate = now
	case "month":
		startDate = now.AddDate(0, -1, 0)
		endDate = now
	case "quarter":
		startDate = now.AddDate(0, -3, 0)
		endDate = now
	case "year":
		startDate = now.AddDate(-1, 0, 0)
		endDate = now
	default:
		startDate = now.AddDate(0, -1, 0)
		endDate = now
	}

	return startDate, endDate
}

func generateRevenueAnalytics(ctx context.Context, startDate, endDate time.Time) RevenueMetrics {
	// Note: In a real implementation, these would query the database
	// For now, returning mock data that demonstrates the structure
	
	return RevenueMetrics{
		TotalRevenue:          125000, // $1,250.00 in cents
		MonthlyRevenue:        45000,  // $450.00 in cents
		AverageRevenuePerUser: 2900,   // $29.00 in cents
		RevenueGrowth:         15.5,   // 15.5% growth
		ChurnRate:             2.3,    // 2.3% churn rate
	}
}

func generateUsageAnalytics(ctx context.Context, startDate, endDate time.Time) UsageMetrics {
	// Note: In a real implementation, these would aggregate actual usage data
	
	topAccounts := []AccountUsage{
		{AccountID: "acc_enterprise_1", Usage: 50000, PlanName: "Enterprise"},
		{AccountID: "acc_pro_1", Usage: 25000, PlanName: "Pro"},
		{AccountID: "acc_pro_2", Usage: 22000, PlanName: "Pro"},
		{AccountID: "acc_starter_1", Usage: 15000, PlanName: "Starter"},
		{AccountID: "acc_starter_2", Usage: 12000, PlanName: "Starter"},
	}
	
	return UsageMetrics{
		TotalAPICallsPerMonth:  150000,
		TotalStorageGB:         2500,
		TotalBackupsPerMonth:   1200,
		AverageUsagePerAccount: 8500.5,
		TopUsageAccounts:       topAccounts,
	}
}

func generatePlanAnalytics(ctx context.Context, startDate, endDate time.Time) PlanMetrics {
	// Note: In a real implementation, these would query subscription data
	
	distribution := []PlanDistribution{
		{PlanID: "plan_free", PlanName: "Free", Count: 120, Revenue: 0, Percent: 60.0},
		{PlanID: "plan_starter", PlanName: "Starter", Count: 50, Revenue: 95000, Percent: 25.0},
		{PlanID: "plan_pro", PlanName: "Pro", Count: 25, Revenue: 122500, Percent: 12.5},
		{PlanID: "plan_enterprise", PlanName: "Enterprise", Count: 5, Revenue: 99500, Percent: 2.5},
	}
	
	conversions := []ConversionRate{
		{FromPlan: "plan_free", ToPlan: "plan_starter", Rate: 8.5, Count: 12},
		{FromPlan: "plan_starter", ToPlan: "plan_pro", Rate: 15.2, Count: 8},
		{FromPlan: "plan_pro", ToPlan: "plan_enterprise", Rate: 5.1, Count: 2},
		{FromPlan: "plan_starter", ToPlan: "plan_free", Rate: 3.2, Count: 2},
	}
	
	return PlanMetrics{
		PlanDistribution:     distribution,
		ConversionRates:      conversions,
		UpgradeDowngradeRate: 12.5,
	}
}

func generateTrendAnalytics(ctx context.Context, startDate, endDate time.Time, period string) []TrendData {
	// Note: In a real implementation, this would generate time series data
	// For now, generating sample trend data
	
	var trends []TrendData
	days := int(endDate.Sub(startDate).Hours() / 24)
	
	// Generate daily data points
	for i := 0; i <= days; i++ {
		date := startDate.AddDate(0, 0, i)
		
		// Generate sample data with some variance
		baseRevenue := int64(1500 + (i * 50))
		variance := int64((i % 7) * 200)
		
		trend := TrendData{
			Date:             date.Format("2006-01-02"),
			Revenue:          baseRevenue + variance,
			NewSubscriptions: 2 + (i % 5),
			Cancellations:    (i % 3),
			Usage:            5000 + int64(i*100) + variance,
		}
		
		trends = append(trends, trend)
	}
	
	return trends
}

func main() {
	lambda.Start(handler)
}