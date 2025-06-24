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
	log.Printf("=== LOGIN FUNCTION START ===")
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
		log.Printf("ERROR: Missing Cognito configuration")
		return createErrorResponse(500, "Authentication service not configured"), nil
	}

	// Parse request body
	if event.Body == "" {
		return createErrorResponse(400, "Request body is required"), nil
	}

	log.Printf("Raw request body: %s", event.Body)

	var loginReq LoginRequest
	if err := json.Unmarshal([]byte(event.Body), &loginReq); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		log.Printf("Body bytes: %v", []byte(event.Body))
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
	log.Printf("Using Cognito Client ID: %s", cognitoClientID)

	// Create AWS session
	region := os.Getenv("COGNITO_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		log.Printf("Failed to create AWS session: %v", err)
		return createErrorResponse(500, "Login failed"), nil
	}

	// Create Cognito client
	cognitoClient := cognitoidentityprovider.New(sess)

	// Initiate authentication
	authInput := &cognitoidentityprovider.InitiateAuthInput{
		AuthFlow: aws.String("USER_PASSWORD_AUTH"),
		ClientId: aws.String(cognitoClientID),
		AuthParameters: map[string]*string{
			"USERNAME": aws.String(strings.ToLower(loginReq.Email)),
			"PASSWORD": aws.String(loginReq.Password),
		},
	}

	log.Printf("Initiating authentication for user: %s", strings.ToLower(loginReq.Email))
	authResult, err := cognitoClient.InitiateAuth(authInput)
	if err != nil {
		log.Printf("Authentication error: %v", err)
		return handleLoginError(err), nil
	}

	// Check if additional challenges are required
	if authResult.ChallengeName != nil && *authResult.ChallengeName == "NEW_PASSWORD_REQUIRED" {
		log.Printf("New password required, attempting to set permanent password")
		
		// Respond to the challenge by setting the same password as permanent
		challengeResponse := &cognitoidentityprovider.RespondToAuthChallengeInput{
			ClientId: aws.String(cognitoClientID),
			ChallengeName: aws.String("NEW_PASSWORD_REQUIRED"),
			Session: authResult.Session,
			ChallengeResponses: map[string]*string{
				"USERNAME": aws.String(strings.ToLower(loginReq.Email)),
				"NEW_PASSWORD": aws.String(loginReq.Password),
			},
		}
		
		challengeResult, err := cognitoClient.RespondToAuthChallenge(challengeResponse)
		if err != nil {
			log.Printf("Failed to respond to auth challenge: %v", err)
			return createErrorResponse(500, "Login failed"), nil
		}
		
		// Check if we got authentication result from challenge
		if challengeResult.AuthenticationResult == nil {
			log.Printf("No authentication result from challenge response")
			return createErrorResponse(500, "Login failed"), nil
		}
		
		// Create success response from challenge result
		response := LoginResponse{
			Success: true,
			Message: "Login successful",
			Data: map[string]interface{}{
				"accessToken":  *challengeResult.AuthenticationResult.AccessToken,
				"idToken":      *challengeResult.AuthenticationResult.IdToken,
				"refreshToken": *challengeResult.AuthenticationResult.RefreshToken,
				"expiresIn":    *challengeResult.AuthenticationResult.ExpiresIn,
				"tokenType":    *challengeResult.AuthenticationResult.TokenType,
			},
		}

		responseJSON, _ := json.Marshal(response)
		log.Printf("Login successful for user: %s (after password challenge)", loginReq.Email)
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Content-Type":                "application/json",
				"Access-Control-Allow-Origin": "*",
			},
			Body: string(responseJSON),
		}, nil
	} else if authResult.ChallengeName != nil && *authResult.ChallengeName != "" {
		log.Printf("Authentication challenge required: %s", *authResult.ChallengeName)
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
			"expiresIn":    *authResult.AuthenticationResult.ExpiresIn,
			"tokenType":    *authResult.AuthenticationResult.TokenType,
		},
	}

	responseJSON, _ := json.Marshal(response)
	log.Printf("Login successful for user: %s", loginReq.Email)
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