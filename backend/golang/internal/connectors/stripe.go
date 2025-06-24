package connectors

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// StripeConnector implements the Stripe payment platform connector
type StripeConnector struct {
	*BaseConnector
	apiKey string
}

// NewStripeConnector creates a new Stripe connector
func NewStripeConnector(config map[string]interface{}) (*StripeConnector, error) {
	// Extract API key - support both test and live keys
	var apiKey string
	
	// Check for specific key types first
	if testKey, exists := config["test_key"].(string); exists {
		apiKey = testKey
	} else if liveKey, exists := config["live_key"].(string); exists {
		apiKey = liveKey
	} else if key, exists := config["api_key"].(string); exists {
		apiKey = key
	} else if secretKey, exists := config["secret_key"].(string); exists {
		apiKey = secretKey
	} else {
		// Default to v1 test key if nothing provided
		apiKey = "sk_test_51QKFtcE99XUS5klgPJM2JnxO7T3tyn5T9jMrt0VEXBA5cVO1IMGsViSBAiMopxYasMWTSyumxeplfbD8cwjfPTl400PHb1ZcTk"
	}
	
	// Validate key format
	if !strings.HasPrefix(apiKey, "sk_test_") && !strings.HasPrefix(apiKey, "sk_live_") {
		return nil, fmt.Errorf("invalid Stripe API key format - must start with sk_test_ or sk_live_")
	}

	connectorConfig := ConnectorConfig{
		Name:    "stripe",
		Type:    "stripe",
		BaseURL: "https://api.stripe.com/v1",
		Auth: AuthConfig{
			Type:              "api_key",
			AuthorizationType: "Bearer",
			APIKey:            apiKey,
		},
		RateLimitDelay: 1 * time.Second,
		Timeout:        30 * time.Second,
	}

	baseConnector := NewBaseConnector(connectorConfig)

	return &StripeConnector{
		BaseConnector: baseConnector,
		apiKey:        apiKey,
	}, nil
}

// Test tests the Stripe API connection
func (sc *StripeConnector) Test(ctx context.Context) error {
	testURL := "https://api.stripe.com/v1/account"
	
	resp, err := sc.MakeRequest(ctx, "GET", testURL, nil)
	if err != nil {
		return fmt.Errorf("stripe API test failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("stripe API test failed with status code: %d", resp.StatusCode)
	}

	return nil
}

// GetAvailableEndpoints returns all available Stripe endpoints
func (sc *StripeConnector) GetAvailableEndpoints() []Endpoint {
	return []Endpoint{
		{
			Name:        "customers",
			URL:         "https://api.stripe.com/v1/customers",
			Description: "Customer records",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "charges",
			URL:         "https://api.stripe.com/v1/charges",
			Description: "Payment charges",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "invoices",
			URL:         "https://api.stripe.com/v1/invoices",
			Description: "Customer invoices",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "subscriptions",
			URL:         "https://api.stripe.com/v1/subscriptions",
			Description: "Customer subscriptions",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "products",
			URL:         "https://api.stripe.com/v1/products",
			Description: "Products and services",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "prices",
			URL:         "https://api.stripe.com/v1/prices",
			Description: "Product pricing",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "payment_methods",
			URL:         "https://api.stripe.com/v1/payment_methods",
			Description: "Customer payment methods",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "payment_intents",
			URL:         "https://api.stripe.com/v1/payment_intents",
			Description: "Payment intents",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "refunds",
			URL:         "https://api.stripe.com/v1/refunds",
			Description: "Payment refunds",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "disputes",
			URL:         "https://api.stripe.com/v1/disputes",
			Description: "Payment disputes",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "balance_transactions",
			URL:         "https://api.stripe.com/v1/balance_transactions",
			Description: "Balance transactions",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "transfers",
			URL:         "https://api.stripe.com/v1/transfers",
			Description: "Money transfers",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "application_fees",
			URL:         "https://api.stripe.com/v1/application_fees",
			Description: "Application fees",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
		{
			Name:        "events",
			URL:         "https://api.stripe.com/v1/events",
			Description: "API events log",
			Options: EndpointOptions{
				EntityKey:  "data",
				LimitParam: "limit",
				Limit:      100,
			},
		},
	}
}

// FetchData fetches data from a Stripe endpoint
func (sc *StripeConnector) FetchData(ctx context.Context, endpoint Endpoint) ([]byte, error) {
	return sc.FetchPaginatedData(ctx, endpoint)
}