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

// ChangePasswordRequest represents the request to change password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

var (
	sess          *session.Session
	cognitoClient *cognitoidentityprovider.CognitoIdentityProvider
	userPoolID    string
)

func init() {
	sess = session.Must(session.NewSession())
	cognitoClient = cognitoidentityprovider.New(sess, aws.NewConfig().WithRegion(os.Getenv("COGNITO_REGION")))
	userPoolID = os.Getenv("COGNITO_USER_POOL_ID")
}

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Printf("Change password request: %+v", event)

	// Get access token from authorization header
	authHeader := event.Headers["authorization"]
	if authHeader == "" {
		return createErrorResponse(401, "Authorization header is required"), nil
	}

	// Remove "Bearer " prefix if present
	accessToken := authHeader
	if strings.HasPrefix(authHeader, "Bearer ") {
		accessToken = authHeader[7:]
	}

	// Parse request
	var req ChangePasswordRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.CurrentPassword == "" {
		return createErrorResponse(400, "Current password is required"), nil
	}
	if req.NewPassword == "" {
		return createErrorResponse(400, "New password is required"), nil
	}

	// Validate new password requirements
	if len(req.NewPassword) < 6 {
		return createErrorResponse(400, "New password must be at least 6 characters long"), nil
	}

	// Verify passwords are different
	if req.CurrentPassword == req.NewPassword {
		return createErrorResponse(400, "New password must be different from current password"), nil
	}

	// Change password using the user's access token
	_, err := cognitoClient.ChangePassword(&cognitoidentityprovider.ChangePasswordInput{
		AccessToken:      aws.String(accessToken),
		PreviousPassword: aws.String(req.CurrentPassword),
		ProposedPassword: aws.String(req.NewPassword),
	})
	if err != nil {
		log.Printf("Failed to change password: %v", err)
		errStr := err.Error()
		
		// Handle specific error cases
		if strings.Contains(errStr, "NotAuthorizedException") {
			if strings.Contains(errStr, "Incorrect username or password") {
				return createErrorResponse(400, "Current password is incorrect"), nil
			}
			return createErrorResponse(401, "Invalid or expired access token"), nil
		}
		
		// Extract specific password policy errors
		if idx := strings.Index(errStr, "Password does not conform to policy: "); idx != -1 {
			specificError := errStr[idx+len("Password does not conform to policy: "):]
			if endIdx := strings.Index(specificError, "\n"); endIdx != -1 {
				specificError = specificError[:endIdx]
			}
			return createErrorResponse(400, "Password does not meet requirements: " + specificError), nil
		}
		
		if strings.Contains(errStr, "InvalidPasswordException") {
			return createErrorResponse(400, "New password does not meet password policy requirements"), nil
		}
		
		return createErrorResponse(400, "Failed to change password"), nil
	}

	// Return success
	return createSuccessResponse(map[string]interface{}{
		"message": "Password changed successfully",
	}), nil
}

func createSuccessResponse(data interface{}) events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]interface{}{
		"success": true,
		"data":    data,
	})

	return events.APIGatewayV2HTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]interface{}{
		"success": false,
		"error":   message,
	})

	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}
}

func main() {
	lambda.Start(handler)
}