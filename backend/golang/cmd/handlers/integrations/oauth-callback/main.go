package main

import (
	"context"
	"fmt"
	"log"
	"net/url"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/internal/config"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/pkg/response"
)

type OAuthCallbackHandler struct {
	oauthService *services.OAuthService
}

func NewOAuthCallbackHandler() (*OAuthCallbackHandler, error) {
	oauthService, err := services.NewOAuthService()
	if err != nil {
		return nil, err
	}

	return &OAuthCallbackHandler{
		oauthService: oauthService,
	}, nil
}

func (h *OAuthCallbackHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Handle CORS preflight
	if event.HTTPMethod == "OPTIONS" {
		return response.CORS(), nil
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

	// Get authorization code and state from query parameters
	code := event.QueryStringParameters["code"]
	state := event.QueryStringParameters["state"]
	errorParam := event.QueryStringParameters["error"]
	errorDescription := event.QueryStringParameters["error_description"]

	log.Printf("OAuth callback for provider %s with code present: %v, state: %s", provider, code != "", state)

	// Check for OAuth errors
	if errorParam != "" {
		log.Printf("OAuth error for provider %s: %s - %s", provider, errorParam, errorDescription)
		return h.redirectWithError(provider, errorParam, errorDescription), nil
	}

	// Validate required parameters
	if code == "" {
		log.Printf("Missing authorization code for provider %s", provider)
		return h.redirectWithError(provider, "missing_code", "Authorization code not provided"), nil
	}

	if state == "" {
		log.Printf("Missing state parameter for provider %s", provider)
		return h.redirectWithError(provider, "missing_state", "State parameter not provided"), nil
	}

	// Build redirect URI (same as used in oauth-start)
	baseURL := getBaseURL(event)
	redirectURI := config.GetRedirectURI(provider, baseURL)

	// Special handling for Shopify
	if provider == "shopify" {
		if shop := event.QueryStringParameters["shop"]; shop != "" {
			redirectURI = replaceShopDomain(redirectURI, shop)
		}
	}

	ctx := context.Background()

	// Exchange code for tokens
	source, err := h.oauthService.ExchangeCodeForToken(ctx, provider, code, state, redirectURI)
	if err != nil {
		log.Printf("Failed to exchange code for token for provider %s: %v", provider, err)
		return h.redirectWithError(provider, "token_exchange_failed", err.Error()), nil
	}

	log.Printf("OAuth callback completed successfully for provider %s", provider)

	// Redirect to success page
	return h.redirectWithSuccess(provider, source), nil
}

// redirectWithError redirects to the frontend with error parameters
func (h *OAuthCallbackHandler) redirectWithError(provider, errorType, errorDescription string) events.APIGatewayProxyResponse {
	// Build redirect URL to frontend with error
	redirectURL := fmt.Sprintf("https://app.listbackup.ai/dashboard/integrations?oauth_error=%s&provider=%s&error_description=%s",
		url.QueryEscape(errorType),
		url.QueryEscape(provider),
		url.QueryEscape(errorDescription))

	return events.APIGatewayProxyResponse{
		StatusCode: 302,
		Headers: map[string]string{
			"Location":                redirectURL,
			"Access-Control-Allow-Origin": "*",
		},
	}
}

// redirectWithSuccess redirects to the frontend with success parameters
func (h *OAuthCallbackHandler) redirectWithSuccess(provider string, source interface{}) events.APIGatewayProxyResponse {
	// Build redirect URL to frontend with success
	redirectURL := fmt.Sprintf("https://app.listbackup.ai/dashboard/integrations?oauth_success=true&provider=%s",
		url.QueryEscape(provider))

	return events.APIGatewayProxyResponse{
		StatusCode: 302,
		Headers: map[string]string{
			"Location":                redirectURL,
			"Access-Control-Allow-Origin": "*",
		},
	}
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
	handler, err := NewOAuthCallbackHandler()
	if err != nil {
		log.Fatalf("Failed to create OAuth callback handler: %v", err)
	}

	lambda.Start(handler.Handle)
}