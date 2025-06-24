package services

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/sns"
)

type SMSService struct {
	sns *sns.SNS
	db  *dynamodb.DynamoDB
}

type SMSOptions struct {
	PhoneNumber string                 `json:"phoneNumber"`
	Message     string                 `json:"message"`
	MessageType string                 `json:"messageType,omitempty"` // "Promotional", "Transactional"
	SenderID    string                 `json:"senderId,omitempty"`
	MaxPrice    string                 `json:"maxPrice,omitempty"`
	TTL         int                    `json:"ttl,omitempty"` // Time to live in seconds
	Tags        map[string]string      `json:"tags,omitempty"`
	Template    string                 `json:"template,omitempty"`
	TemplateData map[string]interface{} `json:"templateData,omitempty"`
}

type SMSResult struct {
	Success   bool      `json:"success"`
	MessageID string    `json:"messageId,omitempty"`
	Error     string    `json:"error,omitempty"`
	SentAt    time.Time `json:"sentAt"`
	Cost      string    `json:"cost,omitempty"`
}

type PhoneVerificationOptions struct {
	UserID      string `json:"userId"`
	PhoneNumber string `json:"phoneNumber"`
	Purpose     string `json:"purpose"` // "registration", "login", "2fa", "change_phone"
	CodeLength  int    `json:"codeLength,omitempty"`
	ExpiryMins  int    `json:"expiryMins,omitempty"`
}

type PhoneVerificationResult struct {
	Success        bool      `json:"success"`
	VerificationID string    `json:"verificationId,omitempty"`
	Code           string    `json:"code,omitempty"` // Only returned in development mode
	ExpiresAt      time.Time `json:"expiresAt"`
	Error          string    `json:"error,omitempty"`
}

type PhoneVerification struct {
	VerificationID string    `json:"verificationId" dynamodbav:"verificationId"`
	UserID         string    `json:"userId" dynamodbav:"userId"`
	PhoneNumber    string    `json:"phoneNumber" dynamodbav:"phoneNumber"`
	Code           string    `json:"code" dynamodbav:"code"`
	Purpose        string    `json:"purpose" dynamodbav:"purpose"`
	Verified       bool      `json:"verified" dynamodbav:"verified"`
	VerifiedAt     time.Time `json:"verifiedAt,omitempty" dynamodbav:"verifiedAt,omitempty"`
	ExpiresAt      time.Time `json:"expiresAt" dynamodbav:"expiresAt"`
	AttemptCount   int       `json:"attemptCount" dynamodbav:"attemptCount"`
	MaxAttempts    int       `json:"maxAttempts" dynamodbav:"maxAttempts"`
	CreatedAt      time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

type SMSTemplate struct {
	TemplateID   string                 `json:"templateId" dynamodbav:"templateId"`
	Name         string                 `json:"name" dynamodbav:"name"`
	Message      string                 `json:"message" dynamodbav:"message"`
	Category     string                 `json:"category" dynamodbav:"category"`
	Variables    []SMSVariable          `json:"variables" dynamodbav:"variables"`
	MaxLength    int                    `json:"maxLength" dynamodbav:"maxLength"`
	Language     string                 `json:"language" dynamodbav:"language"`
	IsSystem     bool                   `json:"isSystem" dynamodbav:"isSystem"`
	IsActive     bool                   `json:"isActive" dynamodbav:"isActive"`
	AccountID    string                 `json:"accountId,omitempty" dynamodbav:"accountId,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	CreatedAt    time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type SMSVariable struct {
	Name         string `json:"name" dynamodbav:"name"`
	Type         string `json:"type" dynamodbav:"type"`
	Description  string `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Required     bool   `json:"required" dynamodbav:"required"`
	DefaultValue string `json:"defaultValue,omitempty" dynamodbav:"defaultValue,omitempty"`
	MaxLength    int    `json:"maxLength,omitempty" dynamodbav:"maxLength,omitempty"`
}

func NewSMSService() (*SMSService, error) {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}

	return &SMSService{
		sns: sns.New(sess),
		db:  dynamodb.New(sess),
	}, nil
}

// SendSMS sends an SMS message using AWS SNS
func (s *SMSService) SendSMS(opts SMSOptions) (*SMSResult, error) {
	result := &SMSResult{
		SentAt: time.Now(),
	}

	// Validate phone number
	if !s.isValidPhoneNumber(opts.PhoneNumber) {
		result.Error = "Invalid phone number format"
		return result, nil
	}

	// Normalize phone number (ensure it starts with +)
	phoneNumber := s.normalizePhoneNumber(opts.PhoneNumber)

	var message string
	var err error

	// Use template if specified
	if opts.Template != "" {
		message, err = s.renderSMSTemplate(opts.Template, opts.TemplateData)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to render template: %v", err)
			return result, nil
		}
	} else {
		message = opts.Message
	}

	// Validate message length (SMS has character limits)
	if len(message) > 1600 { // SMS limit with concatenation
		result.Error = "Message too long for SMS"
		return result, nil
	}

	// Prepare message attributes
	messageAttributes := make(map[string]*sns.MessageAttributeValue)

	if opts.MessageType != "" {
		messageAttributes["AWS.SNS.SMS.SMSType"] = &sns.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String(opts.MessageType),
		}
	}

	if opts.SenderID != "" {
		messageAttributes["AWS.SNS.SMS.SenderID"] = &sns.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String(opts.SenderID),
		}
	}

	if opts.MaxPrice != "" {
		messageAttributes["AWS.SNS.SMS.MaxPrice"] = &sns.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String(opts.MaxPrice),
		}
	}

	if opts.TTL > 0 {
		messageAttributes["AWS.SNS.SMS.TTL"] = &sns.MessageAttributeValue{
			DataType:    aws.String("Number"),
			StringValue: aws.String(fmt.Sprintf("%d", opts.TTL)),
		}
	}

	// Send SMS
	input := &sns.PublishInput{
		PhoneNumber: aws.String(phoneNumber),
		Message:     aws.String(message),
	}

	if len(messageAttributes) > 0 {
		input.MessageAttributes = messageAttributes
	}

	response, err := s.sns.Publish(input)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to send SMS: %v", err)
		log.Printf("ERROR: Failed to send SMS to %s: %v", phoneNumber, err)
		return result, nil
	}

	result.Success = true
	result.MessageID = *response.MessageId
	log.Printf("SMS sent successfully to %s: %s", phoneNumber, result.MessageID)

	return result, nil
}

// SendVerificationCode sends a verification code via SMS
func (s *SMSService) SendVerificationCode(opts PhoneVerificationOptions) (*PhoneVerificationResult, error) {
	result := &PhoneVerificationResult{}

	// Validate phone number
	if !s.isValidPhoneNumber(opts.PhoneNumber) {
		result.Error = "Invalid phone number format"
		return result, nil
	}

	// Set defaults
	if opts.CodeLength == 0 {
		opts.CodeLength = 6
	}
	if opts.ExpiryMins == 0 {
		opts.ExpiryMins = 10
	}

	// Check for existing unexpired verification
	existing, err := s.getActiveVerification(opts.UserID, opts.PhoneNumber, opts.Purpose)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to check existing verification: %v", err)
		return result, nil
	}

	if existing != nil {
		// Reuse existing verification if still valid
		if time.Now().Before(existing.ExpiresAt) {
			result.Success = true
			result.VerificationID = existing.VerificationID
			result.ExpiresAt = existing.ExpiresAt
			
			// In development mode, return the code
			if s.isDevelopmentMode() {
				result.Code = existing.Code
			}
			
			return result, nil
		}
	}

	// Generate verification code
	code := s.generateVerificationCode(opts.CodeLength)
	verificationID := s.generateVerificationID()
	expiresAt := time.Now().Add(time.Duration(opts.ExpiryMins) * time.Minute)

	// Create verification record
	verification := &PhoneVerification{
		VerificationID: verificationID,
		UserID:         opts.UserID,
		PhoneNumber:    s.normalizePhoneNumber(opts.PhoneNumber),
		Code:           code,
		Purpose:        opts.Purpose,
		Verified:       false,
		ExpiresAt:      expiresAt,
		AttemptCount:   0,
		MaxAttempts:    3,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Save verification to database
	err = s.saveVerification(verification)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to save verification: %v", err)
		return result, nil
	}

	// Send verification SMS
	message := s.getVerificationMessage(opts.Purpose, code, opts.ExpiryMins)
	
	smsResult, err := s.SendSMS(SMSOptions{
		PhoneNumber: opts.PhoneNumber,
		Message:     message,
		MessageType: "Transactional",
		SenderID:    "ListBackup",
		Tags: map[string]string{
			"Category": "verification",
			"Purpose":  opts.Purpose,
		},
	})

	if err != nil || !smsResult.Success {
		result.Error = fmt.Sprintf("Failed to send verification SMS: %v", smsResult.Error)
		return result, nil
	}

	result.Success = true
	result.VerificationID = verificationID
	result.ExpiresAt = expiresAt

	// In development mode, return the code
	if s.isDevelopmentMode() {
		result.Code = code
	}

	return result, nil
}

// VerifyCode verifies a phone verification code
func (s *SMSService) VerifyCode(verificationID, code string) (*PhoneVerification, error) {
	verification, err := s.getVerification(verificationID)
	if err != nil {
		return nil, err
	}

	if verification == nil {
		return nil, fmt.Errorf("verification not found")
	}

	if verification.Verified {
		return nil, fmt.Errorf("phone number already verified")
	}

	if time.Now().After(verification.ExpiresAt) {
		return nil, fmt.Errorf("verification code expired")
	}

	if verification.AttemptCount >= verification.MaxAttempts {
		return nil, fmt.Errorf("maximum verification attempts exceeded")
	}

	// Increment attempt count
	verification.AttemptCount++
	verification.UpdatedAt = time.Now()

	if verification.Code != code {
		// Save updated attempt count
		s.saveVerification(verification)
		return nil, fmt.Errorf("invalid verification code")
	}

	// Mark as verified
	verification.Verified = true
	verification.VerifiedAt = time.Now()

	err = s.saveVerification(verification)
	if err != nil {
		return nil, fmt.Errorf("failed to update verification: %v", err)
	}

	return verification, nil
}

// Template rendering

func (s *SMSService) renderSMSTemplate(templateID string, data map[string]interface{}) (string, error) {
	template, err := s.getSMSTemplate(templateID)
	if err != nil {
		return "", err
	}

	if template == nil {
		return "", fmt.Errorf("template %s not found", templateID)
	}

	if !template.IsActive {
		return "", fmt.Errorf("template %s is not active", templateID)
	}

	message := template.Message
	for key, value := range data {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		message = strings.ReplaceAll(message, placeholder, replacement)
	}

	// Check length limit
	if template.MaxLength > 0 && len(message) > template.MaxLength {
		return "", fmt.Errorf("rendered message exceeds maximum length of %d characters", template.MaxLength)
	}

	return message, nil
}

// Helper methods

func (s *SMSService) isValidPhoneNumber(phoneNumber string) bool {
	// Basic phone number validation (E.164 format)
	phoneRegex := regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)
	return phoneRegex.MatchString(strings.ReplaceAll(phoneNumber, " ", ""))
}

func (s *SMSService) normalizePhoneNumber(phoneNumber string) string {
	// Remove spaces and ensure + prefix
	normalized := strings.ReplaceAll(phoneNumber, " ", "")
	if !strings.HasPrefix(normalized, "+") {
		normalized = "+" + normalized
	}
	return normalized
}

func (s *SMSService) generateVerificationCode(length int) string {
	if length < 4 || length > 8 {
		length = 6 // Default to 6 digits
	}

	code := ""
	for i := 0; i < length; i++ {
		code += fmt.Sprintf("%d", rand.Intn(10))
	}
	return code
}

func (s *SMSService) generateVerificationID() string {
	return fmt.Sprintf("sms_verify_%d", time.Now().UnixNano())
}

func (s *SMSService) getVerificationMessage(purpose, code string, expiryMins int) string {
	switch purpose {
	case "registration":
		return fmt.Sprintf("Welcome to ListBackup! Your verification code is: %s. This code expires in %d minutes.", code, expiryMins)
	case "login":
		return fmt.Sprintf("Your ListBackup login verification code is: %s. This code expires in %d minutes.", code, expiryMins)
	case "2fa":
		return fmt.Sprintf("Your ListBackup two-factor authentication code is: %s. This code expires in %d minutes.", code, expiryMins)
	case "change_phone":
		return fmt.Sprintf("To verify your new phone number for ListBackup, enter this code: %s. This code expires in %d minutes.", code, expiryMins)
	default:
		return fmt.Sprintf("Your ListBackup verification code is: %s. This code expires in %d minutes.", code, expiryMins)
	}
}

func (s *SMSService) isDevelopmentMode() bool {
	return os.Getenv("ENVIRONMENT") == "development" || os.Getenv("NODE_ENV") == "development"
}

func (s *SMSService) saveVerification(verification *PhoneVerification) error {
	tableName := s.getPhoneVerificationsTableName()

	item, err := dynamodbattribute.MarshalMap(verification)
	if err != nil {
		return err
	}

	_, err = s.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	return err
}

func (s *SMSService) getVerification(verificationID string) (*PhoneVerification, error) {
	tableName := s.getPhoneVerificationsTableName()

	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"verificationId": {S: aws.String(verificationID)},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var verification PhoneVerification
	err = dynamodbattribute.UnmarshalMap(result.Item, &verification)
	if err != nil {
		return nil, err
	}

	return &verification, nil
}

func (s *SMSService) getActiveVerification(userID, phoneNumber, purpose string) (*PhoneVerification, error) {
	tableName := s.getPhoneVerificationsTableName()

	result, err := s.db.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("userId = :userId AND phoneNumber = :phoneNumber AND purpose = :purpose AND verified = :verified"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId":      {S: aws.String(userID)},
			":phoneNumber": {S: aws.String(s.normalizePhoneNumber(phoneNumber))},
			":purpose":     {S: aws.String(purpose)},
			":verified":    {BOOL: aws.Bool(false)},
		},
	})
	if err != nil {
		return nil, err
	}

	if len(result.Items) == 0 {
		return nil, nil
	}

	// Return the most recent verification
	var verification PhoneVerification
	err = dynamodbattribute.UnmarshalMap(result.Items[0], &verification)
	if err != nil {
		return nil, err
	}

	return &verification, nil
}

func (s *SMSService) getSMSTemplate(templateID string) (*SMSTemplate, error) {
	tableName := s.getSMSTemplatesTableName()

	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"templateId": {S: aws.String(templateID)},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var template SMSTemplate
	err = dynamodbattribute.UnmarshalMap(result.Item, &template)
	if err != nil {
		return nil, err
	}

	return &template, nil
}

func (s *SMSService) getPhoneVerificationsTableName() string {
	tableName := os.Getenv("PHONE_VERIFICATIONS_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-phone-verifications"
	}
	return tableName
}

func (s *SMSService) getSMSTemplatesTableName() string {
	tableName := os.Getenv("SMS_TEMPLATES_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-sms-templates"
	}
	return tableName
}

// Convenience methods for common SMS types

func (s *SMSService) SendWelcomeSMS(phoneNumber, firstName string) (*SMSResult, error) {
	message := fmt.Sprintf("Welcome to ListBackup, %s! Your account has been successfully created. Start backing up your data today!", firstName)
	
	return s.SendSMS(SMSOptions{
		PhoneNumber: phoneNumber,
		Message:     message,
		MessageType: "Promotional",
		SenderID:    "ListBackup",
		Tags: map[string]string{
			"Category": "welcome",
		},
	})
}

func (s *SMSService) SendBackupNotificationSMS(phoneNumber, sourceName string, success bool) (*SMSResult, error) {
	var message string
	if success {
		message = fmt.Sprintf("✅ Backup completed successfully for %s - ListBackup", sourceName)
	} else {
		message = fmt.Sprintf("❌ Backup failed for %s. Please check your dashboard - ListBackup", sourceName)
	}

	return s.SendSMS(SMSOptions{
		PhoneNumber: phoneNumber,
		Message:     message,
		MessageType: "Transactional",
		SenderID:    "ListBackup",
		Tags: map[string]string{
			"Category": "backup_notification",
		},
	})
}

func (s *SMSService) SendSecurityAlertSMS(phoneNumber, alertMessage string) (*SMSResult, error) {
	message := fmt.Sprintf("🔐 SECURITY ALERT: %s - ListBackup", alertMessage)

	return s.SendSMS(SMSOptions{
		PhoneNumber: phoneNumber,
		Message:     message,
		MessageType: "Transactional",
		SenderID:    "ListBackup",
		MaxPrice:    "0.10", // Higher max price for security alerts
		Tags: map[string]string{
			"Category": "security_alert",
		},
	})
}