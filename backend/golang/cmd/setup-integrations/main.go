package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
)

func main() {
	ctx := context.Background()

	integrationService, err := services.NewIntegrationService(ctx)
	if err != nil {
		log.Fatalf("Failed to create integration service: %v", err)
	}

	// Sample integrations to set up
	integrations := []types.Integration{
		createKeapIntegration(),
		createStripeIntegration(),
		createGoHighLevelIntegration(),
		createHubSpotIntegration(),
		createMailChimpIntegration(),
	}

	for _, integration := range integrations {
		err := integrationService.CreateIntegration(ctx, integration)
		if err != nil {
			log.Printf("Failed to create integration %s: %v", integration.Type, err)
		} else {
			log.Printf("Created integration: %s", integration.Type)
		}
	}

	log.Println("Integration setup complete!")
}

func createKeapIntegration() types.Integration {
	return types.Integration{
		IntegrationID:   fmt.Sprintf("integration:%s", uuid.New().String()),
		Name:            "Keap",
		Type:            "keap",
		Category:        "CRM",
		Description:     "Keap (formerly Infusionsoft) CRM and marketing automation platform",
		Status:          "active",
		Version:         "2.0",
		LogoURL:         "https://cdn.listbackup.ai/logos/keap.png",
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
		BackupEndpoints: map[string]types.BackupEndpoint{
			"contacts": {
				Name:            "contacts",
				Description:     "Customer contacts and lead information",
				Path:            "/contacts",
				Method:          "GET",
				DataType:        "contacts",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{},
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
			"orders": {
				Name:            "orders",
				Description:     "Order and transaction data",
				Path:            "/orders",
				Method:          "GET",
				DataType:        "orders",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{"contacts"},
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
			"campaigns": {
				Name:            "campaigns",
				Description:     "Email marketing campaigns",
				Path:            "/campaigns",
				Method:          "GET",
				DataType:        "campaigns",
				DefaultEnabled:  true,
				DefaultPriority: "medium",
				DefaultFrequency: "weekly",
				IncrementalSync: false,
				Dependencies:    []string{},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
					{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.campaigns",
					IDField:        "id",
					TimestampField: "created_date",
					PaginationKey:  "offset",
					FieldMappings: map[string]string{
						"id":           "campaign_id",
						"name":         "campaign_name",
						"subject":      "email_subject",
						"created_date": "date_created",
						"status":       "campaign_status",
					},
				},
			},
			"tags": {
				Name:            "tags",
				Description:     "Contact tags and categories",
				Path:            "/tags",
				Method:          "GET",
				DataType:        "tags",
				DefaultEnabled:  true,
				DefaultPriority: "low",
				DefaultFrequency: "weekly",
				IncrementalSync: false,
				Dependencies:    []string{},
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
		DefaultSettings: types.IntegrationDefaults{
			BackupSettings: types.BackupSettings{
				Enabled:       true,
				Schedule:      "0 2 * * *", // Daily at 2 AM
				RetentionDays: 90,
				Endpoints:     make(map[string]types.EndpointConfig),
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
			},
			RetentionDays: 90,
			Schedule:      "0 2 * * *",
			Notifications: types.BackupNotificationSettings{
				OnSuccess:   false,
				OnFailure:   true,
				OnSizeLimit: true,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func createStripeIntegration() types.Integration {
	return types.Integration{
		IntegrationID:   fmt.Sprintf("integration:%s", uuid.New().String()),
		Name:            "Stripe",
		Type:            "stripe",
		Category:        "Payment",
		Description:     "Stripe payment processing platform",
		Status:          "active",
		Version:         "2020-08-27",
		LogoURL:         "https://cdn.listbackup.ai/logos/stripe.png",
		DocumentationURL: "https://stripe.com/docs/api",
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.stripe.com/v1",
			AuthType:     "bearer",
			TestEndpoint: "/account",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 25,
				RequestsPerMinute: 1000,
				RequestsPerHour:   100000,
				BurstLimit:        100,
			},
			RequiredHeaders: map[string]string{
				"Content-Type": "application/x-www-form-urlencoded",
			},
			Version: "2020-08-27",
		},
		BackupEndpoints: map[string]types.BackupEndpoint{
			"customers": {
				Name:            "customers",
				Description:     "Customer records and metadata",
				Path:            "/customers",
				Method:          "GET",
				DataType:        "customers",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "starting_after", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "created[gte]", Type: "integer", Required: false, Default: "", Description: "Only return customers created after this timestamp"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.data",
					IDField:        "id",
					TimestampField: "created",
					PaginationKey:  "starting_after",
				},
			},
			"charges": {
				Name:            "charges",
				Description:     "Payment charges and transactions",
				Path:            "/charges",
				Method:          "GET",
				DataType:        "charges",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{"customers"},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "starting_after", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "created[gte]", Type: "integer", Required: false, Default: "", Description: "Only return charges created after this timestamp"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.data",
					IDField:        "id",
					TimestampField: "created",
					PaginationKey:  "starting_after",
				},
			},
			"subscriptions": {
				Name:            "subscriptions",
				Description:     "Recurring subscription data",
				Path:            "/subscriptions",
				Method:          "GET",
				DataType:        "subscriptions",
				DefaultEnabled:  true,
				DefaultPriority: "medium",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{"customers"},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "starting_after", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "created[gte]", Type: "integer", Required: false, Default: "", Description: "Only return subscriptions created after this timestamp"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.data",
					IDField:        "id",
					TimestampField: "created",
					PaginationKey:  "starting_after",
				},
			},
		},
		DefaultSettings: types.IntegrationDefaults{
			BackupSettings: types.BackupSettings{
				Enabled:       true,
				Schedule:      "0 2 * * *",
				RetentionDays: 365, // Financial data kept longer
				Endpoints:     make(map[string]types.EndpointConfig),
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
			},
			RetentionDays: 365,
			Schedule:      "0 2 * * *",
			Notifications: types.BackupNotificationSettings{
				OnSuccess:   false,
				OnFailure:   true,
				OnSizeLimit: true,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func createGoHighLevelIntegration() types.Integration {
	return types.Integration{
		IntegrationID:   fmt.Sprintf("integration:%s", uuid.New().String()),
		Name:            "GoHighLevel",
		Type:            "gohighlevel",
		Category:        "CRM",
		Description:     "GoHighLevel CRM and marketing automation platform",
		Status:          "active",
		Version:         "1.0",
		LogoURL:         "https://cdn.listbackup.ai/logos/gohighlevel.png",
		DocumentationURL: "https://highlevel.stoplight.io/docs/integrations/",
		OAuth: &types.OAuthConfiguration{
			AuthURL:      "https://marketplace.gohighlevel.com/oauth/chooselocation",
			TokenURL:     "https://services.leadconnectorhq.com/oauth/token",
			UserInfoURL:  "https://services.leadconnectorhq.com/locations/",
			Scopes:       []string{"locations.readonly", "contacts.readonly", "opportunities.readonly"},
			ResponseType: "code",
		},
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://services.leadconnectorhq.com",
			AuthType:     "oauth",
			TestEndpoint: "/locations/",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 10,
				RequestsPerMinute: 600,
				RequestsPerHour:   36000,
				BurstLimit:        50,
			},
			RequiredHeaders: map[string]string{
				"Content-Type": "application/json",
				"Version":      "2021-07-28",
			},
			Version: "2021-07-28",
		},
		BackupEndpoints: map[string]types.BackupEndpoint{
			"contacts": {
				Name:            "contacts",
				Description:     "Contact and lead information",
				Path:            "/contacts/",
				Method:          "GET",
				DataType:        "contacts",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "startAfterId", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "dateUpdated", Type: "integer", Required: false, Default: "", Description: "Only return contacts updated after this timestamp"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.contacts",
					IDField:        "id",
					TimestampField: "dateUpdated",
					PaginationKey:  "startAfterId",
				},
			},
			"opportunities": {
				Name:            "opportunities",
				Description:     "Sales opportunities and pipeline data",
				Path:            "/opportunities/",
				Method:          "GET",
				DataType:        "opportunities",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{"contacts"},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "startAfterId", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "dateUpdated", Type: "integer", Required: false, Default: "", Description: "Only return opportunities updated after this timestamp"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.opportunities",
					IDField:        "id",
					TimestampField: "dateUpdated",
					PaginationKey:  "startAfterId",
				},
			},
		},
		DefaultSettings: types.IntegrationDefaults{
			BackupSettings: types.BackupSettings{
				Enabled:       true,
				Schedule:      "0 2 * * *",
				RetentionDays: 90,
				Endpoints:     make(map[string]types.EndpointConfig),
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
			},
			RetentionDays: 90,
			Schedule:      "0 2 * * *",
			Notifications: types.BackupNotificationSettings{
				OnSuccess:   false,
				OnFailure:   true,
				OnSizeLimit: true,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func createHubSpotIntegration() types.Integration {
	return types.Integration{
		IntegrationID:   fmt.Sprintf("integration:%s", uuid.New().String()),
		Name:            "HubSpot",
		Type:            "hubspot",
		Category:        "CRM",
		Description:     "HubSpot CRM and marketing platform",
		Status:          "active",
		Version:         "v3",
		LogoURL:         "https://cdn.listbackup.ai/logos/hubspot.png",
		DocumentationURL: "https://developers.hubspot.com/docs/api/overview",
		OAuth: &types.OAuthConfiguration{
			AuthURL:      "https://app.hubspot.com/oauth/authorize",
			TokenURL:     "https://api.hubapi.com/oauth/v1/token",
			UserInfoURL:  "https://api.hubapi.com/account-info/v3/api-usage",
			Scopes:       []string{"contacts", "companies", "deals", "tickets"},
			ResponseType: "code",
		},
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://api.hubapi.com",
			AuthType:     "oauth",
			TestEndpoint: "/account-info/v3/api-usage",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 10,
				RequestsPerMinute: 100,
				RequestsPerHour:   40000,
				BurstLimit:        100,
			},
			RequiredHeaders: map[string]string{
				"Content-Type": "application/json",
			},
			Version: "v3",
		},
		BackupEndpoints: map[string]types.BackupEndpoint{
			"contacts": {
				Name:            "contacts",
				Description:     "Contact records and properties",
				Path:            "/crm/v3/objects/contacts",
				Method:          "GET",
				DataType:        "contacts",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "after", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "lastModifiedDate", Type: "datetime", Required: false, Default: "", Description: "Only return contacts modified since this date"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.results",
					IDField:        "id",
					TimestampField: "updatedAt",
					PaginationKey:  "after",
				},
			},
			"companies": {
				Name:            "companies",
				Description:     "Company records and properties",
				Path:            "/crm/v3/objects/companies",
				Method:          "GET",
				DataType:        "companies",
				DefaultEnabled:  true,
				DefaultPriority: "medium",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "after", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "lastModifiedDate", Type: "datetime", Required: false, Default: "", Description: "Only return companies modified since this date"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.results",
					IDField:        "id",
					TimestampField: "updatedAt",
					PaginationKey:  "after",
				},
			},
			"deals": {
				Name:            "deals",
				Description:     "Deal and sales pipeline data",
				Path:            "/crm/v3/objects/deals",
				Method:          "GET",
				DataType:        "deals",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{"contacts", "companies"},
				Parameters: []types.APIParameter{
					{Name: "limit", Type: "integer", Required: false, Default: "100", Description: "Number of records per page"},
					{Name: "after", Type: "string", Required: false, Default: "", Description: "Cursor for pagination"},
					{Name: "lastModifiedDate", Type: "datetime", Required: false, Default: "", Description: "Only return deals modified since this date"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.results",
					IDField:        "id",
					TimestampField: "updatedAt",
					PaginationKey:  "after",
				},
			},
		},
		DefaultSettings: types.IntegrationDefaults{
			BackupSettings: types.BackupSettings{
				Enabled:       true,
				Schedule:      "0 3 * * *", // 3 AM to avoid peak times
				RetentionDays: 90,
				Endpoints:     make(map[string]types.EndpointConfig),
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
			},
			RetentionDays: 90,
			Schedule:      "0 3 * * *",
			Notifications: types.BackupNotificationSettings{
				OnSuccess:   false,
				OnFailure:   true,
				OnSizeLimit: true,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func createMailChimpIntegration() types.Integration {
	return types.Integration{
		IntegrationID:   fmt.Sprintf("integration:%s", uuid.New().String()),
		Name:            "MailChimp",
		Type:            "mailchimp",
		Category:        "Email Marketing",
		Description:     "MailChimp email marketing platform",
		Status:          "active",
		Version:         "3.0",
		LogoURL:         "https://cdn.listbackup.ai/logos/mailchimp.png",
		DocumentationURL: "https://mailchimp.com/developer/marketing/",
		OAuth: &types.OAuthConfiguration{
			AuthURL:      "https://login.mailchimp.com/oauth2/authorize",
			TokenURL:     "https://login.mailchimp.com/oauth2/token",
			UserInfoURL:  "https://login.mailchimp.com/oauth2/metadata",
			Scopes:       []string{},
			ResponseType: "code",
		},
		APIConfig: types.APIConfiguration{
			BaseURL:      "https://{dc}.api.mailchimp.com/3.0",
			AuthType:     "oauth",
			TestEndpoint: "/",
			RateLimits: types.RateLimitConfig{
				RequestsPerSecond: 10,
				RequestsPerMinute: 1000,
				RequestsPerHour:   60000,
				BurstLimit:        10,
			},
			RequiredHeaders: map[string]string{
				"Content-Type": "application/json",
			},
			Version: "3.0",
		},
		BackupEndpoints: map[string]types.BackupEndpoint{
			"lists": {
				Name:            "lists",
				Description:     "Email lists and audience data",
				Path:            "/lists",
				Method:          "GET",
				DataType:        "lists",
				DefaultEnabled:  true,
				DefaultPriority: "medium",
				DefaultFrequency: "weekly",
				IncrementalSync: false,
				Dependencies:    []string{},
				Parameters: []types.APIParameter{
					{Name: "count", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
					{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:      "$.lists",
					IDField:       "id",
					PaginationKey: "offset",
				},
			},
			"members": {
				Name:            "members",
				Description:     "List members and subscriber data",
				Path:            "/lists/{list_id}/members",
				Method:          "GET",
				DataType:        "members",
				DefaultEnabled:  true,
				DefaultPriority: "high",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{"lists"},
				Parameters: []types.APIParameter{
					{Name: "count", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
					{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
					{Name: "since_last_changed", Type: "datetime", Required: false, Default: "", Description: "Only return members changed since this date"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.members",
					IDField:        "id",
					TimestampField: "last_changed",
					PaginationKey:  "offset",
				},
			},
			"campaigns": {
				Name:            "campaigns",
				Description:     "Email campaigns and statistics",
				Path:            "/campaigns",
				Method:          "GET",
				DataType:        "campaigns",
				DefaultEnabled:  true,
				DefaultPriority: "medium",
				DefaultFrequency: "daily",
				IncrementalSync: true,
				Dependencies:    []string{},
				Parameters: []types.APIParameter{
					{Name: "count", Type: "integer", Required: false, Default: "1000", Description: "Number of records per page"},
					{Name: "offset", Type: "integer", Required: false, Default: "0", Description: "Record offset for pagination"},
					{Name: "since_create_time", Type: "datetime", Required: false, Default: "", Description: "Only return campaigns created since this date"},
				},
				ResponseMapping: types.ResponseMapping{
					DataPath:       "$.campaigns",
					IDField:        "id",
					TimestampField: "create_time",
					PaginationKey:  "offset",
				},
			},
		},
		DefaultSettings: types.IntegrationDefaults{
			BackupSettings: types.BackupSettings{
				Enabled:       true,
				Schedule:      "0 4 * * *", // 4 AM
				RetentionDays: 90,
				Endpoints:     make(map[string]types.EndpointConfig),
				Notifications: types.BackupNotificationSettings{
					OnSuccess:   false,
					OnFailure:   true,
					OnSizeLimit: true,
				},
			},
			RetentionDays: 90,
			Schedule:      "0 4 * * *",
			Notifications: types.BackupNotificationSettings{
				OnSuccess:   false,
				OnFailure:   true,
				OnSizeLimit: true,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}