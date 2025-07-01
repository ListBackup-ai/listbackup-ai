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
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)

// PasswordResetConfirmRequest represents the request to confirm password reset
type PasswordResetConfirmRequest struct {
	Email       string `json:"email"`
	Code        string `json:"code"`
	NewPassword string `json:"newPassword"`
}

// MFACode represents an MFA code stored in DynamoDB
type MFACode struct {
	CodeID      string `json:"codeId" dynamodbav:"codeId"`
	UserID      string `json:"userId" dynamodbav:"userId"`
	Code        string `json:"code" dynamodbav:"code"`
	Method      string `json:"method" dynamodbav:"method"`
	Destination string `json:"destination" dynamodbav:"destination"`
	Purpose     string `json:"purpose" dynamodbav:"purpose"`
	Verified    bool   `json:"verified" dynamodbav:"verified"`
	CreatedAt   string `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt   int64  `json:"expiresAt" dynamodbav:"expiresAt"`
}

var (
	sess           *session.Session
	dynamoClient   *dynamodb.DynamoDB
	cognitoClient  *cognitoidentityprovider.CognitoIdentityProvider
	mfaCodesTable  string
	usersTable     string
	userPoolID     string
)

func init() {
	sess = session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	cognitoClient = cognitoidentityprovider.New(sess, aws.NewConfig().WithRegion(os.Getenv("COGNITO_REGION")))
	mfaCodesTable = os.Getenv("MFA_CODES_TABLE")
	usersTable = os.Getenv("USERS_TABLE")
	userPoolID = os.Getenv("COGNITO_USER_POOL_ID")
}

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Printf("Password reset confirm request: %+v", event)

	// Parse request
	var req PasswordResetConfirmRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.Email == "" {
		return createErrorResponse(400, "Email is required"), nil
	}
	if req.Code == "" {
		return createErrorResponse(400, "Reset code is required"), nil
	}
	if req.NewPassword == "" {
		return createErrorResponse(400, "New password is required"), nil
	}

	// Validate password requirements
	if len(req.NewPassword) < 6 {
		return createErrorResponse(400, "Password must be at least 6 characters long"), nil
	}

	// Find user by email
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(usersTable),
		IndexName:              aws.String("EmailIndex"),
		KeyConditionExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {
				S: aws.String(strings.ToLower(req.Email)),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to query user: %v", err)
		return createErrorResponse(500, "Failed to process request"), nil
	}

	if len(result.Items) == 0 {
		return createErrorResponse(400, "Invalid email or reset code"), nil
	}

	// Get user details
	var user struct {
		UserID        string `dynamodbav:"userId"`
		Email         string `dynamodbav:"email"`
		CognitoUserID string `dynamodbav:"cognitoUserId"`
	}
	err = dynamodbattribute.UnmarshalMap(result.Items[0], &user)
	if err != nil {
		log.Printf("Failed to unmarshal user: %v", err)
		return createErrorResponse(500, "Failed to process request"), nil
	}

	// Find the reset code for this user
	queryExpr, err := expression.NewBuilder().
		WithKeyCondition(
			expression.Key("userId").Equal(expression.Value(user.UserID)),
		).
		WithFilter(
			expression.And(
				expression.Name("purpose").Equal(expression.Value("PASSWORD_RESET")),
				expression.Name("code").Equal(expression.Value(req.Code)),
				expression.Name("destination").Equal(expression.Value(strings.ToLower(req.Email))),
				expression.Name("verified").Equal(expression.Value(false)),
			),
		).
		Build()
	if err != nil {
		log.Printf("Failed to build query expression: %v", err)
		return createErrorResponse(500, "Failed to process request"), nil
	}

	queryResult, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(mfaCodesTable),
		IndexName:                 aws.String("UserIndex"),
		KeyConditionExpression:    queryExpr.KeyCondition(),
		FilterExpression:          queryExpr.Filter(),
		ExpressionAttributeNames:  queryExpr.Names(),
		ExpressionAttributeValues: queryExpr.Values(),
	})
	if err != nil {
		log.Printf("Failed to query reset code: %v", err)
		return createErrorResponse(500, "Failed to process request"), nil
	}

	if len(queryResult.Items) == 0 {
		return createErrorResponse(400, "Invalid or expired reset code"), nil
	}

	// Get the code details
	var resetCode MFACode
	err = dynamodbattribute.UnmarshalMap(queryResult.Items[0], &resetCode)
	if err != nil {
		log.Printf("Failed to unmarshal reset code: %v", err)
		return createErrorResponse(500, "Failed to process request"), nil
	}

	// Update password in Cognito
	_, err = cognitoClient.AdminSetUserPassword(&cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String(userPoolID),
		Username:   aws.String(strings.ToLower(req.Email)),
		Password:   aws.String(req.NewPassword),
		Permanent:  aws.Bool(true),
	})
	if err != nil {
		log.Printf("Failed to update password: %v", err)
		errStr := err.Error()
		// Extract specific password policy errors
		if idx := strings.Index(errStr, "Password does not conform to policy: "); idx != -1 {
			specificError := errStr[idx+len("Password does not conform to policy: "):]
			if endIdx := strings.Index(specificError, "\n"); endIdx != -1 {
				specificError = specificError[:endIdx]
			}
			return createErrorResponse(400, "Password does not meet requirements: " + specificError), nil
		}
		return createErrorResponse(400, "Failed to update password"), nil
	}

	// Mark the reset code as used
	updateExpr, err := expression.NewBuilder().WithUpdate(
		expression.Set(expression.Name("verified"), expression.Value(true)),
	).Build()
	if err != nil {
		log.Printf("Failed to build update expression: %v", err)
		// Don't fail the request, password was already updated
	} else {
		_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
			TableName: aws.String(mfaCodesTable),
			Key: map[string]*dynamodb.AttributeValue{
				"codeId": {
					S: aws.String(resetCode.CodeID),
				},
			},
			ExpressionAttributeNames:  updateExpr.Names(),
			ExpressionAttributeValues: updateExpr.Values(),
			UpdateExpression:          updateExpr.Update(),
		})
		if err != nil {
			log.Printf("Failed to mark code as used: %v", err)
			// Don't fail the request, password was already updated
		}
	}

	// Return success
	return createSuccessResponse(map[string]interface{}{
		"message": "Password has been reset successfully",
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