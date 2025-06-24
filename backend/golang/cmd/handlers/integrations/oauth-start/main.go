package main

import (
	"context"
	"encoding/json"
	"log"
	"net/url"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/internal/config"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/pkg/response"
)

type OAuthStartHandler struct {
	oauthService *services.OAuthService
}

type OAuthStartRequest struct {
	Provider    string `json:"provider"`
	RedirectURI string `json:"redirectUri,omitempty"`
	ShopDomain  string `json:"shopDomain,omitempty"` // For Shopify specifically
}

func NewOAuthStartHandler() (*OAuthStartHandler, error) {
	oauthService, err := services.NewOAuthService()
	if err != nil {
		return nil, err
	}

	return &OAuthStartHandler{
		oauthService: oauthService,
	}, nil
}

func (h *OAuthStartHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Handle CORS preflight
	if event.HTTPMethod == "OPTIONS" {
		return response.CORS(), nil
	}

	// Extract user ID and account ID from auth context (Lambda authorizer)
	var userId, accountId string
	if event.RequestContext.Authorizer != nil {
		if lambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
			if uid, exists := lambda["userId"].(string); exists {
				userId = uid
			}
			if aid, exists := lambda["accountId"].(string); exists {
				accountId = aid
			}
		} else {
			if uid, exists := event.RequestContext.Authorizer["userId"].(string); exists {
				userId = uid
			}
			if aid, exists := event.RequestContext.Authorizer["accountId"].(string); exists {
				accountId = aid
			}
		}
	}

	if userId == "" || accountId == "" {
		return response.Unauthorized("User not authenticated"), nil
	}

	// Get provider from path parameters
	provider, ok := event.PathParameters["provider"]
	if !ok || provider == "" {
		return response.BadRequest("Provider is required"), nil
	}

	// Validate provider
	if !config.IsValidProvider(provider) {
		return response.BadRequest("Unsupported provider: " + provider), nil
	}

	log.Printf("OAuth start request for provider %s, user %s, account %s", provider, userId, accountId)

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
		req.RedirectURI = config.GetRedirectURI(provider, baseURL)
	}

	// Special handling for Shopify
	if provider == "shopify" {
		if req.ShopDomain == "" {
			// Try to get shop domain from query parameters
			if shopDomain, exists := event.QueryStringParameters["shop"]; exists {
				req.ShopDomain = shopDomain
			} else {
				return response.BadRequest("Shop domain is required for Shopify integration"), nil
			}
		}
		// Update redirect URI to include shop domain
		req.RedirectURI = config.GetRedirectURI(provider, getBaseURL(event))
		req.RedirectURI = replaceShopDomain(req.RedirectURI, req.ShopDomain)
	}

	ctx := context.Background()

	// Generate OAuth authorization URL
	authURL, state, err := h.oauthService.GenerateAuthURL(ctx, provider, userId, accountId, req.RedirectURI)
	if err != nil {
		log.Printf("Failed to generate auth URL for provider %s: %v", provider, err)
		return response.InternalServerError("Failed to initiate OAuth flow"), nil
	}

	// Special handling for Shopify URLs
	if provider == "shopify" && req.ShopDomain != "" {
		authURL = replaceShopDomain(authURL, req.ShopDomain)
	}

	log.Printf("Generated OAuth URL for provider %s with state %s", provider, state)

	return response.SuccessWithCORS(map[string]interface{}{
		"authUrl":     authURL,
		"state":       state,
		"provider":    provider,
		"redirectUri": req.RedirectURI,
	}), nil
}

// getBaseURL extracts the base URL from the API Gateway event
func getBaseURL(event events.APIGatewayProxyRequest) string {
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

// replaceShopDomain replaces {shop} placeholder with actual shop domain
func replaceShopDomain(urlStr, shopDomain string) string {
	return replaceShopInURL(urlStr, shopDomain)
}

// replaceShopInURL replaces {shop} placeholders in URLs with the shop domain
func replaceShopInURL(urlStr, shopDomain string) string {
	// Parse the URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return urlStr
	}

	// Replace {shop} in host
	if parsedURL.Host == "{shop}.myshopify.com" {
		parsedURL.Host = shopDomain + ".myshopify.com"
	}

	// Replace {shop} in path
	parsedURL.Path = replaceShopInString(parsedURL.Path, shopDomain)

	// Replace {shop} in query parameters
	query := parsedURL.Query()
	for key, values := range query {
		for i, value := range values {
			query[key][i] = replaceShopInString(value, shopDomain)
		}
	}
	parsedURL.RawQuery = query.Encode()

	return parsedURL.String()
}

// replaceShopInString replaces {shop} placeholders in strings
func replaceShopInString(str, shopDomain string) string {
	return str // For now, we mainly handle host replacement above
}

func main() {
	handler, err := NewOAuthStartHandler()
	if err != nil {
		log.Fatalf("Failed to create OAuth start handler: %v", err)
	}

	lambda.Start(handler.Handle)
}