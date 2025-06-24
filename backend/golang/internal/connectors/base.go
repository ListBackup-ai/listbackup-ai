package connectors

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Connector interface defines the contract for all integration connectors
type Connector interface {
	Test(ctx context.Context) error
	GetAvailableEndpoints() []Endpoint
	FetchData(ctx context.Context, endpoint Endpoint) ([]byte, error)
	GetName() string
	GetType() string
}

// Endpoint represents a data endpoint
type Endpoint struct {
	Name        string            `json:"name"`
	URL         string            `json:"url"`
	Description string            `json:"description"`
	Options     EndpointOptions   `json:"options"`
}

// EndpointOptions represents configuration options for an endpoint
type EndpointOptions struct {
	EntityKey    string `json:"entityKey"`
	LimitParam   string `json:"limitParam"`
	OffsetParam  string `json:"offsetParam"`
	Limit        int    `json:"limit"`
	ExtraParams  string `json:"extraParams"`
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	Type              string `json:"type"`
	AuthorizationType string `json:"authorization_type"`
	APIKey            string `json:"api_key"`
	Username          string `json:"username"`
	Password          string `json:"password"`
	Token             string `json:"token"`
	ClientID          string `json:"client_id"`
	ClientSecret      string `json:"client_secret"`
}

// ConnectorConfig represents the configuration for a connector
type ConnectorConfig struct {
	Name            string                 `json:"name"`
	Type            string                 `json:"type"`
	BaseURL         string                 `json:"baseUrl"`
	Auth            AuthConfig             `json:"auth"`
	RateLimitDelay  time.Duration          `json:"rateLimitDelay"`
	Timeout         time.Duration          `json:"timeout"`
	CustomHeaders   map[string]string      `json:"customHeaders"`
	ExtraConfig     map[string]interface{} `json:"extraConfig"`
}

// BaseConnector provides common functionality for all connectors
type BaseConnector struct {
	Config     ConnectorConfig
	HTTPClient *http.Client
}

// NewBaseConnector creates a new base connector
func NewBaseConnector(config ConnectorConfig) *BaseConnector {
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}
	if config.RateLimitDelay == 0 {
		config.RateLimitDelay = 1 * time.Second
	}

	return &BaseConnector{
		Config: config,
		HTTPClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// MakeRequest makes an HTTP request with authentication
func (bc *BaseConnector) MakeRequest(ctx context.Context, method, url string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add authentication
	switch bc.Config.Auth.Type {
	case "api_key":
		if bc.Config.Auth.AuthorizationType == "Bearer" {
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bc.Config.Auth.APIKey))
		} else {
			req.Header.Set("X-API-Key", bc.Config.Auth.APIKey)
		}
	case "basic":
		req.SetBasicAuth(bc.Config.Auth.Username, bc.Config.Auth.Password)
	case "oauth":
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bc.Config.Auth.Token))
	}

	// Add custom headers
	for key, value := range bc.Config.CustomHeaders {
		req.Header.Set(key, value)
	}

	// Set default content type
	if req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}

	// Rate limiting
	time.Sleep(bc.Config.RateLimitDelay)

	resp, err := bc.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}

	return resp, nil
}

// FetchPaginatedData fetches data with pagination support
func (bc *BaseConnector) FetchPaginatedData(ctx context.Context, endpoint Endpoint) ([]byte, error) {
	var allData []json.RawMessage
	offset := 0
	limit := endpoint.Options.Limit
	if limit == 0 {
		limit = 100 // Default limit
	}

	for {
		// Build URL with pagination parameters
		u, err := url.Parse(endpoint.URL)
		if err != nil {
			return nil, fmt.Errorf("invalid endpoint URL: %v", err)
		}

		q := u.Query()
		if endpoint.Options.LimitParam != "" {
			q.Set(endpoint.Options.LimitParam, fmt.Sprintf("%d", limit))
		}
		if endpoint.Options.OffsetParam != "" {
			q.Set(endpoint.Options.OffsetParam, fmt.Sprintf("%d", offset))
		}

		// Add extra parameters
		if endpoint.Options.ExtraParams != "" {
			params := strings.Split(endpoint.Options.ExtraParams, "&")
			for _, param := range params {
				parts := strings.SplitN(param, "=", 2)
				if len(parts) == 2 {
					q.Set(parts[0], parts[1])
				}
			}
		}

		u.RawQuery = q.Encode()

		// Make request
		resp, err := bc.MakeRequest(ctx, "GET", u.String(), nil)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch data: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
		}

		// Read response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read response body: %v", err)
		}

		// Parse response
		var response map[string]interface{}
		if err := json.Unmarshal(body, &response); err != nil {
			return nil, fmt.Errorf("failed to parse response: %v", err)
		}

		// Extract data based on entity key
		var pageData []json.RawMessage
		if endpoint.Options.EntityKey != "" {
			if data, exists := response[endpoint.Options.EntityKey]; exists {
				if dataArray, ok := data.([]interface{}); ok {
					for _, item := range dataArray {
						itemBytes, _ := json.Marshal(item)
						pageData = append(pageData, itemBytes)
					}
				}
			}
		} else {
			// If no entity key, assume the response is the data array
			if dataArray, ok := response["data"].([]interface{}); ok {
				for _, item := range dataArray {
					itemBytes, _ := json.Marshal(item)
					pageData = append(pageData, itemBytes)
				}
			}
		}

		allData = append(allData, pageData...)

		// Check if we should continue pagination
		if len(pageData) < limit {
			break // No more data
		}

		offset += limit

		// Respect rate limiting
		time.Sleep(bc.Config.RateLimitDelay)
	}

	// Convert all data to JSON
	result, err := json.Marshal(allData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal result: %v", err)
	}

	return result, nil
}

// GetName returns the connector name
func (bc *BaseConnector) GetName() string {
	return bc.Config.Name
}

// GetType returns the connector type
func (bc *BaseConnector) GetType() string {
	return bc.Config.Type
}