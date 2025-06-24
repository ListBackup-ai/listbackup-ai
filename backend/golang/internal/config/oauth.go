package config

import (
	"fmt"
)

// OAuthProvider represents an OAuth provider configuration
type OAuthProvider struct {
	ClientIDPath     string
	ClientSecretPath string
	AuthURL          string
	TokenURL         string
	UserInfoURL      string
	Scopes           []string
	RedirectPath     string
}

// OAuthProviders contains all OAuth provider configurations
var OAuthProviders = map[string]OAuthProvider{
	"google": {
		ClientIDPath:     "app/oauth/google/client_id",
		ClientSecretPath: "app/oauth/google/client_secret",
		AuthURL:          "https://accounts.google.com/o/oauth2/v2/auth",
		TokenURL:         "https://oauth2.googleapis.com/token",
		UserInfoURL:      "https://www.googleapis.com/oauth2/v2/userinfo",
		Scopes: []string{
			"https://www.googleapis.com/auth/drive.readonly",
			"https://www.googleapis.com/auth/spreadsheets.readonly",
			"https://www.googleapis.com/auth/bigquery.readonly",
			"https://www.googleapis.com/auth/cloud-platform.read-only",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		RedirectPath: "/integrations/oauth/callback/google",
	},
	"hubspot": {
		ClientIDPath:     "app/oauth/hubspot/client_id",
		ClientSecretPath: "app/oauth/hubspot/client_secret",
		AuthURL:          "https://app.hubspot.com/oauth/authorize",
		TokenURL:         "https://api.hubapi.com/oauth/v1/token",
		UserInfoURL:      "https://api.hubapi.com/integrations/v1/me",
		Scopes: []string{
			"crm.export",
		},
		RedirectPath: "/integrations/oauth/callback/hubspot",
	},
	"gohighlevel": {
		ClientIDPath:     "app/oauth/ghl/client_id",
		ClientSecretPath: "app/oauth/ghl/client_secret",
		AuthURL:          "https://marketplace.leadconnectorhq.com/oauth/chooselocation",
		TokenURL:         "https://services.leadconnectorhq.com/oauth/token",
		UserInfoURL:      "https://services.leadconnectorhq.com/oauth/locationInfo",
		Scopes: []string{
			"contacts.readonly",
			"campaigns.readonly",
			"conversations.readonly",
			"opportunities.readonly",
			"forms.readonly",
			"businesses.readonly",
			"conversations/message.readonly",
			"users.readonly",
			"calendars.readonly",
			"medias.readonly",
		},
		RedirectPath: "/integrations/oauth/callback/gohighlevel",
	},
	"dropbox": {
		ClientIDPath:     "app/oauth/dropbox/client_id",
		ClientSecretPath: "app/oauth/dropbox/client_secret",
		AuthURL:          "https://www.dropbox.com/oauth2/authorize",
		TokenURL:         "https://api.dropboxapi.com/oauth2/token",
		UserInfoURL:      "https://api.dropboxapi.com/2/users/get_current_account",
		Scopes: []string{
			"account_info.read",
			"files.metadata.read",
			"files.content.read",
			"files.content.write",
			"sharing.read",
		},
		RedirectPath: "/integrations/oauth/callback/dropbox",
	},
	"box": {
		ClientIDPath:     "app/oauth/box/client_id",
		ClientSecretPath: "app/oauth/box/client_secret",
		AuthURL:          "https://account.box.com/api/oauth2/authorize",
		TokenURL:         "https://api.box.com/oauth2/token",
		UserInfoURL:      "https://api.box.com/2.0/users/me",
		Scopes: []string{
			"root_readwrite",
		},
		RedirectPath: "/integrations/oauth/callback/box",
	},
	"quickbooks": {
		ClientIDPath:     "app/oauth/quickbooks/client_id",
		ClientSecretPath: "app/oauth/quickbooks/client_secret",
		AuthURL:          "https://appcenter.intuit.com/connect/oauth2",
		TokenURL:         "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
		UserInfoURL:      "https://accounts.platform.intuit.com/v1/openid_connect/userinfo",
		Scopes: []string{
			"com.intuit.quickbooks.accounting",
			"openid",
			"email",
			"profile",
			"phone",
			"address",
		},
		RedirectPath: "/integrations/oauth/callback/quickbooks",
	},
	"shopify": {
		ClientIDPath:     "app/oauth/shopify/client_id",
		ClientSecretPath: "app/oauth/shopify/client_secret",
		AuthURL:          "https://{shop}.myshopify.com/admin/oauth/authorize", // Shop domain required
		TokenURL:         "https://{shop}.myshopify.com/admin/oauth/access_token",
		UserInfoURL:      "https://{shop}.myshopify.com/admin/api/2024-01/shop.json",
		Scopes: []string{
			"read_products",
			"read_orders",
			"read_customers",
			"read_inventory",
			"read_fulfillments",
			"read_shipping",
			"read_analytics",
			"read_reports",
			"read_price_rules",
			"read_discounts",
		},
		RedirectPath: "/integrations/oauth/callback/shopify",
	},
	"keap": {
		ClientIDPath:     "app/oauth/keap/client_id",
		ClientSecretPath: "app/oauth/keap/client_secret",
		AuthURL:          "https://signin.infusionsoft.com/app/oauth/authorize",
		TokenURL:         "https://api.infusionsoft.com/token",
		UserInfoURL:      "https://api.infusionsoft.com/oauth/connect/userinfo",
		Scopes: []string{
			"full",
		},
		RedirectPath: "/integrations/oauth/callback/keap",
	},
	"stripe": {
		ClientIDPath:     "app/oauth/stripe/client_id",
		ClientSecretPath: "app/oauth/stripe/client_secret",
		AuthURL:          "https://connect.stripe.com/oauth/authorize",
		TokenURL:         "https://connect.stripe.com/oauth/token",
		UserInfoURL:      "", // Stripe doesn't have a separate user info endpoint
		Scopes: []string{
			"read_only", // For Stripe Connect
		},
		RedirectPath: "/integrations/oauth/callback/stripe",
	},
}

// GetRedirectURI builds the full redirect URI for a provider
func GetRedirectURI(provider string, baseURL string) string {
	if config, ok := OAuthProviders[provider]; ok {
		return fmt.Sprintf("%s%s", baseURL, config.RedirectPath)
	}
	return ""
}

// IsValidProvider checks if a provider is supported
func IsValidProvider(provider string) bool {
	_, ok := OAuthProviders[provider]
	return ok
}