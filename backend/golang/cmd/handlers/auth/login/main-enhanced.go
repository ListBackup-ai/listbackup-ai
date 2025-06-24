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
	"github.com/listbackup/api/internal/util"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

var (
	cognitoUserPoolID = os.Getenv("COGNITO_USER_POOL_ID")
	cognitoClientID   = os.Getenv("COGNITO_CLIENT_ID")
	cookieDomain      = os.Getenv("COOKIE_DOMAIN") // Optional
	cognitoClient     *cognitoidentityprovider.Client
)

func init() {
	// Initialize AWS config and Cognito client once during cold start
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}
	cognitoClient = cognitoidentityprovider.NewFromConfig(cfg)
}

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Enhanced login function called with method: %s", event.RequestContext.HTTP.Method)

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
		return util.Error(500, "Authentication service not configured"), nil
	}

	// Parse request body
	if event.Body == "" {
		return util.Error(400, "Request body is required"), nil
	}

	var loginReq LoginRequest
	if err := json.Unmarshal([]byte(event.Body), &loginReq); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		return util.Error(400, "Invalid JSON format"), nil
	}

	// Validate required fields
	if loginReq.Email == "" {
		return util.Error(400, "Email is required"), nil
	}
	if loginReq.Password == "" {
		return util.Error(400, "Password is required"), nil
	}

	log.Printf("Login request - Email: %s", loginReq.Email)

	// Initiate authentication with Cognito
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
		return util.Error(400, "Additional authentication required"), nil
	}

	// Create secure HTTP-only cookies for token storage
	tokens := authResult.AuthenticationResult
	cookies := util.CreateAuthCookies(
		*tokens.IdToken,
		*tokens.AccessToken,
		*tokens.RefreshToken,
		cookieDomain,
	)

	// Return success response with cookies
	responseData := map[string]interface{}{
		"success": true,
		"message": "Login successful",
		"data": map[string]interface{}{
			"tokenType": *tokens.TokenType,
			"expiresIn": tokens.ExpiresIn,
		},
	}

	return util.WithCookies(200, responseData, cookies)
}

func handleLoginError(err error) events.APIGatewayProxyResponse {
	if err == nil {
		return util.Error(500, "Unknown login error")
	}

	errStr := err.Error()
	if strings.Contains(errStr, "NotAuthorizedException") {
		return util.Error(401, "Invalid email or password")
	} else if strings.Contains(errStr, "UserNotFoundException") {
		return util.Error(401, "User not found")
	} else if strings.Contains(errStr, "UserNotConfirmedException") {
		return util.Error(400, "User not confirmed")
	} else if strings.Contains(errStr, "PasswordResetRequiredException") {
		return util.Error(400, "Password reset required")
	}

	return util.Error(500, "Login failed")
}

func main() {
	lambda.Start(Handle)
}