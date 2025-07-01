package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type OAuthState struct {
	StateID      string    `json:"stateId" dynamodbav:"stateId"`
	Provider     string    `json:"provider" dynamodbav:"provider"`
	UserID       string    `json:"userId" dynamodbav:"userId"`
	AccountID    string    `json:"accountId" dynamodbav:"accountId"`
	RedirectURI  string    `json:"redirectUri" dynamodbav:"redirectUri"`
	ShopDomain   string    `json:"shopDomain,omitempty" dynamodbav:"shopDomain"`
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt    time.Time `json:"expiresAt" dynamodbav:"expiresAt"`
}

type Platform struct {
	PlatformID string              `json:"platformId" dynamodbav:"platformId"`
	Name       string              `json:"name" dynamodbav:"name"`
	OAuth      *OAuthConfiguration `json:"oauth,omitempty" dynamodbav:"oauth"`
}

type OAuthConfiguration struct {
	ClientID     string   `json:"clientId" dynamodbav:"clientId"`
	ClientSecret string   `json:"clientSecret" dynamodbav:"clientSecret"`
	AuthURL      string   `json:"authUrl" dynamodbav:"authUrl"`
	TokenURL     string   `json:"tokenUrl" dynamodbav:"tokenUrl"`
	Scopes       []string `json:"scopes" dynamodbav:"scopes"`
	ResponseType string   `json:"responseType" dynamodbav:"responseType"`
}

type PlatformConnection struct {
	ConnectionID string                 `json:"connectionId" dynamodbav:"connectionId"`
	AccountID    string                 `json:"accountId" dynamodbav:"accountId"`
	UserID       string                 `json:"userId" dynamodbav:"userId"`
	PlatformID   string                 `json:"platformId" dynamodbav:"platformId"`
	Name         string                 `json:"name" dynamodbav:"name"`
	Status       string                 `json:"status" dynamodbav:"status"`
	AuthType     string                 `json:"authType" dynamodbav:"authType"`
	Credentials  map[string]interface{} `json:"credentials,omitempty" dynamodbav:"credentials"`
	ExpiresAt    *time.Time             `json:"expiresAt,omitempty" dynamodbav:"expiresAt"`
	CreatedAt    time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

var (
	oauthStatesTable         = os.Getenv("OAUTH_STATES_TABLE")
	platformsTable           = os.Getenv("PLATFORMS_TABLE")
	platformConnectionsTable = os.Getenv("PLATFORM_CONNECTIONS_TABLE")
)

func Handle(event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Get provider from path parameters
	provider := event.PathParameters["provider"]
	if provider == "" {
		return createErrorResponse(400, "Provider is required"), nil
	}

	// Validate provider
	if !isValidProvider(provider) {
		return createErrorResponse(400, "Unsupported provider: "+provider), nil
	}

	// Get authorization code and state from query parameters
	code := event.QueryStringParameters["code"]
	state := event.QueryStringParameters["state"]
	errorParam := event.QueryStringParameters["error"]
	errorDescription := event.QueryStringParameters["error_description"]

	log.Printf("OAuth callback for provider %s with code present: %v, state: %s", provider, code != "", state)

	// Check for OAuth errors
	if errorParam != "" {
		log.Printf("OAuth error for provider %s: %s - %s", provider, errorParam, errorDescription)
		return redirectWithError(provider, errorParam, errorDescription), nil
	}

	// Validate required parameters
	if code == "" {
		log.Printf("Missing authorization code for provider %s", provider)
		return redirectWithError(provider, "missing_code", "Authorization code not provided"), nil
	}

	if state == "" {
		log.Printf("Missing state parameter for provider %s", provider)
		return redirectWithError(provider, "missing_state", "State parameter not provided"), nil
	}

	// Get table names from environment
	if oauthStatesTable == "" {
		oauthStatesTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-oauth-states"
	}
	if platformsTable == "" {
		platformsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}
	if platformConnectionsTable == "" {
		platformConnectionsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platform-connections"
	}

	// Validate state and get user info
	oauthState, err := validateOAuthState(state)
	if err != nil {
		log.Printf("Failed to validate OAuth state: %v", err)
		return redirectWithError(provider, "invalid_state", "Invalid or expired state parameter"), nil
	}

	// Build redirect URI (same as used in oauth-start)
	baseURL := getBaseURL(event)
	redirectURI := getRedirectURI(provider, baseURL)

	// Special handling for Shopify
	if provider == "shopify" {
		if shop := event.QueryStringParameters["shop"]; shop != "" {
			redirectURI = replaceShopDomain(redirectURI, shop)
		} else if oauthState.ShopDomain != "" {
			redirectURI = replaceShopDomain(redirectURI, oauthState.ShopDomain)
		}
	}

	// Exchange code for tokens
	tokens, err := exchangeCodeForToken(provider, code, redirectURI)
	if err != nil {
		log.Printf("Failed to exchange code for token for provider %s: %v", provider, err)
		return redirectWithError(provider, "token_exchange_failed", err.Error()), nil
	}

	// Create platform connection
	connection, err := createPlatformConnection(provider, oauthState, tokens)
	if err != nil {
		log.Printf("Failed to create platform connection: %v", err)
		return redirectWithError(provider, "connection_failed", err.Error()), nil
	}

	log.Printf("OAuth callback completed successfully for provider %s, connection %s", provider, connection.ConnectionID)

	// Redirect to success page
	return redirectWithSuccess(provider, connection), nil
}

func validateOAuthState(stateID string) (*OAuthState, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(oauthStatesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"stateId": {
				S: aws.String(stateID),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("state not found")
	}

	var state OAuthState
	err = dynamodbattribute.UnmarshalMap(result.Item, &state)
	if err != nil {
		return nil, err
	}

	// Check if state has expired
	if time.Now().After(state.ExpiresAt) {
		return nil, fmt.Errorf("state has expired")
	}

	// Delete state after validation (one-time use)
	_, _ = svc.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(oauthStatesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"stateId": {
				S: aws.String(stateID),
			},
		},
	})

	return &state, nil
}

func exchangeCodeForToken(provider, code, redirectURI string) (map[string]interface{}, error) {
	// Get platform OAuth configuration
	platformID := "platform:" + provider
	platform, err := getPlatformFromDB(platformID)
	if err != nil {
		return nil, fmt.Errorf("failed to get platform config: %w", err)
	}

	if platform.OAuth == nil {
		return nil, fmt.Errorf("platform %s does not support OAuth", provider)
	}

	// Prepare token exchange request
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("client_id", platform.OAuth.ClientID)
	data.Set("client_secret", platform.OAuth.ClientSecret)
	data.Set("redirect_uri", redirectURI)

	// Make token exchange request
	resp, err := http.Post(platform.OAuth.TokenURL, "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokens map[string]interface{}
	if err := json.Unmarshal(body, &tokens); err != nil {
		return nil, fmt.Errorf("failed to parse token response: %w", err)
	}

	return tokens, nil
}

func createPlatformConnection(provider string, state *OAuthState, tokens map[string]interface{}) (*PlatformConnection, error) {
	// Create platform connection record
	connectionID := fmt.Sprintf("connection:%s", uuid.New().String())
	timestamp := time.Now()

	connection := PlatformConnection{
		ConnectionID: connectionID,
		AccountID:    state.AccountID,
		UserID:       state.UserID,
		PlatformID:   "platform:" + provider,
		Name:         fmt.Sprintf("%s Connection", strings.Title(provider)),
		Status:       "active",
		AuthType:     "oauth",
		Credentials:  tokens, // TODO: Encrypt before storing
		CreatedAt:    timestamp,
		UpdatedAt:    timestamp,
	}

	// Set expiration if provided
	if expiresIn, ok := tokens["expires_in"].(float64); ok {
		expiresAt := timestamp.Add(time.Duration(expiresIn) * time.Second)
		connection.ExpiresAt = &expiresAt
	}

	// Save to DynamoDB
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	item, err := dynamodbattribute.MarshalMap(connection)
	if err != nil {
		return nil, err
	}

	_, err = svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(platformConnectionsTable),
		Item:      item,
	})
	if err != nil {
		return nil, err
	}

	return &connection, nil
}

func getPlatformFromDB(platformID string) (*Platform, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(platformsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"platformId": {
				S: aws.String(platformID),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("platform not found")
	}

	var platform Platform
	err = dynamodbattribute.UnmarshalMap(result.Item, &platform)
	if err != nil {
		return nil, err
	}

	return &platform, nil
}

func isValidProvider(provider string) bool {
	validProviders := []string{"google", "shopify", "facebook", "instagram", "twitter", "linkedin"}
	for _, p := range validProviders {
		if p == provider {
			return true
		}
	}
	return false
}

func getRedirectURI(provider, baseURL string) string {
	return fmt.Sprintf("%s/api/platform-connections/oauth/callback/%s", baseURL, provider)
}

func getBaseURL(event events.APIGatewayV2HTTPRequest) string {
	scheme := "https"
	if event.Headers["X-Forwarded-Proto"] != "" {
		scheme = event.Headers["X-Forwarded-Proto"]
	}

	host := event.Headers["Host"]
	if host == "" {
		host = "api.listbackup.ai" // fallback
	}

	return scheme + "://" + host
}

func replaceShopDomain(urlStr, shopDomain string) string {
	// Parse the URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return urlStr
	}

	// Replace {shop} in host
	if parsedURL.Host == "{shop}.myshopify.com" {
		parsedURL.Host = shopDomain + ".myshopify.com"
	}

	return parsedURL.String()
}

func redirectWithError(provider, errorType, errorDescription string) events.APIGatewayProxyResponse {
	// Build redirect URL to frontend with error
	redirectURL := fmt.Sprintf("https://app.listbackup.ai/dashboard/integrations?oauth_error=%s&provider=%s&error_description=%s",
		url.QueryEscape(errorType),
		url.QueryEscape(provider),
		url.QueryEscape(errorDescription))

	return events.APIGatewayProxyResponse{
		StatusCode: 302,
		Headers: map[string]string{
			"Location":                    redirectURL,
			"Access-Control-Allow-Origin": "*",
		},
	}
}

func redirectWithSuccess(provider string, connection *PlatformConnection) events.APIGatewayProxyResponse {
	// Build redirect URL to frontend with success
	redirectURL := fmt.Sprintf("https://app.listbackup.ai/dashboard/integrations?oauth_success=true&provider=%s",
		url.QueryEscape(provider))

	return events.APIGatewayProxyResponse{
		StatusCode: 302,
		Headers: map[string]string{
			"Location":                    redirectURL,
			"Access-Control-Allow-Origin": "*",
		},
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := Response{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func main() {
	lambda.Start(Handle)
}