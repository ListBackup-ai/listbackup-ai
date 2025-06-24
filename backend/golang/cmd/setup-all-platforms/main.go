package main

import (
	"context"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// SimplePlatform represents the actual structure used in DynamoDB
type SimplePlatform struct {
	PlatformID        string   `json:"platformId"`
	Name              string   `json:"name"`
	Description       string   `json:"description"`
	Category          string   `json:"category"`
	Website           string   `json:"website"`
	LogoURL           string   `json:"logoUrl"`
	RequiresOAuth     bool     `json:"requiresOAuth"`
	IsActive          bool     `json:"isActive"`  
	SupportedFeatures []string `json:"supportedFeatures"`
	CreatedAt         string   `json:"createdAt"`
	UpdatedAt         string   `json:"updatedAt"`
}

func main() {
	ctx := context.Background()

	// Initialize AWS DynamoDB client directly  
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}

	client := dynamodb.NewFromConfig(cfg)

	// List of all platforms from OAuth configuration
	platforms := []SimplePlatform{
		createGoHighLevelPlatform(),
		createHubSpotPlatform(),
		createGooglePlatform(),
		createDropboxPlatform(),
		createBoxPlatform(),
		createQuickBooksPlatform(),
		createShopifyPlatform(),
		createMailChimpPlatform(),
		createActiveCampaignPlatform(),
		createZendeskPlatform(),
	}

	tableName := "listbackup-main-platforms"

	for _, platform := range platforms {
		// Check if platform already exists
		exists, err := checkIfPlatformExists(ctx, client, tableName, platform.PlatformID)
		if err != nil {
			log.Printf("Error checking if platform %s exists: %v", platform.Name, err)
			continue
		}

		if exists {
			log.Printf("Platform %s already exists, skipping", platform.Name)
			continue
		}

		err = createPlatformRecord(ctx, client, tableName, platform)
		if err != nil {
			log.Printf("Failed to create platform %s: %v", platform.Name, err)
		} else {
			log.Printf("Created platform: %s", platform.Name)
		}
	}

	log.Println("Platform setup complete!")
}

func checkIfPlatformExists(ctx context.Context, client *dynamodb.Client, tableName, platformID string) (bool, error) {
	input := &dynamodb.GetItemInput{
		TableName: &tableName,
		Key: map[string]types.AttributeValue{
			"platformId": &types.AttributeValueMemberS{Value: platformID},
		},
	}

	result, err := client.GetItem(ctx, input)
	if err != nil {
		return false, err
	}

	return len(result.Item) > 0, nil
}

func createPlatformRecord(ctx context.Context, client *dynamodb.Client, tableName string, platform SimplePlatform) error {
	// Convert supported features to AttributeValueMemberSS
	var features []string = platform.SupportedFeatures
	if len(features) == 0 {
		features = []string{"data"} // default value to avoid empty set
	}

	item := map[string]types.AttributeValue{
		"platformId":        &types.AttributeValueMemberS{Value: platform.PlatformID},
		"name":             &types.AttributeValueMemberS{Value: platform.Name},
		"description":      &types.AttributeValueMemberS{Value: platform.Description},
		"category":         &types.AttributeValueMemberS{Value: platform.Category},
		"website":          &types.AttributeValueMemberS{Value: platform.Website},
		"logoUrl":          &types.AttributeValueMemberS{Value: platform.LogoURL},
		"requiresOAuth":    &types.AttributeValueMemberBOOL{Value: platform.RequiresOAuth},
		"isActive":         &types.AttributeValueMemberBOOL{Value: platform.IsActive},
		"supportedFeatures": &types.AttributeValueMemberSS{Value: features},
		"createdAt":        &types.AttributeValueMemberS{Value: platform.CreatedAt},
		"updatedAt":        &types.AttributeValueMemberS{Value: platform.UpdatedAt},
	}

	input := &dynamodb.PutItemInput{
		TableName: &tableName,
		Item:      item,
	}

	_, err := client.PutItem(ctx, input)
	return err
}

func createGoHighLevelPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "gohighlevel",
		Name:              "GoHighLevel",
		Description:       "All-in-one marketing and CRM platform",
		Category:          "CRM",
		Website:           "https://gohighlevel.com",
		LogoURL:           "https://logos.listbackup.ai/gohighlevel.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"contacts", "opportunities", "campaigns"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createHubSpotPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "hubspot",
		Name:              "HubSpot",
		Description:       "Inbound marketing, sales, and customer service platform",
		Category:          "CRM",
		Website:           "https://hubspot.com",
		LogoURL:           "https://logos.listbackup.ai/hubspot.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"contacts", "companies", "deals", "tickets"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createGooglePlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "google",
		Name:              "Google Workspace",
		Description:       "Google's suite of productivity and collaboration tools",
		Category:          "Productivity",
		Website:           "https://workspace.google.com",
		LogoURL:           "https://logos.listbackup.ai/google.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"drive", "sheets", "calendar", "contacts"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createDropboxPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "dropbox",
		Name:              "Dropbox",
		Description:       "Cloud storage and file synchronization service",
		Category:          "Storage",
		Website:           "https://dropbox.com",
		LogoURL:           "https://logos.listbackup.ai/dropbox.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"files", "folders", "sharing"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createBoxPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "box",
		Name:              "Box",
		Description:       "Enterprise cloud content management platform",
		Category:          "Storage",
		Website:           "https://box.com",
		LogoURL:           "https://logos.listbackup.ai/box.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"files", "folders", "collaboration"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createQuickBooksPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "quickbooks",
		Name:              "QuickBooks",
		Description:       "Accounting software for small and medium businesses",
		Category:          "Accounting",
		Website:           "https://quickbooks.intuit.com",
		LogoURL:           "https://logos.listbackup.ai/quickbooks.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"customers", "invoices", "payments", "items"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createShopifyPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "shopify",
		Name:              "Shopify",
		Description:       "E-commerce platform for online stores and retail POS",
		Category:          "E-commerce",
		Website:           "https://shopify.com",
		LogoURL:           "https://logos.listbackup.ai/shopify.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"products", "orders", "customers", "inventory"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createMailChimpPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "mailchimp",
		Name:              "Mailchimp",
		Description:       "Email marketing and automation platform",
		Category:          "Email Marketing",
		Website:           "https://mailchimp.com",
		LogoURL:           "https://logos.listbackup.ai/mailchimp.png",
		RequiresOAuth:     true,
		IsActive:          true,
		SupportedFeatures: []string{"lists", "campaigns", "members", "reports"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createActiveCampaignPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "activecampaign",
		Name:              "ActiveCampaign",
		Description:       "Email marketing, marketing automation, and CRM platform",
		Category:          "Email Marketing",
		Website:           "https://activecampaign.com",
		LogoURL:           "https://logos.listbackup.ai/activecampaign.png",
		RequiresOAuth:     false, // ActiveCampaign uses API keys
		IsActive:          true,
		SupportedFeatures: []string{"contacts", "deals", "campaigns"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}

func createZendeskPlatform() SimplePlatform {
	now := time.Now().Format(time.RFC3339)
	return SimplePlatform{
		PlatformID:        "zendesk",
		Name:              "Zendesk",
		Description:       "Customer service and support ticket platform",
		Category:          "Customer Support",
		Website:           "https://zendesk.com",
		LogoURL:           "https://logos.listbackup.ai/zendesk.png",
		RequiresOAuth:     false, // Zendesk uses API tokens
		IsActive:          true,
		SupportedFeatures: []string{"tickets", "users", "organizations"},
		CreatedAt:         now,
		UpdatedAt:         now,
	}
}