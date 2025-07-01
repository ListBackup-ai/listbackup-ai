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

// PasswordResetRequest represents the request to reset password
type PasswordResetRequest struct {
	Email  string `json:"email"`
	Method string `json:"method,omitempty"` // Optional: SMS or EMAIL
}

// MFACode represents an MFA code stored in DynamoDB (reused for password reset codes)
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
	sesClient      *ses.SES
	snsClient      *sns.SNS
	mfaCodesTable  string
	usersTable     string
	userPoolID     string
)

func init() {
	sess = session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	cognitoClient = cognitoidentityprovider.New(sess, aws.NewConfig().WithRegion(os.Getenv("COGNITO_REGION")))
	sesClient = ses.New(sess)
	snsClient = sns.New(sess)
	mfaCodesTable = os.Getenv("MFA_CODES_TABLE")
	usersTable = os.Getenv("USERS_TABLE")
	userPoolID = os.Getenv("COGNITO_USER_POOL_ID")
}

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Printf("Password reset request: %+v", event)

	// Parse request
	var req PasswordResetRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	if req.Email == "" {
		return createErrorResponse(400, "Email is required"), nil
	}

	// Find user by email in DynamoDB
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(usersTable),
		IndexName:              aws.String("EmailIndex"),
		KeyConditionExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {
				S: aws.String(req.Email),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to query user: %v", err)
		// Don't reveal if user exists or not
		return createSuccessResponse(map[string]interface{}{
			"message": "If the email exists, a password reset code has been sent",
		}), nil
	}

	if len(result.Items) == 0 {
		// Don't reveal if user exists or not
		return createSuccessResponse(map[string]interface{}{
			"message": "If the email exists, a password reset code has been sent",
		}), nil
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

	// Generate 6-digit code
	code, err := generateCode()
	if err != nil {
		return createErrorResponse(500, "Failed to generate reset code"), nil
	}

	// Store code in DynamoDB
	resetCode := MFACode{
		CodeID:      uuid.New().String(),
		UserID:      user.UserID,
		Code:        code,
		Method:      "EMAIL",
		Destination: req.Email,
		Purpose:     "PASSWORD_RESET",
		Verified:    false,
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		ExpiresAt:   time.Now().Add(15 * time.Minute).Unix(), // 15 minute expiry for password reset
	}

	av, err := dynamodbattribute.MarshalMap(resetCode)
	if err != nil {
		log.Printf("Failed to marshal reset code: %v", err)
		return createErrorResponse(500, "Failed to store reset code"), nil
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(mfaCodesTable),
		Item:      av,
	})
	if err != nil {
		log.Printf("Failed to store reset code: %v", err)
		return createErrorResponse(500, "Failed to store reset code"), nil
	}

	// Check if user has a phone number and prefers SMS
	var userPhone string
	if user.CognitoUserID != "" {
		// Get user details from Cognito to check for phone number
		cognitoUser, err := cognitoClient.AdminGetUser(&cognitoidentityprovider.AdminGetUserInput{
			UserPoolId: aws.String(userPoolID),
			Username:   aws.String(user.CognitoUserID),
		})
		if err == nil {
			for _, attr := range cognitoUser.UserAttributes {
				if aws.StringValue(attr.Name) == "phone_number" {
					userPhone = aws.StringValue(attr.Value)
					break
				}
			}
		}
	}
	
	// Send reset code via SMS if phone available, otherwise email
	if userPhone != "" && req.Method == "SMS" {
		err = sendPasswordResetSMS(userPhone, code)
		if err != nil {
			log.Printf("Failed to send reset SMS: %v", err)
			// Fall back to email
			err = sendPasswordResetEmail(req.Email, code, resetCode.CodeID)
			if err != nil {
				log.Printf("Failed to send reset email: %v", err)
				return createErrorResponse(500, "Failed to send reset code"), nil
			}
		}
	} else {
		// Send via email
		err = sendPasswordResetEmail(req.Email, code, resetCode.CodeID)
		if err != nil {
			log.Printf("Failed to send reset email: %v", err)
			return createErrorResponse(500, "Failed to send reset code"), nil
		}
	}

	// Return success (don't include codeId for security)
	return createSuccessResponse(map[string]interface{}{
		"message": "If the email exists, a password reset code has been sent",
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

func sendPasswordResetEmail(emailAddress, code, codeID string) error {
	// Use SES template if available
	templateName := fmt.Sprintf("listbackup-%s-password-reset", os.Getenv("STAGE"))
	
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
		subject := "Password Reset Request - ListBackup.ai"
		htmlBody := fmt.Sprintf(`
			<html>
			<body>
				<h2>Password Reset Request</h2>
				<p>You requested to reset your password for ListBackup.ai.</p>
				<p>Your password reset code is:</p>
				<h1 style="font-size: 32px; letter-spacing: 5px;">%s</h1>
				<p>This code will expire in 15 minutes.</p>
				<p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
				<br>
				<p>Best regards,<br>The ListBackup.ai Team</p>
			</body>
			</html>
		`, code)
		textBody := fmt.Sprintf("Password Reset Request\n\nYou requested to reset your password for ListBackup.ai.\n\nYour password reset code is: %s\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this password reset, please ignore this email.", code)

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

func sendPasswordResetSMS(phoneNumber, code string) error {
	message := fmt.Sprintf("Your ListBackup.ai password reset code is: %s\n\nThis code will expire in 15 minutes.", code)
	
	log.Printf("Attempting to send password reset SMS to: %s", phoneNumber)
	
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
	
	log.Printf("Password reset SMS sent successfully. MessageId: %s", aws.StringValue(result.MessageId))
	return nil
}

func main() {
	lambda.Start(handler)
}