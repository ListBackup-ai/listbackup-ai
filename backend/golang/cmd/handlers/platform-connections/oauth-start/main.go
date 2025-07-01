package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
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
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type OAuthStartRequest struct {
	Provider    string `json:"provider"`
	RedirectURI string `json:"redirectUri,omitempty"`
	ShopDomain  string `json:"shopDomain,omitempty"` // For Shopify specifically
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

var (
	oauthStatesTable = os.Getenv("OAUTH_STATES_TABLE")
	platformsTable   = os.Getenv("PLATFORMS_TABLE")
)

func Handle(event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract user ID and account ID from JWT claims
	userID := extractUserID(event)
	if userID == "" {
		return createErrorResponse(401, "User not authenticated"), nil
	}

	accountID := extractAccountID(event)
	if accountID == "" {
		return createErrorResponse(401, "Account ID not found"), nil
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

	log.Printf("OAuth start request for provider %s, user %s, account %s", provider, userID, accountID)

	// Parse request body for additional parameters
	var req OAuthStartRequest
	if event.Body != "" {
		if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
			log.Printf("Failed to parse request body: %v", err)
			// Continue with defaults if body parsing fails
		}
	}

	// Use provider from path if not in body
	if req.Provider == "" {
		req.Provider = provider
	}

	// Build default redirect URI if not provided
	if req.RedirectURI == "" {
		baseURL := getBaseURL(event)
		req.RedirectURI = getRedirectURI(provider, baseURL)
	}

	// Special handling for Shopify
	if provider == "shopify" {
		if req.ShopDomain == "" {
			// Try to get shop domain from query parameters
			if shopDomain := event.QueryStringParameters["shop"]; shopDomain != "" {
				req.ShopDomain = shopDomain
			} else {
				return createErrorResponse(400, "Shop domain is required for Shopify integration"), nil
			}
		}
		// Update redirect URI to include shop domain
		req.RedirectURI = getRedirectURI(provider, getBaseURL(event))
		req.RedirectURI = replaceShopDomain(req.RedirectURI, req.ShopDomain)
	}

	// Get table names from environment
	if oauthStatesTable == "" {
		oauthStatesTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-oauth-states"
	}
	if platformsTable == "" {
		platformsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}

	// Generate OAuth authorization URL
	authURL, state, err := generateAuthURL(provider, userID, accountID, req.RedirectURI, req.ShopDomain)
	if err != nil {
		log.Printf("Failed to generate auth URL for provider %s: %v", provider, err)
		return createErrorResponse(500, "Failed to initiate OAuth flow"), nil
	}

	// Special handling for Shopify URLs
	if provider == "shopify" && req.ShopDomain != "" {
		authURL = replaceShopDomain(authURL, req.ShopDomain)
	}

	log.Printf("Generated OAuth URL for provider %s with state %s", provider, state)

	return createSuccessResponse(Response{
		Success: true,
		Data: map[string]interface{}{
			"authUrl":     authURL,
			"state":       state,
			"provider":    provider,
			"redirectUri": req.RedirectURI,
		},
	}), nil
}

func generateAuthURL(provider, userID, accountID, redirectURI, shopDomain string) (string, string, error) {
	// Get platform OAuth configuration
	platformID := "platform:" + provider
	platform, err := getPlatformFromDB(platformID)
	if err != nil {
		return "", "", fmt.Errorf("failed to get platform config: %w", err)
	}

	if platform.OAuth == nil {
		return "", "", fmt.Errorf("platform %s does not support OAuth", provider)
	}

	// Generate state
	state, err := generateState()
	if err != nil {
		return "", "", fmt.Errorf("failed to generate state: %w", err)
	}

	// Save state to DynamoDB
	stateRecord := OAuthState{
		StateID:     state,
		Provider:    provider,
		UserID:      userID,
		AccountID:   accountID,
		RedirectURI: redirectURI,
		ShopDomain:  shopDomain,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(15 * time.Minute), // State expires in 15 minutes
	}

	if err := saveOAuthState(&stateRecord); err != nil {
		return "", "", fmt.Errorf("failed to save OAuth state: %w", err)
	}

	// Build authorization URL
	authURL, err := url.Parse(platform.OAuth.AuthURL)
	if err != nil {
		return "", "", fmt.Errorf("invalid auth URL: %w", err)
	}

	query := authURL.Query()
	query.Set("client_id", platform.OAuth.ClientID)
	query.Set("redirect_uri", redirectURI)
	query.Set("response_type", platform.OAuth.ResponseType)
	query.Set("state", state)
	
	if len(platform.OAuth.Scopes) > 0 {
		query.Set("scope", strings.Join(platform.OAuth.Scopes, " "))
	}

	// Provider-specific parameters
	switch provider {
	case "shopify":
		// Shopify-specific parameters are handled by URL replacement
	case "google":
		query.Set("access_type", "offline")
		query.Set("prompt", "consent")
	}

	authURL.RawQuery = query.Encode()

	return authURL.String(), state, nil
}

func generateState() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func saveOAuthState(state *OAuthState) error {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	item, err := dynamodbattribute.MarshalMap(state)
	if err != nil {
		return err
	}

	_, err = svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(oauthStatesTable),
		Item:      item,
	})

	return err
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

func extractUserID(event events.APIGatewayV2HTTPRequest) string {
	if event.RequestContext.Authorizer != nil {
		if jwt := event.RequestContext.Authorizer.JWT; jwt != nil {
			if sub, ok := jwt.Claims["sub"]; ok {
				return fmt.Sprintf("user:%s", sub)
			}
		}
		if lambda := event.RequestContext.Authorizer.Lambda; lambda != nil {
			if userID, ok := lambda["userId"].(string); ok {
				return userID
			}
		}
	}
	return ""
}

func extractAccountID(event events.APIGatewayV2HTTPRequest) string {
	if event.RequestContext.Authorizer != nil {
		if jwt := event.RequestContext.Authorizer.JWT; jwt != nil {
			if accountID, ok := jwt.Claims["accountId"]; ok {
				return fmt.Sprintf("%v", accountID)
			}
		}
		if lambda := event.RequestContext.Authorizer.Lambda; lambda != nil {
			if accountID, ok := lambda["accountId"].(string); ok {
				return accountID
			}
		}
	}
	return ""
}

func createSuccessResponse(data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
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