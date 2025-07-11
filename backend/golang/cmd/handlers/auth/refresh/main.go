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

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type RefreshResponse struct {
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
	log.Printf("Refresh function called with method: %s", event.RequestContext.HTTP.Method)

	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
			Body: "",
		}, nil
	}

	// Validate Cognito configuration
	if cognitoUserPoolID == "" || cognitoClientID == "" {
		log.Printf("Missing Cognito configuration - UserPoolID: %s, ClientID: %s", cognitoUserPoolID, cognitoClientID)
		return createErrorResponse(500, "Authentication service not configured"), nil
	}

	// Parse request body
	if event.Body == "" {
		return createErrorResponse(400, "Request body is required"), nil
	}
	
	var refreshReq RefreshRequest
	if err := json.Unmarshal([]byte(event.Body), &refreshReq); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return createErrorResponse(400, "Invalid JSON format"), nil
	}
	
	// Validate required fields
	if refreshReq.RefreshToken == "" {
		return createErrorResponse(400, "Refresh token is required"), nil
	}
	
	log.Printf("Refresh token request received")

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
		return createErrorResponse(500, "Token refresh failed"), nil
	}
	log.Printf("AWS session created successfully")

	// Create Cognito client
	log.Printf("Creating Cognito client...")
	cognitoClient := cognitoidentityprovider.New(sess)
	log.Printf("Cognito client created successfully")

	// Initiate token refresh
	authInput := &cognitoidentityprovider.InitiateAuthInput{
		AuthFlow: aws.String("REFRESH_TOKEN_AUTH"),
		ClientId: aws.String(cognitoClientID),
		AuthParameters: map[string]*string{
			"REFRESH_TOKEN": aws.String(refreshReq.RefreshToken),
		},
	}
	
	log.Printf("Initiating token refresh")
	authResult, err := cognitoClient.InitiateAuth(authInput)
	if err != nil {
		log.Printf("Token refresh error: %v", err)
		return handleRefreshError(err), nil
	}
	
	// Success response
	response := RefreshResponse{
		Success: true,
		Message: "Token refreshed successfully",
		Data: map[string]interface{}{
			"accessToken": *authResult.AuthenticationResult.AccessToken,
			"idToken":     *authResult.AuthenticationResult.IdToken,
			"expiresIn":   *authResult.AuthenticationResult.ExpiresIn,
			"tokenType":   *authResult.AuthenticationResult.TokenType,
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

func handleRefreshError(err error) events.APIGatewayProxyResponse {
	if err == nil {
		return createErrorResponse(500, "Unknown refresh error")
	}

	errStr := err.Error()
	if strings.Contains(errStr, "NotAuthorizedException") {
		return createErrorResponse(401, "Invalid refresh token")
	} else if strings.Contains(errStr, "TokenExpiredException") {
		return createErrorResponse(401, "Refresh token expired")
	}
	
	return createErrorResponse(500, "Token refresh failed")
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := RefreshResponse{
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