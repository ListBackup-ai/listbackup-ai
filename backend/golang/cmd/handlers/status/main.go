package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/pkg/response"
)

type StatusHandler struct{}

func NewStatusHandler(ctx context.Context) (*StatusHandler, error) {
	return &StatusHandler{}, nil
}

func (h *StatusHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Status request - Authorizer context: %+v", event.RequestContext.Authorizer)
	
	// Extract user ID from Cognito JWT authorizer context
	userID := ""
	isAuthorized := false
	
	// For HTTP API v2 with JWT authorizer, claims are nested in jwt.claims
	if authContext := event.RequestContext.Authorizer; authContext != nil {
		if jwt, ok := authContext["jwt"].(map[string]interface{}); ok {
			if claims, ok := jwt["claims"].(map[string]interface{}); ok {
				log.Printf("JWT Claims found: %+v", claims)
				if sub, exists := claims["sub"].(string); exists {
					userID = sub
					isAuthorized = true
				}
			}
		}
	}
	
	// If no user ID found, set default
	if userID == "" {
		userID = "unknown"
	}
	
	log.Printf("Processing status request for user: %s, authorized: %v", userID, isAuthorized)
	
	// Return simple status with user info
	status := map[string]interface{}{
		"status":      "ok",
		"message":     "API is running",
		"userID":      userID,
		"authorized":  isAuthorized,
		"timestamp":   "2025-06-16T00:00:00Z",
		"version":     "v2",
	}
	
	return response.Success(status), nil
}

func main() {
	handler, err := NewStatusHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create status handler: %v", err)
	}

	lambda.Start(handler.Handle)
}