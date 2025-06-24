package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/internal/util"
)

type PlanComparisonResponse struct {
	Plans               []EnhancedBillingPlan `json:"plans"`
	Recommendations     PlanRecommendation    `json:"recommendations"`
	PricingCalculator   PricingCalculation    `json:"pricingCalculator"`
	FeatureComparison   FeatureMatrix         `json:"featureComparison"`
}

type EnhancedBillingPlan struct {
	types.BillingPlan
	MonthlyPrice        float64                `json:"monthlyPrice"`        // In dollars
	YearlyPrice         float64                `json:"yearlyPrice"`         // In dollars
	YearlySavings       float64                `json:"yearlySavings"`       // Percentage saved
	PopularFeatures     []string               `json:"popularFeatures"`
	LimitBreakdowns     map[string]interface{} `json:"limitBreakdowns"`
	CompetitorComparison *CompetitorComparison `json:"competitorComparison,omitempty"`
}

type PlanRecommendation struct {
	RecommendedPlan string   `json:"recommendedPlan"`
	Reasoning       []string `json:"reasoning"`
	Confidence      float64  `json:"confidence"`
	AlternativePlans []string `json:"alternativePlans"`
}

type PricingCalculation struct {
	EstimatedUsage      UsageEstimate     `json:"estimatedUsage"`
	BasePrice           float64           `json:"basePrice"`
	OverageCharges      OverageBreakdown  `json:"overageCharges"`
	TotalEstimatedCost  float64           `json:"totalEstimatedCost"`
	SavingsOpportunities []SavingsOption  `json:"savingsOpportunities"`
}

type UsageEstimate struct {
	APICallsPerMonth  int `json:"apiCallsPerMonth"`
	StorageGB         int `json:"storageGb"`
	SourcesCount      int `json:"sourcesCount"`
	TeamMembersCount  int `json:"teamMembersCount"`
	BackupsPerMonth   int `json:"backupsPerMonth"`
}

type OverageBreakdown struct {
	APICallsOverage  float64 `json:"apiCallsOverage"`
	StorageOverage   float64 `json:"storageOverage"`
	SourcesOverage   float64 `json:"sourcesOverage"`
	TotalOverage     float64 `json:"totalOverage"`
}

type SavingsOption struct {
	Type        string  `json:"type"`        // "yearly_billing", "plan_upgrade", "usage_optimization"
	Description string  `json:"description"`
	Savings     float64 `json:"savings"`     // Amount saved per month
	Confidence  float64 `json:"confidence"`  // How confident we are in this recommendation
}

type FeatureMatrix struct {
	Categories []FeatureCategory `json:"categories"`
}

type FeatureCategory struct {
	Name         string    `json:"name"`
	Features     []Feature `json:"features"`
	Description  string    `json:"description"`
}

type Feature struct {
	Name         string                 `json:"name"`
	Description  string                 `json:"description"`
	PlanSupport  map[string]interface{} `json:"planSupport"` // planId -> true/false/string
	IsPopular    bool                   `json:"isPopular"`
	IsEnterprise bool                   `json:"isEnterprise"`
}

type CompetitorComparison struct {
	Competitors []CompetitorPlan `json:"competitors"`
	Advantages  []string         `json:"advantages"`
	ValueProp   string           `json:"valueProp"`
}

type CompetitorPlan struct {
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Features []string `json:"features"`
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
	log.Printf("Plan comparison request: %+v", event)

	// Extract usage parameters for recommendations
	usageParams := extractUsageParameters(event.QueryStringParameters)
	log.Printf("Usage parameters: %+v", usageParams)

	// Get all active billing plans
	plans, err := billingService.ListBillingPlans(ctx)
	if err != nil {
		log.Printf("Failed to list billing plans: %v", err)
		return util.CreateErrorResponse(500, "Failed to get billing plans")
	}

	// Enhance plans with additional information
	enhancedPlans := enhancePlansWithDetails(plans)

	// Generate recommendations based on usage
	recommendations := generatePlanRecommendations(enhancedPlans, usageParams)

	// Calculate pricing based on estimated usage
	pricingCalculation := calculatePricing(enhancedPlans, usageParams)

	// Generate feature comparison matrix
	featureMatrix := generateFeatureMatrix(enhancedPlans)

	response := PlanComparisonResponse{
		Plans:               enhancedPlans,
		Recommendations:     recommendations,
		PricingCalculator:   pricingCalculation,
		FeatureComparison:   featureMatrix,
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

func extractUsageParameters(params map[string]string) UsageEstimate {
	usage := UsageEstimate{
		APICallsPerMonth: 10000,  // Default values
		StorageGB:        5,
		SourcesCount:     3,
		TeamMembersCount: 1,
		BackupsPerMonth:  30,
	}

	if apiCalls, exists := params["apiCalls"]; exists {
		if val, err := strconv.Atoi(apiCalls); err == nil {
			usage.APICallsPerMonth = val
		}
	}

	if storage, exists := params["storage"]; exists {
		if val, err := strconv.Atoi(storage); err == nil {
			usage.StorageGB = val
		}
	}

	if sources, exists := params["sources"]; exists {
		if val, err := strconv.Atoi(sources); err == nil {
			usage.SourcesCount = val
		}
	}

	if members, exists := params["members"]; exists {
		if val, err := strconv.Atoi(members); err == nil {
			usage.TeamMembersCount = val
		}
	}

	if backups, exists := params["backups"]; exists {
		if val, err := strconv.Atoi(backups); err == nil {
			usage.BackupsPerMonth = val
		}
	}

	return usage
}

func enhancePlansWithDetails(plans []types.BillingPlan) []EnhancedBillingPlan {
	var enhanced []EnhancedBillingPlan

	for _, plan := range plans {
		monthlyPrice := float64(plan.Amount) / 100.0
		yearlyPrice := monthlyPrice * 12.0 * 0.8 // 20% discount for yearly
		yearlySavings := 20.0

		limitBreakdowns := map[string]interface{}{
			"sources":      getLimitDisplay(plan.Limits.MaxSources),
			"storage":      getLimitDisplay(plan.Limits.MaxStorageGB) + " GB",
			"apiCalls":     getLimitDisplay(plan.Limits.MaxAPICallsPerMonth) + "/month",
			"teamMembers":  getLimitDisplay(plan.Limits.MaxTeamMembers),
			"retention":    strconv.Itoa(plan.Limits.MaxRetentionDays) + " days",
		}

		popularFeatures := getPopularFeatures(plan)
		
		enhancedPlan := EnhancedBillingPlan{
			BillingPlan:      plan,
			MonthlyPrice:     monthlyPrice,
			YearlyPrice:      yearlyPrice,
			YearlySavings:    yearlySavings,
			PopularFeatures:  popularFeatures,
			LimitBreakdowns:  limitBreakdowns,
		}

		// Add competitor comparison for paid plans
		if plan.Amount > 0 {
			enhancedPlan.CompetitorComparison = generateCompetitorComparison(plan)
		}

		enhanced = append(enhanced, enhancedPlan)
	}

	return enhanced
}

func getLimitDisplay(limit int) string {
	if limit <= 0 {
		return "Unlimited"
	}
	return strconv.Itoa(limit)
}

func getPopularFeatures(plan types.BillingPlan) []string {
	var features []string

	featureMap := map[string]bool{
		"Basic Backups":          plan.Features.BasicBackups,
		"Advanced Backups":       plan.Features.AdvancedBackups,
		"Data Sync":              plan.Features.DataSync,
		"Data Migration":         plan.Features.DataMigration,
		"Team Management":        plan.Features.TeamManagement,
		"API Access":             plan.Features.APIAccess,
		"White Label":            plan.Features.WhiteLabel,
		"Custom Domains":         plan.Features.CustomDomains,
		"External Storage":       plan.Features.ExternalStorage,
		"Advanced Reporting":     plan.Features.AdvancedReporting,
		"Compliance Reports":     plan.Features.ComplianceReports,
		"Audit Trails":           plan.Features.AuditTrails,
	}

	// Add features that are enabled and popular
	popularOrder := []string{
		"Basic Backups", "Advanced Backups", "Data Sync", "Team Management",
		"API Access", "Data Migration", "External Storage", "Advanced Reporting",
		"White Label", "Custom Domains", "Compliance Reports", "Audit Trails",
	}

	for _, feature := range popularOrder {
		if featureMap[feature] {
			features = append(features, feature)
		}
		if len(features) >= 5 { // Limit to top 5 features
			break
		}
	}

	return features
}

func generatePlanRecommendations(plans []EnhancedBillingPlan, usage UsageEstimate) PlanRecommendation {
	// Score each plan based on usage requirements
	scores := make(map[string]float64)
	reasoning := make(map[string][]string)

	for _, plan := range plans {
		score := 0.0
		planReasoning := []string{}

		// Check if usage fits within limits
		if usage.SourcesCount <= plan.Limits.MaxSources || plan.Limits.MaxSources <= 0 {
			score += 25.0
		} else {
			planReasoning = append(planReasoning, "Exceeds source limit")
			score -= 10.0
		}

		if usage.StorageGB <= plan.Limits.MaxStorageGB || plan.Limits.MaxStorageGB <= 0 {
			score += 25.0
		} else {
			planReasoning = append(planReasoning, "Exceeds storage limit")
			score -= 10.0
		}

		if usage.APICallsPerMonth <= plan.Limits.MaxAPICallsPerMonth || plan.Limits.MaxAPICallsPerMonth <= 0 {
			score += 25.0
		} else {
			planReasoning = append(planReasoning, "Exceeds API call limit")
			score -= 10.0
		}

		if usage.TeamMembersCount <= plan.Limits.MaxTeamMembers || plan.Limits.MaxTeamMembers <= 0 {
			score += 15.0
		} else {
			planReasoning = append(planReasoning, "Exceeds team member limit")
			score -= 5.0
		}

		// Value assessment
		if plan.MonthlyPrice == 0 {
			if usage.SourcesCount <= 3 && usage.StorageGB <= 1 {
				score += 20.0
				planReasoning = append(planReasoning, "Free plan suitable for basic usage")
			} else {
				score -= 15.0
				planReasoning = append(planReasoning, "Usage may exceed free tier limits")
			}
		} else {
			// Consider price-to-value ratio
			priceScore := 100.0 / (plan.MonthlyPrice + 1.0) // Inverse relationship
			score += priceScore * 0.3

			if plan.Popular {
				score += 10.0
				planReasoning = append(planReasoning, "Popular choice among similar users")
			}
		}

		scores[plan.PlanID] = score
		reasoning[plan.PlanID] = planReasoning
	}

	// Find the best scoring plan
	var bestPlan string
	var bestScore float64
	var alternatives []string

	for planID, score := range scores {
		if score > bestScore {
			if bestPlan != "" {
				alternatives = append(alternatives, bestPlan)
			}
			bestPlan = planID
			bestScore = score
		} else if len(alternatives) < 2 {
			alternatives = append(alternatives, planID)
		}
	}

	confidence := bestScore / 100.0
	if confidence > 1.0 {
		confidence = 1.0
	}

	return PlanRecommendation{
		RecommendedPlan:  bestPlan,
		Reasoning:        reasoning[bestPlan],
		Confidence:       confidence,
		AlternativePlans: alternatives,
	}
}

func calculatePricing(plans []EnhancedBillingPlan, usage UsageEstimate) PricingCalculation {
	// Find the recommended plan for base pricing
	recommendations := generatePlanRecommendations(plans, usage)
	
	var selectedPlan *EnhancedBillingPlan
	for _, plan := range plans {
		if plan.PlanID == recommendations.RecommendedPlan {
			selectedPlan = &plan
			break
		}
	}

	if selectedPlan == nil {
		selectedPlan = &plans[0] // Fallback to first plan
	}

	// Calculate overage charges
	overage := OverageBreakdown{}
	
	// API calls overage
	if usage.APICallsPerMonth > selectedPlan.Limits.MaxAPICallsPerMonth && selectedPlan.Limits.MaxAPICallsPerMonth > 0 {
		excess := usage.APICallsPerMonth - selectedPlan.Limits.MaxAPICallsPerMonth
		overage.APICallsOverage = float64(excess) * 0.001 // $0.001 per extra API call
	}

	// Storage overage
	if usage.StorageGB > selectedPlan.Limits.MaxStorageGB && selectedPlan.Limits.MaxStorageGB > 0 {
		excess := usage.StorageGB - selectedPlan.Limits.MaxStorageGB
		overage.StorageOverage = float64(excess) * 0.50 // $0.50 per extra GB
	}

	// Sources overage
	if usage.SourcesCount > selectedPlan.Limits.MaxSources && selectedPlan.Limits.MaxSources > 0 {
		excess := usage.SourcesCount - selectedPlan.Limits.MaxSources
		overage.SourcesOverage = float64(excess) * 5.0 // $5.00 per extra source
	}

	overage.TotalOverage = overage.APICallsOverage + overage.StorageOverage + overage.SourcesOverage

	// Generate savings opportunities
	savingsOptions := []SavingsOption{}

	// Yearly billing savings
	if selectedPlan.MonthlyPrice > 0 {
		yearlySavings := selectedPlan.MonthlyPrice * 0.2 // 20% savings
		savingsOptions = append(savingsOptions, SavingsOption{
			Type:        "yearly_billing",
			Description: "Save 20% by switching to yearly billing",
			Savings:     yearlySavings,
			Confidence:  1.0,
		})
	}

	// Plan upgrade savings (if overage costs more than upgrade)
	if overage.TotalOverage > 10.0 {
		// Find next tier up
		for _, plan := range plans {
			if plan.MonthlyPrice > selectedPlan.MonthlyPrice && plan.MonthlyPrice < selectedPlan.MonthlyPrice+overage.TotalOverage {
				savings := overage.TotalOverage - (plan.MonthlyPrice - selectedPlan.MonthlyPrice)
				if savings > 0 {
					savingsOptions = append(savingsOptions, SavingsOption{
						Type:        "plan_upgrade",
						Description: "Upgrade to " + plan.Name + " to avoid overage charges",
						Savings:     savings,
						Confidence:  0.9,
					})
					break
				}
			}
		}
	}

	return PricingCalculation{
		EstimatedUsage:       usage,
		BasePrice:            selectedPlan.MonthlyPrice,
		OverageCharges:       overage,
		TotalEstimatedCost:   selectedPlan.MonthlyPrice + overage.TotalOverage,
		SavingsOpportunities: savingsOptions,
	}
}

func generateFeatureMatrix(plans []EnhancedBillingPlan) FeatureMatrix {
	categories := []FeatureCategory{
		{
			Name:        "Backup & Sync",
			Description: "Core backup and data synchronization features",
			Features: []Feature{
				{
					Name:        "Basic Backups",
					Description: "Standard backup functionality for essential data protection",
					PlanSupport: map[string]interface{}{},
					IsPopular:   true,
				},
				{
					Name:        "Advanced Backups",
					Description: "Enhanced backup with custom scheduling and incremental backups",
					PlanSupport: map[string]interface{}{},
					IsPopular:   true,
				},
				{
					Name:        "Data Sync",
					Description: "Real-time synchronization between platforms",
					PlanSupport: map[string]interface{}{},
					IsPopular:   true,
				},
				{
					Name:        "Data Migration",
					Description: "Move data between different platforms and services",
					PlanSupport: map[string]interface{}{},
					IsPopular:   false,
				},
			},
		},
		{
			Name:        "Team & Access",
			Description: "Collaboration and access management features",
			Features: []Feature{
				{
					Name:        "Team Management",
					Description: "Invite team members and manage permissions",
					PlanSupport: map[string]interface{}{},
					IsPopular:   true,
				},
				{
					Name:        "Hierarchical Accounts",
					Description: "Create sub-accounts for complex organizational structures",
					PlanSupport: map[string]interface{}{},
					IsPopular:   false,
				},
				{
					Name:        "API Access",
					Description: "Programmatic access to your backup data and controls",
					PlanSupport: map[string]interface{}{},
					IsPopular:   true,
				},
			},
		},
		{
			Name:        "Branding & Customization",
			Description: "White-label and customization options",
			Features: []Feature{
				{
					Name:        "White Label",
					Description: "Remove ListBackup branding and use your own",
					PlanSupport: map[string]interface{}{},
					IsPopular:   false,
				},
				{
					Name:        "Custom Domains",
					Description: "Use your own domain for the ListBackup interface",
					PlanSupport: map[string]interface{}{},
					IsPopular:   false,
				},
			},
		},
		{
			Name:        "Enterprise & Compliance",
			Description: "Advanced features for enterprise customers",
			Features: []Feature{
				{
					Name:        "Advanced Reporting",
					Description: "Detailed analytics and custom reports",
					PlanSupport: map[string]interface{}{},
					IsPopular:   false,
				},
				{
					Name:        "Compliance Reports",
					Description: "SOC2, GDPR, and other compliance reporting",
					PlanSupport: map[string]interface{}{},
					IsEnterprise: true,
				},
				{
					Name:        "Audit Trails",
					Description: "Complete audit logs of all system activities",
					PlanSupport: map[string]interface{}{},
					IsEnterprise: true,
				},
				{
					Name:        "External Storage",
					Description: "Store backups in your own cloud storage accounts",
					PlanSupport: map[string]interface{}{},
					IsPopular:   false,
				},
			},
		},
	}

	// Populate plan support for each feature
	for i, category := range categories {
		for j, feature := range category.Features {
			for _, plan := range plans {
				support := getFeatureSupport(feature.Name, plan.BillingPlan)
				categories[i].Features[j].PlanSupport[plan.PlanID] = support
			}
		}
	}

	return FeatureMatrix{Categories: categories}
}

func getFeatureSupport(featureName string, plan types.BillingPlan) interface{} {
	switch featureName {
	case "Basic Backups":
		return plan.Features.BasicBackups
	case "Advanced Backups":
		return plan.Features.AdvancedBackups
	case "Data Sync":
		return plan.Features.DataSync
	case "Data Migration":
		return plan.Features.DataMigration
	case "Team Management":
		return plan.Features.TeamManagement
	case "Hierarchical Accounts":
		return plan.Features.HierarchicalAccounts
	case "API Access":
		return plan.Features.APIAccess
	case "White Label":
		return plan.Features.WhiteLabel
	case "Custom Domains":
		return plan.Features.CustomDomains
	case "Advanced Reporting":
		return plan.Features.AdvancedReporting
	case "Compliance Reports":
		return plan.Features.ComplianceReports
	case "Audit Trails":
		return plan.Features.AuditTrails
	case "External Storage":
		return plan.Features.ExternalStorage
	default:
		return false
	}
}

func generateCompetitorComparison(plan types.BillingPlan) *CompetitorComparison {
	// Sample competitor data - in production this would be more dynamic
	competitors := []CompetitorPlan{
		{
			Name:  "Zapier",
			Price: 29.99,
			Features: []string{"Basic integrations", "5 Zaps", "Multi-step workflows"},
		},
		{
			Name:  "Integromat",
			Price: 39.99,
			Features: []string{"Advanced workflows", "10,000 operations", "Error handling"},
		},
	}

	advantages := []string{
		"Purpose-built for backup and data protection",
		"Hierarchical account structure for complex organizations",
		"Advanced compliance and audit features",
		"White-label capabilities included",
	}

	valueProp := "ListBackup offers specialized backup automation at competitive pricing with enterprise-grade security."

	return &CompetitorComparison{
		Competitors: competitors,
		Advantages:  advantages,
		ValueProp:   valueProp,
	}
}

func main() {
	lambda.Start(handler)
}