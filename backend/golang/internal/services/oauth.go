package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/listbackup/api/internal/config"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
)

// OAuthService handles OAuth operations
type OAuthService struct {
	secrets  *SecretsService
	dynamodb *database.DynamoDBClient
}

// OAuthState represents the OAuth state stored during the flow
type OAuthState struct {
	UserID      string    `json:"userId"`
	AccountID   string    `json:"accountId"`
	Provider    string    `json:"provider"`
	RedirectURI string    `json:"redirectUri"`
	State       string    `json:"state"`
	CreatedAt   time.Time `json:"createdAt"`
	TTL         int64     `json:"ttl"`
}

// OAuthTokenResponse represents the OAuth token response
type OAuthTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
}

// NewOAuthService creates a new OAuth service
func NewOAuthService() (*OAuthService, error) {
	secrets, err := NewSecretsService()
	if err != nil {
		return nil, err
	}

	dynamodb, err := database.NewDynamoDBClient(context.Background())
	if err != nil {
		return nil, err
	}

	return &OAuthService{
		secrets:  secrets,
		dynamodb: dynamodb,
	}, nil
}

// GenerateAuthURL generates the OAuth authorization URL
func (s *OAuthService) GenerateAuthURL(ctx context.Context, provider string, userID string, accountID string, redirectURI string) (string, string, error) {
	providerConfig, ok := config.OAuthProviders[provider]
	if !ok {
		return "", "", fmt.Errorf("unsupported provider: %s", provider)
	}

	// Get client ID from Secrets Manager
	clientID, err := s.secrets.GetSecret(ctx, providerConfig.ClientIDPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to get client ID: %w", err)
	}

	// Generate state token
	state := generateState()

	// Store state in DynamoDB
	oauthState := OAuthState{
		UserID:      userID,
		AccountID:   accountID,
		Provider:    provider,
		RedirectURI: redirectURI,
		State:       state,
		CreatedAt:   time.Now(),
		TTL:         time.Now().Add(10 * time.Minute).Unix(), // 10 minute TTL
	}

	tableName := "oauth-states"
	if err := s.dynamodb.PutItem(ctx, tableName, oauthState); err != nil {
		return "", "", fmt.Errorf("failed to store OAuth state: %w", err)
	}

	// Build authorization URL
	authURL := providerConfig.AuthURL
	
	// Special handling for Shopify (requires shop domain)
	if provider == "shopify" && strings.Contains(authURL, "{shop}") {
		// For Shopify, we'll need the shop domain in the redirect URI
		// The frontend should provide it as a query parameter
		authURL = strings.ReplaceAll(authURL, "{shop}", "SHOP_DOMAIN_REQUIRED")
	}

	params := url.Values{}
	params.Set("client_id", clientID)
	params.Set("redirect_uri", redirectURI)
	params.Set("response_type", "code")
	params.Set("state", state)
	
	// Add scopes
	if len(providerConfig.Scopes) > 0 {
		params.Set("scope", strings.Join(providerConfig.Scopes, " "))
	}

	// Provider-specific parameters
	switch provider {
	case "google":
		params.Set("access_type", "offline")
		params.Set("prompt", "consent")
	case "dropbox":
		params.Set("token_access_type", "offline")
	case "quickbooks":
		// QuickBooks uses different parameter names
		params.Set("response_type", "code")
	}

	fullAuthURL := fmt.Sprintf("%s?%s", authURL, params.Encode())

	return fullAuthURL, state, nil
}

// ExchangeCodeForToken exchanges the authorization code for access tokens
func (s *OAuthService) ExchangeCodeForToken(ctx context.Context, provider string, code string, state string, redirectURI string) (*apitypes.Source, error) {
	providerConfig, ok := config.OAuthProviders[provider]
	if !ok {
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}

	// Validate state
	tableName := "oauth-states"
	var storedState OAuthState
	stateAttr, err := attributevalue.Marshal(state)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal state: %v", err)
	}
	
	if err := s.dynamodb.GetItem(ctx, tableName, map[string]types.AttributeValue{
		"state": stateAttr,
	}, &storedState); err != nil {
		return nil, fmt.Errorf("invalid OAuth state")
	}

	// Delete the state to prevent reuse
	s.dynamodb.DeleteItem(ctx, tableName, map[string]types.AttributeValue{
		"state": stateAttr,
	})

	// Get client credentials from Secrets Manager
	clientID, err := s.secrets.GetSecret(ctx, providerConfig.ClientIDPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get client ID: %w", err)
	}

	clientSecret, err := s.secrets.GetSecret(ctx, providerConfig.ClientSecretPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get client secret: %w", err)
	}

	// Exchange code for token
	tokenData := url.Values{}
	tokenData.Set("grant_type", "authorization_code")
	tokenData.Set("code", code)
	tokenData.Set("redirect_uri", redirectURI)
	tokenData.Set("client_id", clientID)
	tokenData.Set("client_secret", clientSecret)

	req, err := http.NewRequestWithContext(ctx, "POST", providerConfig.TokenURL, strings.NewReader(tokenData.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read token response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange failed: %s", string(body))
	}

	var tokenResponse OAuthTokenResponse
	if err := json.Unmarshal(body, &tokenResponse); err != nil {
		return nil, fmt.Errorf("failed to parse token response: %w", err)
	}

	// Get user info if available
	userInfo := make(map[string]interface{})
	if providerConfig.UserInfoURL != "" {
		userInfo, _ = s.getUserInfo(ctx, provider, tokenResponse.AccessToken)
	}

	// Store tokens in Secrets Manager
	secretPath := fmt.Sprintf("sources/%s/%s/oauth-tokens", storedState.AccountID, generateSourceID())
	tokens := map[string]interface{}{
		"access_token":  tokenResponse.AccessToken,
		"refresh_token": tokenResponse.RefreshToken,
		"expires_at":    time.Now().Add(time.Duration(tokenResponse.ExpiresIn) * time.Second).Unix(),
		"token_type":    tokenResponse.TokenType,
		"scope":         tokenResponse.Scope,
	}

	if err := s.secrets.StoreJSONSecret(ctx, secretPath, tokens); err != nil {
		return nil, fmt.Errorf("failed to store tokens: %w", err)
	}

	// TODO: Create appropriate PlatformConnection instead of Source
	// For now, we'll just return the tokens and user info
	log.Printf("OAuth completed for %s, tokens stored at %s", provider, secretPath)

	// Log activity
	activity := &apitypes.Activity{
		EventID:   generateEventID(),
		AccountID: storedState.AccountID,
		UserID:    storedState.UserID,
		Type:      "integration",
		Action:    "oauth_connected",
		Status:    "success",
		Message:   fmt.Sprintf("Connected %s via OAuth", provider),
		Timestamp: time.Now().Unix(),
		TTL:       time.Now().AddDate(0, 0, 30).Unix(),
	}
	s.dynamodb.PutItem(ctx, "activity", activity)

	// TODO: Return a proper Source object instead of nil
	log.Printf("OAuth exchange completed for provider %s, user info: %v", provider, userInfo)
	
	return nil, nil
}

// getUserInfo retrieves user information from the provider
func (s *OAuthService) getUserInfo(ctx context.Context, provider string, accessToken string) (map[string]interface{}, error) {
	providerConfig, ok := config.OAuthProviders[provider]
	if !ok || providerConfig.UserInfoURL == "" {
		return nil, nil
	}

	req, err := http.NewRequestWithContext(ctx, "GET", providerConfig.UserInfoURL, nil)
	if err != nil {
		return nil, err
	}

	// Set authorization header
	if provider == "dropbox" {
		// Dropbox uses a different header format
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
		req.Header.Set("Content-Type", "application/json")
		req.Body = io.NopCloser(strings.NewReader("null"))
		req.Method = "POST"
	} else {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return userInfo, nil
}

// RefreshToken refreshes an OAuth token
func (s *OAuthService) RefreshToken(ctx context.Context, source *apitypes.Source) error {
	// TODO: Fix this to work with current Source structure
	return fmt.Errorf("RefreshToken not implemented for current Source structure")
}

// Helper functions

func generateState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func generateSourceID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("src_%s", base64.URLEncoding.EncodeToString(b)[:22])
}

func generateEventID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("evt_%s", base64.URLEncoding.EncodeToString(b)[:22])
}