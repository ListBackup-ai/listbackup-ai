package connectors

import (
	"context"
	"fmt"
	"time"
)

// KeapConnector implements the Keap (Infusionsoft) data connector
type KeapConnector struct {
	*BaseConnector
	authToken string
}

// NewKeapConnector creates a new Keap connector
func NewKeapConnector(config map[string]interface{}) (*KeapConnector, error) {
	// Extract auth token (support both field names)
	var authToken string
	if token, exists := config["auth_token"].(string); exists {
		authToken = token
	} else if token, exists := config["apiToken"].(string); exists {
		authToken = token
	} else {
		return nil, fmt.Errorf("auth_token or apiToken is required for Keap connector")
	}

	connectorConfig := ConnectorConfig{
		Name:    "keap",
		Type:    "keap",
		BaseURL: "https://api.infusionsoft.com/crm/rest/v1",
		Auth: AuthConfig{
			Type:              "api_key",
			AuthorizationType: "Bearer",
			APIKey:            authToken,
		},
		RateLimitDelay: 2 * time.Second, // Conservative rate limiting for Keap
		Timeout:        30 * time.Second,
	}

	baseConnector := NewBaseConnector(connectorConfig)

	return &KeapConnector{
		BaseConnector: baseConnector,
		authToken:     authToken,
	}, nil
}

// Test tests the Keap API connection
func (kc *KeapConnector) Test(ctx context.Context) error {
	// Use businessProfile endpoint for authentication testing (v2 API)
	testURL := "https://api.infusionsoft.com/crm/rest/v2/businessProfile"
	
	resp, err := kc.MakeRequest(ctx, "GET", testURL, nil)
	if err != nil {
		return fmt.Errorf("keap API test failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("keap API test failed with status code: %d", resp.StatusCode)
	}

	return nil
}

// GetAvailableEndpoints returns all available Keap endpoints
func (kc *KeapConnector) GetAvailableEndpoints() []Endpoint {
	return []Endpoint{
		// REST API Endpoints
		{
			Name:        "contacts",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/contacts",
			Description: "Contact records with custom fields",
			Options: EndpointOptions{
				EntityKey:   "contacts",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
				ExtraParams: "optional_properties=lead_source_id,custom_fields,job_title",
			},
		},
		{
			Name:        "companies",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/companies",
			Description: "Company records",
			Options: EndpointOptions{
				EntityKey:   "companies",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "opportunities",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/opportunities",
			Description: "Sales opportunities and pipeline data",
			Options: EndpointOptions{
				EntityKey:   "opportunities",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "products",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/products",
			Description: "Product catalog",
			Options: EndpointOptions{
				EntityKey:   "products",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "orders",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/orders",
			Description: "E-commerce orders",
			Options: EndpointOptions{
				EntityKey:   "orders",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "transactions",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/transactions",
			Description: "Payment transactions",
			Options: EndpointOptions{
				EntityKey:   "transactions",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "subscriptions",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/subscriptions",
			Description: "Recurring billing subscriptions",
			Options: EndpointOptions{
				EntityKey:   "subscriptions",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "affiliates",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/affiliates",
			Description: "Affiliate program participants",
			Options: EndpointOptions{
				EntityKey:   "affiliates",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "campaigns",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/campaigns",
			Description: "Marketing campaigns",
			Options: EndpointOptions{
				EntityKey:   "campaigns",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "emails",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/emails",
			Description: "Email communications",
			Options: EndpointOptions{
				EntityKey:   "emails",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "tags",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/tags",
			Description: "Contact and company tags",
			Options: EndpointOptions{
				EntityKey:   "tags",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "tasks",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/tasks",
			Description: "Task and appointment records",
			Options: EndpointOptions{
				EntityKey:   "tasks",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "notes",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/notes",
			Description: "Contact and opportunity notes",
			Options: EndpointOptions{
				EntityKey:   "notes",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "files",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/files",
			Description: "File attachments",
			Options: EndpointOptions{
				EntityKey:   "files",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "users",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/users",
			Description: "User accounts and permissions",
			Options: EndpointOptions{
				EntityKey:   "users",
				LimitParam:  "limit",
				OffsetParam: "offset",
				Limit:       1000,
			},
		},
		{
			Name:        "setting",
			URL:         "https://api.infusionsoft.com/crm/rest/v1/setting/application/configuration",
			Description: "Application settings and configuration",
			Options: EndpointOptions{
				EntityKey:   "application_configuration",
				LimitParam:  "",
				OffsetParam: "",
				Limit:       0, // No pagination for settings
			},
		},
	}
}

// FetchData fetches data from a Keap endpoint
func (kc *KeapConnector) FetchData(ctx context.Context, endpoint Endpoint) ([]byte, error) {
	// Use the base connector's paginated data fetching
	return kc.FetchPaginatedData(ctx, endpoint)
}

// GetAuthToken returns the authentication token
func (kc *KeapConnector) GetAuthToken() string {
	return kc.authToken
}