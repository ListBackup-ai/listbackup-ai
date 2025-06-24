package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/listbackup/api/internal/database"
	"github.com/listbackup/api/internal/types"
)

func main() {
	ctx := context.Background()

	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create DynamoDB client: %v", err)
	}

	// Create Keap platform
	platform := createKeapPlatform()
	err = db.PutItem(ctx, database.PlatformsTable, platform)
	if err != nil {
		log.Fatalf("Failed to create Keap platform: %v", err)
	}
	log.Printf("Created Keap platform: %s", platform.PlatformID)

	// Create Keap platform sources
	platformSources := createKeapPlatformSources(platform.PlatformID)
	for _, source := range platformSources {
		err = db.PutItem(ctx, database.PlatformSourcesTable, source)
		if err != nil {
			log.Printf("Failed to create platform source %s: %v", source.Name, err)
		} else {
			log.Printf("Created platform source: %s", source.Name)
		}
	}

	log.Println("Keap platform setup complete!")
}

func createKeapPlatform() types.Platform {
	return types.Platform{
		PlatformID:   "platform:keap",
		Name:         "Keap",
		Type:         "keap",
		Category:     "CRM",
		Description:  "Keap (formerly Infusionsoft) is a CRM and marketing automation platform for small businesses",
		Status:       "active",
		Version:      "2.0",
		LogoURL:      "https://cdn.listbackup.ai/logos/keap.png",
		DocumentationURL: "https://developer.keap.com/docs/rest/",
		OAuth: &types.OAuthConfiguration{
			AuthURL:      "https://accounts.infusionsoft.com/app/oauth/authorize",
			TokenURL:     "https://api.infusionsoft.com/token",
			UserInfoURL:  "https://api.infusionsoft.com/crm/rest/v2/businessProfile",
			Scopes:       []string{"full"},
			ResponseType: "code",
		},
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.infusionsoft.com/crm/rest/v2",
			AuthType:     "oauth",
			TestEndpoint: "/businessProfile",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 4,
				RequestsPerMinute: 125,
				RequestsPerHour:   5000,
				BurstLimit:        10,
			},
			RequiredHeaders: map[string]string{
				"Content-Type": "application/json",
			},
			Version: "v2",
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func createKeapPlatformSources(platformID string) []types.PlatformSource {
	sources := []types.PlatformSource{
		{
			PlatformSourceID: fmt.Sprintf("platform-source:%s", uuid.New().String()),
			PlatformID:       platformID,
			Name:             "Keap Contacts",
			Description:      "Backup all contact records including custom fields, tags, and contact history",
			DataType:         "contacts",
			Icon:             "users",
			Category:         "Core",
			Popularity:       100, // Most popular
			Status:           "active",
			DefaultSettings: types.PlatformSourceDefaults{
				Enabled:         true,
				Priority:        "high",
				Frequency:       "daily",
				RetentionDays:   90,
				IncrementalSync: true,
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
				CustomParams: map[string]string{
					"limit":      "1000",
					"order":      "id",
					"order_direction": "ascending",
				},
			},
			Endpoints: map[string]types.PlatformEndpoint{
				"contacts": {
					Name:                "contacts",
					Description:         "Contact records endpoint",
					Path:                "/contacts",
					Method:              "GET",
					DataType:            "contacts",
					DefaultEnabled:      true,
					DefaultPriority:     "high",
					DefaultFrequency:    "daily",
					SupportsIncremental: true,
					Dependencies:        []string{},
					Parameters: []types.APIParameter{
						{Name: "limit", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
						{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
						{Name: "since", Type: "datetime", Required: false, Default: "", Description: "Only return contacts modified since this date"},
					},
					ResponseMapping: types.ResponseMapping{
						DataPath:       "$.contacts",
						IDField:        "id",
						TimestampField: "last_updated",
						PaginationKey:  "offset",
						FieldMappings: map[string]string{
							"id":           "contact_id",
							"email":        "email_address",
							"first_name":   "given_name",
							"last_name":    "family_name",
							"phone":        "phone_number",
							"company":      "company_name",
							"last_updated": "date_modified",
						},
					},
				},
			},
			Dependencies: []string{},
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			PlatformSourceID: fmt.Sprintf("platform-source:%s", uuid.New().String()),
			PlatformID:       platformID,
			Name:             "Keap Orders",
			Description:      "Backup all order and transaction data including line items and payment information",
			DataType:         "orders",
			Icon:             "shopping-cart",
			Category:         "Sales",
			Popularity:       90,
			Status:           "active",
			DefaultSettings: types.PlatformSourceDefaults{
				Enabled:         true,
				Priority:        "high",
				Frequency:       "daily",
				RetentionDays:   365, // Financial data kept longer
				IncrementalSync: true,
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
				CustomParams: map[string]string{
					"limit":           "1000",
					"order":           "order_date",
					"order_direction": "descending",
				},
			},
			Endpoints: map[string]types.PlatformEndpoint{
				"orders": {
					Name:                "orders",
					Description:         "Order records endpoint",
					Path:                "/orders",
					Method:              "GET",
					DataType:            "orders",
					DefaultEnabled:      true,
					DefaultPriority:     "high",
					DefaultFrequency:    "daily",
					SupportsIncremental: true,
					Dependencies:        []string{"contacts"},
					Parameters: []types.APIParameter{
						{Name: "limit", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
						{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
						{Name: "since", Type: "datetime", Required: false, Default: "", Description: "Only return orders created since this date"},
					},
					ResponseMapping: types.ResponseMapping{
						DataPath:       "$.orders",
						IDField:        "id",
						TimestampField: "order_date",
						PaginationKey:  "offset",
						FieldMappings: map[string]string{
							"id":          "order_id",
							"contact_id":  "customer_id",
							"order_date":  "date_created",
							"order_total": "total_amount",
							"status":      "order_status",
						},
					},
				},
			},
			Dependencies: []string{"platform-source:keap-contacts"}, // Depends on contacts being backed up first
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			PlatformSourceID: fmt.Sprintf("platform-source:%s", uuid.New().String()),
			PlatformID:       platformID,
			Name:             "Keap Campaigns",
			Description:      "Backup email marketing campaigns, sequences, and automation workflows",
			DataType:         "campaigns",
			Icon:             "mail",
			Category:         "Marketing",
			Popularity:       70,
			Status:           "active",
			DefaultSettings: types.PlatformSourceDefaults{
				Enabled:         true,
				Priority:        "medium",
				Frequency:       "weekly",
				RetentionDays:   90,
				IncrementalSync: false, // Campaigns don't change frequently
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
				CustomParams: map[string]string{
					"limit": "1000",
				},
			},
			Endpoints: map[string]types.PlatformEndpoint{
				"campaigns": {
					Name:                "campaigns",
					Description:         "Email campaigns endpoint",
					Path:                "/campaigns",
					Method:              "GET",
					DataType:            "campaigns",
					DefaultEnabled:      true,
					DefaultPriority:     "medium",
					DefaultFrequency:    "weekly",
					SupportsIncremental: false,
					Dependencies:        []string{},
					Parameters: []types.APIParameter{
						{Name: "limit", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
						{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
					},
					ResponseMapping: types.ResponseMapping{
						DataPath:      "$.campaigns",
						IDField:       "id",
						TimestampField: "created_date",
						PaginationKey: "offset",
						FieldMappings: map[string]string{
							"id":           "campaign_id",
							"name":         "campaign_name",
							"subject":      "email_subject",
							"created_date": "date_created",
							"status":       "campaign_status",
						},
					},
				},
			},
			Dependencies: []string{},
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			PlatformSourceID: fmt.Sprintf("platform-source:%s", uuid.New().String()),
			PlatformID:       platformID,
			Name:             "Keap Tags",
			Description:      "Backup contact tags and categories for organizing and segmenting contacts",
			DataType:         "tags",
			Icon:             "tag",
			Category:         "Organization",
			Popularity:       50,
			Status:           "active",
			DefaultSettings: types.PlatformSourceDefaults{
				Enabled:         false, // Optional by default
				Priority:        "low",
				Frequency:       "weekly",
				RetentionDays:   90,
				IncrementalSync: false,
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
				CustomParams: map[string]string{
					"limit": "1000",
				},
			},
			Endpoints: map[string]types.PlatformEndpoint{
				"tags": {
					Name:                "tags",
					Description:         "Contact tags endpoint",
					Path:                "/tags",
					Method:              "GET",
					DataType:            "tags",
					DefaultEnabled:      true,
					DefaultPriority:     "low",
					DefaultFrequency:    "weekly",
					SupportsIncremental: false,
					Dependencies:        []string{},
					Parameters: []types.APIParameter{
						{Name: "limit", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
						{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
					},
					ResponseMapping: types.ResponseMapping{
						DataPath:      "$.tags",
						IDField:       "id",
						PaginationKey: "offset",
						FieldMappings: map[string]string{
							"id":          "tag_id",
							"name":        "tag_name",
							"description": "tag_description",
						},
					},
				},
			},
			Dependencies: []string{},
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
	}

	return sources
}