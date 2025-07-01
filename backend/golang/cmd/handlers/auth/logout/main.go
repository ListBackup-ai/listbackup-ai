package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
)

type LogoutResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

var (
	cognitoUserPoolID = os.Getenv("COGNITO_USER_POOL_ID")
	cognitoClientID   = os.Getenv("COGNITO_CLIENT_ID")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Logout function called with method: %s", event.RequestContext.HTTP.Method)

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

	// Validate Cognito configuration
	if cognitoUserPoolID == "" || cognitoClientID == "" {
		log.Printf("Missing Cognito configuration - UserPoolID: %s, ClientID: %s", cognitoUserPoolID, cognitoClientID)
		return createErrorResponse(500, "Authentication service not configured"), nil
	}

	// Get the username from the authorizer context
	// The authorizer adds claims to the request context
	var username string
	if event.RequestContext.Authorizer != nil && event.RequestContext.Authorizer.JWT != nil {
		claims := event.RequestContext.Authorizer.JWT.Claims
		if sub, ok := claims["sub"]; ok {
			username = sub
			log.Printf("Username from authorizer context: %s", username)
		}
		if cognitoUsername, ok := claims["cognito:username"]; ok {
			// Fallback to cognito:username if sub is not available
			if username == "" {
				username = cognitoUsername
			}
			log.Printf("Cognito username from claim: %s", cognitoUsername)
		}
	}

	// If we still don't have a username, check the Lambda authorizer context
	if username == "" && event.RequestContext.Authorizer != nil && event.RequestContext.Authorizer.Lambda != nil {
		if userID, ok := event.RequestContext.Authorizer.Lambda["userId"]; ok {
			// Extract the actual user ID from the format "user:xxxxx"
			userIDStr := userID.(string)
			if strings.HasPrefix(userIDStr, "user:") {
				username = strings.TrimPrefix(userIDStr, "user:")
				log.Printf("Username from Lambda authorizer: %s", username)
			} else {
				username = userIDStr
			}
		}
	}

	if username == "" {
		log.Printf("Failed to extract username from authorizer context")
		return createErrorResponse(401, "Invalid authorization context"), nil
	}

	log.Printf("Logout request received for user: %s", username)

	// Create AWS session
	log.Printf("Creating AWS session...")
	region := os.Getenv("COGNITO_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		log.Printf("Failed to create AWS session: %v", err)
		return createErrorResponse(500, "Logout failed"), nil
	}
	log.Printf("AWS session created successfully")

	// Create Cognito client
	log.Printf("Creating Cognito client...")
	cognitoClient := cognitoidentityprovider.New(sess)
	log.Printf("Cognito client created successfully")

	// Use AdminUserGlobalSignOut to sign out the user
	// This requires the username instead of the access token
	signOutInput := &cognitoidentityprovider.AdminUserGlobalSignOutInput{
		UserPoolId: aws.String(cognitoUserPoolID),
		Username:   aws.String(username),
	}

	log.Printf("Performing admin user global sign out for user: %s", username)
	_, err = cognitoClient.AdminUserGlobalSignOut(signOutInput)
	if err != nil {
		log.Printf("Logout error: %v", err)
		return handleLogoutError(err), nil
	}

	// Success response
	response := LogoutResponse{
		Success: true,
		Message: "Logout successful",
		Data: map[string]interface{}{
			"message": "User logged out successfully",
			"userId":  username,
		},
	}

	responseJSON, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}, nil
}

func handleLogoutError(err error) events.APIGatewayProxyResponse {
	if err == nil {
		return createErrorResponse(500, "Unknown logout error")
	}

	errStr := err.Error()
	if strings.Contains(errStr, "NotAuthorizedException") {
		return createErrorResponse(401, "Not authorized to perform this action")
	} else if strings.Contains(errStr, "UserNotFoundException") {
		return createErrorResponse(404, "User not found")
	} else if strings.Contains(errStr, "TooManyRequestsException") {
		return createErrorResponse(429, "Too many requests")
	}

	return createErrorResponse(500, "Logout failed")
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := LogoutResponse{
		Success: false,
		Error:   message,
	}
	responseJSON, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(responseJSON),
	}
}

func main() {
	lambda.Start(Handle)
}