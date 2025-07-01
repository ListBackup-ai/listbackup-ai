package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/aws/aws-sdk-go/service/sns"
	"github.com/google/uuid"
)

// MFASetupRequest represents the request to setup MFA
type MFASetupRequest struct {
	Method      string `json:"method"`      // "SMS" or "EMAIL"
	Destination string `json:"destination"` // Phone number or email address
}

// MFACode represents an MFA code stored in DynamoDB
type MFACode struct {
	CodeID    string    `json:"codeId" dynamodbav:"codeId"`
	UserID    string    `json:"userId" dynamodbav:"userId"`
	Code      string    `json:"code" dynamodbav:"code"`
	Method    string    `json:"method" dynamodbav:"method"`       // SMS or EMAIL
	Destination string `json:"destination" dynamodbav:"destination"` // Phone or email
	Purpose   string    `json:"purpose" dynamodbav:"purpose"`     // MFA_SETUP, MFA_VERIFY, PASSWORD_RESET
	Verified  bool      `json:"verified" dynamodbav:"verified"`
	CreatedAt string    `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt int64     `json:"expiresAt" dynamodbav:"expiresAt"` // TTL
}

var (
	sess           *session.Session
	dynamoClient   *dynamodb.DynamoDB
	cognitoClient  *cognitoidentityprovider.CognitoIdentityProvider
	snsClient      *sns.SNS
	sesClient      *ses.SES
	mfaCodesTable  string
	userPoolID     string
	cognitoRegion  string
)

func init() {
	sess = session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	cognitoClient = cognitoidentityprovider.New(sess, aws.NewConfig().WithRegion(os.Getenv("COGNITO_REGION")))
	snsClient = sns.New(sess)
	sesClient = ses.New(sess)
	mfaCodesTable = os.Getenv("MFA_CODES_TABLE")
	userPoolID = os.Getenv("COGNITO_USER_POOL_ID")
	cognitoRegion = os.Getenv("COGNITO_REGION")
}

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Printf("MFA Setup request: %+v", event)

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
	var req MFASetupRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate method
	if req.Method != "SMS" && req.Method != "EMAIL" {
		return createErrorResponse(400, "Invalid MFA method. Must be SMS or EMAIL"), nil
	}

	// If no destination provided, fetch from user profile
	if req.Destination == "" {
		// Get user attributes from Cognito
		userResult, err := cognitoClient.AdminGetUser(&cognitoidentityprovider.AdminGetUserInput{
			UserPoolId: aws.String(userPoolID),
			Username:   aws.String(userID),
		})
		if err != nil {
			log.Printf("Failed to get user from Cognito: %v", err)
			return createErrorResponse(500, "Failed to retrieve user information"), nil
		}

		// Extract phone number or email based on method
		for _, attr := range userResult.UserAttributes {
			if req.Method == "SMS" && aws.StringValue(attr.Name) == "phone_number" {
				req.Destination = aws.StringValue(attr.Value)
				break
			} else if req.Method == "EMAIL" && aws.StringValue(attr.Name) == "email" {
				req.Destination = aws.StringValue(attr.Value)
				break
			}
		}

		if req.Destination == "" {
			return createErrorResponse(400, fmt.Sprintf("No %s found for user", strings.ToLower(req.Method))), nil
		}
	}

	// Generate 6-digit code
	code, err := generateCode()
	if err != nil {
		return createErrorResponse(500, "Failed to generate MFA code"), nil
	}

	// Store code in DynamoDB
	mfaCode := MFACode{
		CodeID:      uuid.New().String(),
		UserID:      userID,
		Code:        code,
		Method:      req.Method,
		Destination: req.Destination,
		Purpose:     "MFA_SETUP",
		Verified:    false,
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		ExpiresAt:   time.Now().Add(5 * time.Minute).Unix(), // 5 minute expiry
	}

	av, err := dynamodbattribute.MarshalMap(mfaCode)
	if err != nil {
		log.Printf("Failed to marshal MFA code: %v", err)
		return createErrorResponse(500, "Failed to store MFA code"), nil
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(mfaCodesTable),
		Item:      av,
	})
	if err != nil {
		log.Printf("Failed to store MFA code: %v", err)
		return createErrorResponse(500, "Failed to store MFA code"), nil
	}

	// Send code
	if req.Method == "SMS" {
		err = sendSMS(req.Destination, code, userID)
	} else {
		err = sendEmail(req.Destination, code)
	}

	if err != nil {
		log.Printf("Failed to send MFA code: %v", err)
		return createErrorResponse(500, "Failed to send MFA code"), nil
	}

	// Return success
	return createSuccessResponse(map[string]interface{}{
		"message": fmt.Sprintf("MFA code sent to %s", req.Destination),
		"codeId":  mfaCode.CodeID,
		"method":  req.Method,
	}), nil
}

func generateCode() (string, error) {
	max := big.NewInt(999999)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	// Ensure 6 digits by adding leading zeros
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func sendSMS(phoneNumber, code, userID string) error {
	message := fmt.Sprintf("Your ListBackup.ai MFA setup code is: %s\n\nThis code will expire in 5 minutes.", code)
	
	log.Printf("Attempting to send SMS to: %s", phoneNumber)
	
	// Try using Cognito's SMS capabilities by updating the user's phone number
	// This will trigger Cognito to send a verification code
	// But since we want to use our own code, we'll fall back to SNS
	
	// For now, let's use SNS directly as it's more straightforward
	result, err := snsClient.Publish(&sns.PublishInput{
		PhoneNumber: aws.String(phoneNumber),
		Message:     aws.String(message),
		MessageAttributes: map[string]*sns.MessageAttributeValue{
			"AWS.SNS.SMS.SenderID": {
				DataType:    aws.String("String"),
				StringValue: aws.String("ListBackup"),
			},
			"AWS.SNS.SMS.SMSType": {
				DataType:    aws.String("String"),
				StringValue: aws.String("Transactional"),
			},
		},
	})
	
	if err != nil {
		log.Printf("Failed to send SMS: %v", err)
		return err
	}
	
	log.Printf("SMS sent successfully. MessageId: %s", aws.StringValue(result.MessageId))
	return nil
}

func sendEmail(emailAddress, code string) error {
	// Use SES template if available
	templateName := fmt.Sprintf("listbackup-%s-mfa-setup", os.Getenv("STAGE"))
	
	// Try to send with template first
	_, err := sesClient.SendTemplatedEmail(&ses.SendTemplatedEmailInput{
		Destination: &ses.Destination{
			ToAddresses: []*string{aws.String(emailAddress)},
		},
		Source:       aws.String("noreply@listbackup.ai"),
		Template:     aws.String(templateName),
		TemplateData: aws.String(fmt.Sprintf(`{"name": "%s", "code": "%s"}`, emailAddress, code)),
		ConfigurationSetName: aws.String(fmt.Sprintf("listbackup-%s-config-set", os.Getenv("STAGE"))),
	})
	
	// If template doesn't exist, fall back to regular email
	if err != nil && strings.Contains(err.Error(), "TemplateDoesNotExist") {
		subject := "Your ListBackup.ai MFA Setup Code"
		htmlBody := fmt.Sprintf(`
			<html>
			<body>
				<h2>ListBackup.ai MFA Setup</h2>
				<p>Your MFA setup code is:</p>
				<h1 style="font-size: 32px; letter-spacing: 5px;">%s</h1>
				<p>This code will expire in 5 minutes.</p>
				<p>If you didn't request this code, please ignore this email.</p>
				<br>
				<p>Best regards,<br>The ListBackup.ai Team</p>
			</body>
			</html>
		`, code)
		textBody := fmt.Sprintf("Your ListBackup.ai MFA setup code is: %s\n\nThis code will expire in 5 minutes.", code)

		_, err = sesClient.SendEmail(&ses.SendEmailInput{
			Destination: &ses.Destination{
				ToAddresses: []*string{aws.String(emailAddress)},
			},
			Message: &ses.Message{
				Body: &ses.Body{
					Html: &ses.Content{
						Charset: aws.String("UTF-8"),
						Data:    aws.String(htmlBody),
					},
					Text: &ses.Content{
						Charset: aws.String("UTF-8"),
						Data:    aws.String(textBody),
					},
				},
				Subject: &ses.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(subject),
				},
			},
			Source: aws.String("noreply@listbackup.ai"),
			ConfigurationSetName: aws.String(fmt.Sprintf("listbackup-%s-config-set", os.Getenv("STAGE"))),
		})
	}
	
	return err
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