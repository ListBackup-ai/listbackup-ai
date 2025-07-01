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

// VerifyAccountRequest represents the request to send verification code
type VerifyAccountRequest struct {
	Type  string `json:"type"`  // "email" or "phone"
	Email string `json:"email"` // Required to identify the user
}

// VerifyCodeRequest represents the request to verify the code
type VerifyCodeRequest struct {
	Email  string `json:"email"`
	Code   string `json:"code"`
	CodeID string `json:"codeId"`
}

// MFACode represents a verification code stored in DynamoDB
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
	snsClient      *sns.SNS
	sesClient      *ses.SES
	mfaCodesTable  string
	usersTable     string
	userPoolID     string
)

func init() {
	sess = session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	cognitoClient = cognitoidentityprovider.New(sess, aws.NewConfig().WithRegion(os.Getenv("COGNITO_REGION")))
	snsClient = sns.New(sess)
	sesClient = ses.New(sess)
	mfaCodesTable = os.Getenv("MFA_CODES_TABLE")
	usersTable = os.Getenv("USERS_TABLE")
	userPoolID = os.Getenv("COGNITO_USER_POOL_ID")
}

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Printf("Verify account request: %+v", event)

	// Determine if this is a code verification or sending request
	var body map[string]interface{}
	if err := json.Unmarshal([]byte(event.Body), &body); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Check if this is a verification request (has code) or send request
	if _, hasCode := body["code"]; hasCode {
		return handleVerifyCode(ctx, event)
	}
	return handleSendCode(ctx, event)
}

func handleSendCode(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Parse request
	var req VerifyAccountRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.Email == "" {
		return createErrorResponse(400, "Email is required"), nil
	}
	if req.Type != "email" && req.Type != "phone" {
		return createErrorResponse(400, "Type must be 'email' or 'phone'"), nil
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
		return createErrorResponse(404, "User not found"), nil
	}

	// Get user details
	var user struct {
		UserID      string `dynamodbav:"userId"`
		Email       string `dynamodbav:"email"`
		PhoneNumber string `dynamodbav:"phoneNumber"`
	}
	err = dynamodbattribute.UnmarshalMap(result.Items[0], &user)
	if err != nil {
		log.Printf("Failed to unmarshal user: %v", err)
		return createErrorResponse(500, "Failed to process request"), nil
	}

	// Generate verification code
	code, err := generateCode()
	if err != nil {
		return createErrorResponse(500, "Failed to generate verification code"), nil
	}

	// Determine destination
	var destination string
	var method string
	if req.Type == "email" {
		destination = user.Email
		method = "EMAIL"
	} else {
		if user.PhoneNumber == "" {
			return createErrorResponse(400, "Phone number not found for user"), nil
		}
		destination = user.PhoneNumber
		method = "SMS"
	}

	// Store code in DynamoDB
	verifyCode := MFACode{
		CodeID:      uuid.New().String(),
		UserID:      user.UserID,
		Code:        code,
		Method:      method,
		Destination: destination,
		Purpose:     "ACCOUNT_VERIFY",
		Verified:    false,
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		ExpiresAt:   time.Now().Add(10 * time.Minute).Unix(), // 10 minute expiry
	}

	av, err := dynamodbattribute.MarshalMap(verifyCode)
	if err != nil {
		log.Printf("Failed to marshal verification code: %v", err)
		return createErrorResponse(500, "Failed to store verification code"), nil
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(mfaCodesTable),
		Item:      av,
	})
	if err != nil {
		log.Printf("Failed to store verification code: %v", err)
		return createErrorResponse(500, "Failed to store verification code"), nil
	}

	// Send verification code
	if req.Type == "email" {
		err = sendVerificationEmail(user.Email, code)
	} else {
		err = sendVerificationSMS(user.PhoneNumber, code)
	}

	if err != nil {
		log.Printf("Failed to send verification code: %v", err)
		return createErrorResponse(500, "Failed to send verification code"), nil
	}

	// Return success
	return createSuccessResponse(map[string]interface{}{
		"message": fmt.Sprintf("Verification code sent to %s", destination),
		"codeId":  verifyCode.CodeID,
		"type":    req.Type,
	}), nil
}

func handleVerifyCode(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Parse request
	var req VerifyCodeRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.Email == "" {
		return createErrorResponse(400, "Email is required"), nil
	}
	if req.Code == "" {
		return createErrorResponse(400, "Code is required"), nil
	}
	if req.CodeID == "" {
		return createErrorResponse(400, "CodeID is required"), nil
	}

	// Get the verification code from DynamoDB
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(mfaCodesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"codeId": {
				S: aws.String(req.CodeID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get verification code: %v", err)
		return createErrorResponse(500, "Failed to verify code"), nil
	}

	if result.Item == nil {
		return createErrorResponse(400, "Invalid or expired verification code"), nil
	}

	var verifyCode MFACode
	err = dynamodbattribute.UnmarshalMap(result.Item, &verifyCode)
	if err != nil {
		log.Printf("Failed to unmarshal verification code: %v", err)
		return createErrorResponse(500, "Failed to verify code"), nil
	}

	// Verify the code matches
	if verifyCode.Code != req.Code {
		return createErrorResponse(400, "Invalid verification code"), nil
	}

	// Verify it's for account verification
	if verifyCode.Purpose != "ACCOUNT_VERIFY" {
		return createErrorResponse(400, "Invalid verification code"), nil
	}

	// Verify it hasn't been used
	if verifyCode.Verified {
		return createErrorResponse(400, "Verification code has already been used"), nil
	}

	// Update Cognito user attributes based on verification type
	if verifyCode.Method == "EMAIL" {
		_, err = cognitoClient.AdminUpdateUserAttributes(&cognitoidentityprovider.AdminUpdateUserAttributesInput{
			UserPoolId: aws.String(userPoolID),
			Username:   aws.String(strings.ToLower(req.Email)),
			UserAttributes: []*cognitoidentityprovider.AttributeType{
				{
					Name:  aws.String("email_verified"),
					Value: aws.String("true"),
				},
			},
		})
	} else { // SMS/Phone
		_, err = cognitoClient.AdminUpdateUserAttributes(&cognitoidentityprovider.AdminUpdateUserAttributesInput{
			UserPoolId: aws.String(userPoolID),
			Username:   aws.String(strings.ToLower(req.Email)),
			UserAttributes: []*cognitoidentityprovider.AttributeType{
				{
					Name:  aws.String("phone_number_verified"),
					Value: aws.String("true"),
				},
			},
		})
	}

	if err != nil {
		log.Printf("Failed to update user attributes: %v", err)
		return createErrorResponse(500, "Failed to verify account"), nil
	}

	// Mark code as verified in DynamoDB
	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(mfaCodesTable),
		Key: map[string]*dynamodb.AttributeValue{
			"codeId": {
				S: aws.String(req.CodeID),
			},
		},
		UpdateExpression: aws.String("SET verified = :true"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":true": {
				BOOL: aws.Bool(true),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to mark code as verified: %v", err)
		// Don't fail the request, verification was successful
	}

	// Return success
	verificationType := "email"
	if verifyCode.Method == "SMS" {
		verificationType = "phone"
	}

	return createSuccessResponse(map[string]interface{}{
		"message": fmt.Sprintf("Account %s verified successfully", verificationType),
		"type":    verificationType,
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

func sendVerificationEmail(emailAddress, code string) error {
	subject := "Verify Your ListBackup.ai Account"
	htmlBody := fmt.Sprintf(`
		<html>
		<body>
			<h2>Account Verification</h2>
			<p>Thank you for registering with ListBackup.ai!</p>
			<p>Your verification code is:</p>
			<h1 style="font-size: 32px; letter-spacing: 5px;">%s</h1>
			<p>This code will expire in 10 minutes.</p>
			<p>If you didn't create an account, please ignore this email.</p>
			<br>
			<p>Best regards,<br>The ListBackup.ai Team</p>
		</body>
		</html>
	`, code)
	textBody := fmt.Sprintf("Account Verification\n\nThank you for registering with ListBackup.ai!\n\nYour verification code is: %s\n\nThis code will expire in 10 minutes.", code)

	_, err := sesClient.SendEmail(&ses.SendEmailInput{
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
		Source:               aws.String("noreply@listbackup.ai"),
		ConfigurationSetName: aws.String(fmt.Sprintf("listbackup-%s-config-set", os.Getenv("STAGE"))),
	})
	return err
}

func sendVerificationSMS(phoneNumber, code string) error {
	message := fmt.Sprintf("Your ListBackup.ai verification code is: %s\n\nThis code will expire in 10 minutes.", code)
	
	_, err := snsClient.Publish(&sns.PublishInput{
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