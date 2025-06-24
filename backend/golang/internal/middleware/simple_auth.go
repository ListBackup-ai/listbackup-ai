package middleware

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	apitypes "github.com/listbackup/api/internal/types"
)

// SimpleAuthExtract extracts auth context without JWT parsing (for compatibility)
func SimpleAuthExtract(event events.APIGatewayProxyRequest) (*apitypes.AuthContext, error) {
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

	// Fallback to basic token extraction
	return extractFromToken(event)
}

func extractFromToken(event events.APIGatewayProxyRequest) (*apitypes.AuthContext, error) {
	authHeader := event.Headers["Authorization"]
	if authHeader == "" {
		authHeader = event.Headers["authorization"]
	}

	if authHeader == "" {
		return nil, fmt.Errorf("authorization header missing")
	}

	// Remove "Bearer " prefix
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		return nil, fmt.Errorf("invalid authorization header format")
	}

	// For now, just extract from the base64 decoded payload (simplified)
	// In production, this should use proper JWT verification
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	// Decode payload (middle part)
	payload := parts[1]
	// Add padding if needed
	switch len(payload) % 4 {
	case 2:
		payload += "=="
	case 3:
		payload += "="
	}

	decoded, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to decode token payload: %v", err)
	}

	var claims map[string]interface{}
	if err := json.Unmarshal(decoded, &claims); err != nil {
		return nil, fmt.Errorf("failed to parse token claims: %v", err)
	}

	// Extract sub (subject) from token
	sub, ok := claims["sub"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid token claims: missing sub")
	}

	userID := fmt.Sprintf("user:%s", sub)
	email, _ := claims["email"].(string)

	// Check for X-Account-Context header first
	requestedAccountID := event.Headers["X-Account-Context"]
	if requestedAccountID != "" {
		// Add prefix if needed
		if !strings.HasPrefix(requestedAccountID, "account:") {
			requestedAccountID = "account:" + requestedAccountID
		}
		return &apitypes.AuthContext{
			UserID:    userID,
			AccountID: requestedAccountID,
			Email:     email,
			Role:      "user", // Will be resolved later by full auth context
		}, nil
	}

	// No specific account requested - need to find user's default account
	// For simple auth, we'll fall back to a placeholder that will be resolved
	// by the full auth middleware when needed
	return &apitypes.AuthContext{
		UserID:    userID,
		AccountID: "", // Empty means "resolve user's default account"
		Email:     email,
		Role:      "user",
	}, nil
}

// SimpleRequireAuth is a simplified auth middleware for Go 1.16 compatibility
func SimpleRequireAuth(handler func(ctx context.Context, event events.APIGatewayProxyRequest, authCtx *apitypes.AuthContext) (events.APIGatewayProxyResponse, error)) func(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return func(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		authCtx, err := SimpleAuthExtract(event)
		if err != nil {
			log.Printf("Authentication failed: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 401,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  "*",
					"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
					"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
					"Content-Type":                 "application/json",
				},
				Body: `{"success": false, "error": "Authentication required"}`,
			}, nil
		}

		return handler(ctx, event, authCtx)
	}
}