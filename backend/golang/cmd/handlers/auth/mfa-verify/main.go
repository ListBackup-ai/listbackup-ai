package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)

// MFAVerifyRequest represents the request to verify MFA
type MFAVerifyRequest struct {
	CodeID string `json:"codeId"`
	Code   string `json:"code"`
}

// MFACode represents an MFA code stored in DynamoDB
type MFACode struct {
	CodeID      string    `json:"codeId" dynamodbav:"codeId"`
	UserID      string    `json:"userId" dynamodbav:"userId"`
	Code        string    `json:"code" dynamodbav:"code"`
	Method      string    `json:"method" dynamodbav:"method"`
	Destination string    `json:"destination" dynamodbav:"destination"`
	Purpose     string    `json:"purpose" dynamodbav:"purpose"`
	Verified    bool      `json:"verified" dynamodbav:"verified"`
	CreatedAt   string    `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt   int64     `json:"expiresAt" dynamodbav:"expiresAt"`
}

var (
	sess           *session.Session
	dynamoClient   *dynamodb.DynamoDB
	cognitoClient  *cognitoidentityprovider.CognitoIdentityProvider
	mfaCodesTable  string
	userPoolID     string
)

func init() {
	sess = session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	cognitoClient = cognitoidentityprovider.New(sess, aws.NewConfig().WithRegion(os.Getenv("COGNITO_REGION")))
	mfaCodesTable = os.Getenv("MFA_CODES_TABLE")
	userPoolID = os.Getenv("COGNITO_USER_POOL_ID")
}

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Printf("MFA Verify request: %+v", event)

	// Get user ID from authorizer
	var userID string
	if event.RequestContext.Authorizer != nil && event.RequestContext.Authorizer.JWT != nil {
		claims := event.RequestContext.Authorizer.JWT.Claims
		if sub, ok := claims["sub"]; ok {
			userID = sub
		}
	}

	if userID == "" {
		return createErrorResponse(401, "Unauthorized"), nil
	}

	// Parse request
	var req MFAVerifyRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Get the MFA code from DynamoDB
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(mfaCodesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"codeId": {
				S: aws.String(req.CodeID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get MFA code: %v", err)
		return createErrorResponse(500, "Failed to verify MFA code"), nil
	}

	if result.Item == nil {
		return createErrorResponse(400, "Invalid or expired MFA code"), nil
	}

	var mfaCode MFACode
	err = dynamodbattribute.UnmarshalMap(result.Item, &mfaCode)
	if err != nil {
		log.Printf("Failed to unmarshal MFA code: %v", err)
		return createErrorResponse(500, "Failed to verify MFA code"), nil
	}

	// Verify the code belongs to the user
	if mfaCode.UserID != userID {
		return createErrorResponse(400, "Invalid MFA code"), nil
	}

	// Verify the code hasn't been used
	if mfaCode.Verified {
		return createErrorResponse(400, "MFA code has already been used"), nil
	}

	// Verify the code matches
	if mfaCode.Code != req.Code {
		return createErrorResponse(400, "Invalid MFA code"), nil
	}

	// Mark code as verified
	expr, err := expression.NewBuilder().WithUpdate(
		expression.Set(expression.Name("verified"), expression.Value(true)),
	).Build()
	if err != nil {
		log.Printf("Failed to build update expression: %v", err)
		return createErrorResponse(500, "Failed to verify MFA code"), nil
	}

	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(mfaCodesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"codeId": {
				S: aws.String(req.CodeID),
			},
		},
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		UpdateExpression:          expr.Update(),
	})
	if err != nil {
		log.Printf("Failed to update MFA code: %v", err)
		return createErrorResponse(500, "Failed to verify MFA code"), nil
	}

	// Update user's MFA preference in Cognito based on the method
	if mfaCode.Purpose == "MFA_SETUP" {
		// Get username from Cognito
		getUserResult, err := cognitoClient.GetUser(&cognitoidentityprovider.GetUserInput{
			AccessToken: aws.String(event.Headers["authorization"][7:]), // Remove "Bearer "
		})
		if err != nil {
			log.Printf("Failed to get user: %v", err)
			return createErrorResponse(500, "Failed to update MFA settings"), nil
		}

		// Update MFA preference
		var smsMfaSettings *cognitoidentityprovider.SMSMfaSettingsType
		var softwareTokenMfaSettings *cognitoidentityprovider.SoftwareTokenMfaSettingsType
		if mfaCode.Method == "SMS" {
			smsMfaSettings = &cognitoidentityprovider.SMSMfaSettingsType{
				Enabled:      aws.Bool(true),
				PreferredMfa: aws.Bool(true),
			}
			// Also update phone_number attribute
			_, err = cognitoClient.AdminUpdateUserAttributes(&cognitoidentityprovider.AdminUpdateUserAttributesInput{
				UserPoolId: aws.String(userPoolID),
				Username:   getUserResult.Username,
				UserAttributes: []*cognitoidentityprovider.AttributeType{
					{
						Name:  aws.String("phone_number"),
						Value: aws.String(mfaCode.Destination),
					},
					{
						Name:  aws.String("phone_number_verified"),
						Value: aws.String("true"),
					},
				},
			})
			if err != nil {
				log.Printf("Failed to update phone number: %v", err)
			}
		}

		_, err = cognitoClient.AdminSetUserMFAPreference(&cognitoidentityprovider.AdminSetUserMFAPreferenceInput{
			UserPoolId:                aws.String(userPoolID),
			Username:                  getUserResult.Username,
			SMSMfaSettings:           smsMfaSettings,
			SoftwareTokenMfaSettings: softwareTokenMfaSettings,
		})
		if err != nil {
			log.Printf("Failed to update MFA preference: %v", err)
			// Don't fail the request, MFA was verified successfully
		}
	}

	// Return success
	return createSuccessResponse(map[string]interface{}{
		"message": "MFA code verified successfully",
		"purpose": mfaCode.Purpose,
		"method":  mfaCode.Method,
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