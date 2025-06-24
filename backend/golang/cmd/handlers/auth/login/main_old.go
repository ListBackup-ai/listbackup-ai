package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
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
	log.Printf("Login function called with method: %s", event.RequestContext.HTTP.Method)

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

	var loginReq LoginRequest
	if err := json.Unmarshal([]byte(event.Body), &loginReq); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return createErrorResponse(400, "Invalid JSON format"), nil
	}

	// Validate required fields
	if loginReq.Email == "" {
		return createErrorResponse(400, "Email is required"), nil
	}
	if loginReq.Password == "" {
		return createErrorResponse(400, "Password is required"), nil
	}
	
	log.Printf("Login request - Email: %s", loginReq.Email)

	// Load AWS config
	log.Printf("Loading AWS config...")
	region := os.Getenv("COGNITO_REGION")
	if region == "" {
		region = "us-west-2"
	}
	
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		log.Printf("Failed to load AWS config: %v", err)
		return createErrorResponse(500, "Login failed"), nil
	}
	log.Printf("AWS config loaded successfully with region: %s", cfg.Region)

	// Create Cognito client
	log.Printf("Creating Cognito client...")
	cognitoClient := cognitoidentityprovider.NewFromConfig(cfg)
	log.Printf("Cognito client created successfully")

	// Initiate authentication
	authInput := &cognitoidentityprovider.InitiateAuthInput{
		AuthFlow: types.AuthFlowTypeUserPasswordAuth,
		ClientId: aws.String(cognitoClientID),
		AuthParameters: map[string]string{
			"USERNAME": strings.ToLower(loginReq.Email),
			"PASSWORD": loginReq.Password,
		},
	}

	log.Printf("Initiating authentication for user: %s", strings.ToLower(loginReq.Email))
	authResult, err := cognitoClient.InitiateAuth(ctx, authInput)
	if err != nil {
		log.Printf("Authentication error: %v", err)
		return handleLoginError(err), nil
	}

	// Check if additional challenges are required
	if authResult.ChallengeName != "" {
		log.Printf("Authentication challenge required: %s", string(authResult.ChallengeName))
		return createErrorResponse(400, "Additional authentication required"), nil
	}

	// Success response
	response := LoginResponse{
		Success: true,
		Message: "Login successful",
		Data: map[string]interface{}{
			"accessToken":  *authResult.AuthenticationResult.AccessToken,
			"idToken":      *authResult.AuthenticationResult.IdToken,
			"refreshToken": *authResult.AuthenticationResult.RefreshToken,
			"expiresIn":    authResult.AuthenticationResult.ExpiresIn,
			"tokenType":    *authResult.AuthenticationResult.TokenType,
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

func handleLoginError(err error) events.APIGatewayProxyResponse {
	if err == nil {
		return createErrorResponse(500, "Unknown login error")
	}

	errStr := err.Error()
	if strings.Contains(errStr, "NotAuthorizedException") {
		return createErrorResponse(401, "Invalid email or password")
	} else if strings.Contains(errStr, "UserNotFoundException") {
		return createErrorResponse(401, "User not found")
	} else if strings.Contains(errStr, "UserNotConfirmedException") {
		return createErrorResponse(400, "User not confirmed")
	} else if strings.Contains(errStr, "PasswordResetRequiredException") {
		return createErrorResponse(400, "Password reset required")
	}

	return createErrorResponse(500, "Login failed")
	}
	
func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := LoginResponse{
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
