package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
)

func main() {
	ctx := context.Background()

	// Get environment variables
	tableName := os.Getenv("DYNAMODB_TABLE")
	userPoolID := os.Getenv("COGNITO_USER_POOL_ID")

	if tableName == "" {
		log.Fatal("DYNAMODB_TABLE environment variable is required")
	}
	if userPoolID == "" {
		log.Fatal("COGNITO_USER_POOL_ID environment variable is required")
	}

	// Initialize AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}

	// Initialize services
	dynamoClient := dynamodb.NewFromConfig(cfg)
	cognitoClient := cognitoidentityprovider.NewFromConfig(cfg)
	
	billingService := services.NewBillingService(dynamoClient, tableName)
	cognitoService := services.NewCognitoGroupsService(cognitoClient, dynamoClient, userPoolID, tableName)

	log.Printf("Setting up billing plans and Cognito groups...")

	// Setup Cognito groups first
	err = cognitoService.SetupDefaultGroups(ctx)
	if err != nil {
		log.Fatalf("Failed to setup Cognito groups: %v", err)
	}

	// Create default billing plans
	plans := getDefaultBillingPlans()
	
	for _, plan := range plans {
		log.Printf("Creating plan: %s", plan.Name)
		err = billingService.CreateBillingPlan(ctx, &plan)
		if err != nil {
			log.Printf("Failed to create plan %s: %v", plan.Name, err)
		} else {
			log.Printf("Successfully created plan: %s", plan.Name)
		}
	}

	log.Printf("Billing setup completed successfully!")
}

func getDefaultBillingPlans() []types.BillingPlan {
	return []types.BillingPlan{
		{
			PlanID:          "plan_free",
			StripePriceID:   "", // Free plan doesn't have Stripe price
			Name:            "Free",
			Description:     "Perfect for trying out ListBackup with basic features",
			Amount:          0,
			Currency:        "usd",
			Interval:        "month",
			IntervalCount:   1,
			Features: types.PlanFeatures{
				BasicBackups:         true,
				AdvancedBackups:      false,
				DataSync:             false,
				DataMigration:        false,
				CustomRetention:      false,
				HierarchicalAccounts: false,
				WhiteLabel:           false,
				PrioritySupport:      false,
				APIAccess:            false,
				TeamManagement:       false,
				CustomDomains:        false,
				AdvancedReporting:    false,
				ExternalStorage:      false,
				ComplianceReports:    false,
				AuditTrails:          false,
			},
			Limits: types.PlanLimits{
				MaxSources:           3,
				MaxAccounts:          1,
				MaxTeamMembers:       1,
				MaxStorageGB:         1,
				MaxAPICallsPerMonth:  1000,
				MaxBackupsPerMonth:   10,
				MaxRetentionDays:     7,
				MaxSyncFrequency:     1440, // 24 hours
			},
			TrialDays: 0,
			Popular:   false,
			Status:    "active",
		},
		{
			PlanID:          "plan_starter",
			StripePriceID:   "price_starter_monthly",
			Name:            "Starter",
			Description:     "Great for small businesses and growing teams",
			Amount:          1900, // $19.00
			Currency:        "usd",
			Interval:        "month",
			IntervalCount:   1,
			Features: types.PlanFeatures{
				BasicBackups:         true,
				AdvancedBackups:      true,
				DataSync:             true,
				DataMigration:        false,
				CustomRetention:      true,
				HierarchicalAccounts: true,
				WhiteLabel:           false,
				PrioritySupport:      false,
				APIAccess:            true,
				TeamManagement:       true,
				CustomDomains:        false,
				AdvancedReporting:    false,
				ExternalStorage:      true,
				ComplianceReports:    false,
				AuditTrails:          false,
			},
			Limits: types.PlanLimits{
				MaxSources:           15,
				MaxAccounts:          5,
				MaxTeamMembers:       5,
				MaxStorageGB:         10,
				MaxAPICallsPerMonth:  25000,
				MaxBackupsPerMonth:   100,
				MaxRetentionDays:     30,
				MaxSyncFrequency:     60, // 1 hour
			},
			TrialDays: 14,
			Popular:   true,
			Status:    "active",
		},
		{
			PlanID:          "plan_pro",
			StripePriceID:   "price_pro_monthly",
			Name:            "Pro",
			Description:     "Perfect for established businesses with advanced needs",
			Amount:          4900, // $49.00
			Currency:        "usd",
			Interval:        "month",
			IntervalCount:   1,
			Features: types.PlanFeatures{
				BasicBackups:         true,
				AdvancedBackups:      true,
				DataSync:             true,
				DataMigration:        true,
				CustomRetention:      true,
				HierarchicalAccounts: true,
				WhiteLabel:           true,
				PrioritySupport:      true,
				APIAccess:            true,
				TeamManagement:       true,
				CustomDomains:        true,
				AdvancedReporting:    true,
				ExternalStorage:      true,
				ComplianceReports:    false,
				AuditTrails:          false,
			},
			Limits: types.PlanLimits{
				MaxSources:           50,
				MaxAccounts:          20,
				MaxTeamMembers:       20,
				MaxStorageGB:         100,
				MaxAPICallsPerMonth:  100000,
				MaxBackupsPerMonth:   500,
				MaxRetentionDays:     90,
				MaxSyncFrequency:     15, // 15 minutes
			},
			TrialDays: 14,
			Popular:   false,
			Status:    "active",
		},
		{
			PlanID:          "plan_enterprise",
			StripePriceID:   "price_enterprise_monthly",
			Name:            "Enterprise",
			Description:     "For large organizations requiring maximum security and compliance",
			Amount:          19900, // $199.00
			Currency:        "usd",
			Interval:        "month",
			IntervalCount:   1,
			Features: types.PlanFeatures{
				BasicBackups:         true,
				AdvancedBackups:      true,
				DataSync:             true,
				DataMigration:        true,
				CustomRetention:      true,
				HierarchicalAccounts: true,
				WhiteLabel:           true,
				PrioritySupport:      true,
				APIAccess:            true,
				TeamManagement:       true,
				CustomDomains:        true,
				AdvancedReporting:    true,
				ExternalStorage:      true,
				ComplianceReports:    true,
				AuditTrails:          true,
			},
			Limits: types.PlanLimits{
				MaxSources:           -1, // Unlimited
				MaxAccounts:          -1, // Unlimited
				MaxTeamMembers:       -1, // Unlimited
				MaxStorageGB:         1000,
				MaxAPICallsPerMonth:  -1, // Unlimited
				MaxBackupsPerMonth:   -1, // Unlimited
				MaxRetentionDays:     365,
				MaxSyncFrequency:     5, // 5 minutes
			},
			TrialDays: 30,
			Popular:   false,
			Status:    "active",
		},
	}
}