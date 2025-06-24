package main

import (
	"fmt"
	"log"
	"time"

	"github.com/listbackup/api/internal/config"
	"github.com/listbackup/api/internal/platformsdb"
	"github.com/listbackup/api/internal/types"
)

// Platform seed data based on OAuth configuration
var platformData = map[string]types.Platform{
	"google": {
		PlatformID:       "platform:google",
		Name:             "Google Workspace",
		Type:             "google",
		Category:         "Cloud Storage",
		Description:      "Google Drive, Sheets, and Workspace data backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/google.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/google",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://www.googleapis.com",
			AuthType:     "oauth",
			TestEndpoint: "/oauth2/v2/userinfo",
			Version:      "v2",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 10,
				RequestsPerMinute: 100,
				RequestsPerHour:   1000,
				BurstLimit:        20,
			},
		},
	},
	"hubspot": {
		PlatformID:       "platform:hubspot",
		Name:             "HubSpot",
		Type:             "hubspot",
		Category:         "CRM",
		Description:      "HubSpot CRM contacts, deals, and marketing data backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/hubspot.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/hubspot",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.hubapi.com",
			AuthType:     "oauth",
			TestEndpoint: "/integrations/v1/me",
			Version:      "v3",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 5,
				RequestsPerMinute: 100,
				RequestsPerHour:   40000,
				BurstLimit:        10,
			},
		},
	},
	"gohighlevel": {
		PlatformID:       "platform:gohighlevel",
		Name:             "GoHighLevel",
		Type:             "gohighlevel",
		Category:         "CRM",
		Description:      "GoHighLevel CRM contacts, campaigns, and automation data backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/gohighlevel.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/gohighlevel",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://services.leadconnectorhq.com",
			AuthType:     "oauth",
			TestEndpoint: "/oauth/locationInfo",
			Version:      "v1",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 3,
				RequestsPerMinute: 60,
				RequestsPerHour:   1000,
				BurstLimit:        5,
			},
		},
	},
	"dropbox": {
		PlatformID:       "platform:dropbox",
		Name:             "Dropbox",
		Type:             "dropbox",
		Category:         "Cloud Storage",
		Description:      "Dropbox file and folder backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/dropbox.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/dropbox",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.dropboxapi.com",
			AuthType:     "oauth",
			TestEndpoint: "/2/users/get_current_account",
			Version:      "v2",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 5,
				RequestsPerMinute: 100,
				RequestsPerHour:   1000,
				BurstLimit:        10,
			},
		},
	},
	"box": {
		PlatformID:       "platform:box",
		Name:             "Box",
		Type:             "box",
		Category:         "Cloud Storage",
		Description:      "Box file and folder backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/box.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/box",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.box.com",
			AuthType:     "oauth",
			TestEndpoint: "/2.0/users/me",
			Version:      "v2",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 5,
				RequestsPerMinute: 60,
				RequestsPerHour:   1000,
				BurstLimit:        10,
			},
		},
	},
	"quickbooks": {
		PlatformID:       "platform:quickbooks",
		Name:             "QuickBooks",
		Type:             "quickbooks",
		Category:         "Accounting",
		Description:      "QuickBooks accounting and financial data backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/quickbooks.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/quickbooks",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://sandbox-quickbooks.api.intuit.com",
			AuthType:     "oauth",
			TestEndpoint: "/v3/companyinfo",
			Version:      "v3",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 2,
				RequestsPerMinute: 30,
				RequestsPerHour:   500,
				BurstLimit:        5,
			},
		},
	},
	"shopify": {
		PlatformID:       "platform:shopify",
		Name:             "Shopify",
		Type:             "shopify",
		Category:         "E-commerce",
		Description:      "Shopify store, products, orders, and customer data backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/shopify.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/shopify",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://{shop}.myshopify.com",
			AuthType:     "oauth",
			TestEndpoint: "/admin/api/2024-01/shop.json",
			Version:      "2024-01",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 2,
				RequestsPerMinute: 40,
				RequestsPerHour:   1000,
				BurstLimit:        4,
			},
		},
	},
	"keap": {
		PlatformID:       "platform:keap",
		Name:             "Keap (Infusionsoft)",
		Type:             "keap",
		Category:         "CRM",
		Description:      "Keap CRM contacts, campaigns, and automation data backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/keap.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/keap",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.infusionsoft.com",
			AuthType:     "oauth",
			TestEndpoint: "/oauth/connect/userinfo",
			Version:      "v1",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 2,
				RequestsPerMinute: 120,
				RequestsPerHour:   5000,
				BurstLimit:        4,
			},
		},
	},
	"stripe": {
		PlatformID:       "platform:stripe",
		Name:             "Stripe",
		Type:             "stripe",
		Category:         "Payment",
		Description:      "Stripe payments, customers, and transaction data backup",
		Status:           "active",
		Version:          "v1",
		LogoURL:          "https://listbackup.ai/logos/stripe.svg",
		DocumentationURL: "https://docs.listbackup.ai/platforms/stripe",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.stripe.com",
			AuthType:     "oauth",
			TestEndpoint: "/v1/account",
			Version:      "v1",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 5,
				RequestsPerMinute: 100,
				RequestsPerHour:   1000,
				BurstLimit:        10,
			},
		},
	},
}

func createOAuthConfiguration(provider string) *types.OAuthConfiguration {
	oauthProvider, exists := config.OAuthProviders[provider]
	if !exists {
		return nil
	}

	return &types.OAuthConfiguration{
		AuthURL:      oauthProvider.AuthURL,
		TokenURL:     oauthProvider.TokenURL,
		UserInfoURL:  oauthProvider.UserInfoURL,
		Scopes:       oauthProvider.Scopes,
		ResponseType: "code",
	}
}

func main() {
	log.Println("Starting platform seed data creation...")

	// Initialize database client
	db, err := platformsdb.NewClient()
	if err != nil {
		log.Fatalf("Failed to create database client: %v", err)
	}

	tableName := "listbackup-main-platforms" // Default table name for main stage

	// Seed each platform
	for providerKey, platform := range platformData {
		// Add OAuth configuration
		platform.OAuth = createOAuthConfiguration(providerKey)
		
		// Set timestamps
		now := time.Now()
		platform.CreatedAt = now
		platform.UpdatedAt = now

		// Save to database
		err := db.PutItem(tableName, platform)
		if err != nil {
			log.Printf("Failed to seed platform %s: %v", platform.Name, err)
			continue
		}

		log.Printf("Successfully seeded platform: %s (%s)", platform.Name, platform.PlatformID)
	}

	log.Printf("Platform seeding completed. Seeded %d platforms.", len(platformData))
}