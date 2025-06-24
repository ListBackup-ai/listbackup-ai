package middleware

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/listbackup/api/internal/services"
	apitypes "github.com/listbackup/api/internal/types"
)

type AuthMiddleware struct {
	accountService *services.AccountService
}

func NewAuthMiddleware(ctx context.Context) (*AuthMiddleware, error) {
	accountService, err := services.NewAccountService(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create account service: %v", err)
	}
	return &AuthMiddleware{accountService: accountService}, nil
}

// ExtractAuthContext extracts authentication context from Lambda event
func ExtractAuthContext(event events.APIGatewayProxyRequest) (*apitypes.AuthContext, error) {
	// Try to extract from Lambda authorizer context first
	if event.RequestContext.Authorizer != nil {
		if lambdaAuth, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
			if userID, ok := lambdaAuth["userId"].(string); ok {
				if accountID, ok := lambdaAuth["accountId"].(string); ok {
					email, _ := lambdaAuth["email"].(string)
					role, _ := lambdaAuth["role"].(string)
					return &apitypes.AuthContext{
						UserID:    userID,
						AccountID: accountID,
						Email:     email,
						Role:      role,
					}, nil
				}
			}
		}

		// Try direct authorizer properties
		if userID, ok := event.RequestContext.Authorizer["userId"].(string); ok {
			if accountID, ok := event.RequestContext.Authorizer["accountId"].(string); ok {
				email, _ := event.RequestContext.Authorizer["email"].(string)
				role, _ := event.RequestContext.Authorizer["role"].(string)
				return &apitypes.AuthContext{
					UserID:    userID,
					AccountID: accountID,
					Email:     email,
					Role:      role,
				}, nil
			}
		}
	}

	// Fallback to manual JWT verification
	return extractFromJWT(event)
}

func extractFromJWT(event events.APIGatewayProxyRequest) (*apitypes.AuthContext, error) {
	// Use the simple auth extraction
	return SimpleAuthExtract(event)
}


// ValidateUserAccess validates that the user has access to the account using hierarchical system
func (auth *AuthMiddleware) ValidateUserAccess(ctx context.Context, userID, accountID string) (*apitypes.UserAccount, error) {
	userAccount, err := auth.accountService.ValidateAccountAccess(ctx, userID, accountID)
	if err != nil {
		log.Printf("Access validation failed for user %s to account %s: %v", userID, accountID, err)
		return nil, fmt.Errorf("access denied")
	}

	return userAccount, nil
}

// BuildFullAuthContext builds complete auth context with account permissions and available accounts
func (auth *AuthMiddleware) BuildFullAuthContext(ctx context.Context, basicAuthCtx *apitypes.AuthContext) (*apitypes.AuthContext, error) {
	// Use account service to get full context with permissions
	fullAuthCtx, err := auth.accountService.SwitchAccountContext(ctx, basicAuthCtx.UserID, basicAuthCtx.AccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to build full auth context: %v", err)
	}

	// Preserve email from basic context
	fullAuthCtx.Email = basicAuthCtx.Email

	return fullAuthCtx, nil
}

// RequireAuth is a middleware function that requires authentication with hierarchical account support
func (auth *AuthMiddleware) RequireAuth(handler func(ctx context.Context, event events.APIGatewayProxyRequest, authCtx *apitypes.AuthContext) (events.APIGatewayProxyResponse, error)) func(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return func(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		// Extract basic auth context from JWT/Cognito
		basicAuthCtx, err := ExtractAuthContext(event)
		if err != nil {
			log.Printf("Authentication failed: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 401,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  "*",
					"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Account-Context",
					"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
					"Content-Type":                 "application/json",
				},
				Body: `{"success": false, "error": "Authentication required"}`,
			}, nil
		}

		// Handle account context resolution
		requestedAccountID := event.Headers["X-Account-Context"]
		if requestedAccountID != "" {
			// User explicitly requested a specific account
			basicAuthCtx.AccountID = requestedAccountID
		} else if basicAuthCtx.AccountID == "" {
			// No account specified - use user's current account
			currentAccountID, err := auth.accountService.GetUserCurrentAccount(ctx, basicAuthCtx.UserID)
			if err != nil {
				log.Printf("Failed to get user's current account for user %s: %v", basicAuthCtx.UserID, err)
				return events.APIGatewayProxyResponse{
					StatusCode: 403,
					Headers: map[string]string{
						"Access-Control-Allow-Origin":  "*",
						"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Account-Context",
						"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
						"Content-Type":                 "application/json",
					},
					Body: `{"success": false, "error": "No current account set for user"}`,
				}, nil
			}
			
			basicAuthCtx.AccountID = currentAccountID
			log.Printf("Using user's current account %s for user %s", currentAccountID, basicAuthCtx.UserID)
		}

		// Validate user access to the requested/resolved account
		_, err = auth.ValidateUserAccess(ctx, basicAuthCtx.UserID, basicAuthCtx.AccountID)
		if err != nil {
			log.Printf("Access validation failed: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 403,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  "*",
					"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Account-Context",
					"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
					"Content-Type":                 "application/json",
				},
				Body: `{"success": false, "error": "Access denied"}`,
			}, nil
		}

		// Build full auth context with permissions and available accounts
		fullAuthCtx, err := auth.BuildFullAuthContext(ctx, basicAuthCtx)
		if err != nil {
			log.Printf("Failed to build full auth context: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 500,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  "*",
					"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Account-Context",
					"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
					"Content-Type":                 "application/json",
				},
				Body: `{"success": false, "error": "Internal server error"}`,
			}, nil
		}

		return handler(ctx, event, fullAuthCtx)
	}
}