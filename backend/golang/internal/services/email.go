package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/ses"
)

type EmailService struct {
	ses *ses.SES
	db  *dynamodb.DynamoDB
}

type EmailTemplate struct {
	TemplateID    string                 `json:"templateId" dynamodbav:"templateId"`
	Name          string                 `json:"name" dynamodbav:"name"`
	Description   string                 `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Subject       string                 `json:"subject" dynamodbav:"subject"`
	HTMLTemplate  string                 `json:"htmlTemplate" dynamodbav:"htmlTemplate"`
	TextTemplate  string                 `json:"textTemplate" dynamodbav:"textTemplate"`
	Variables     []EmailVariable        `json:"variables" dynamodbav:"variables"`
	Category      string                 `json:"category" dynamodbav:"category"`
	Language      string                 `json:"language" dynamodbav:"language"`
	IsSystem      bool                   `json:"isSystem" dynamodbav:"isSystem"`
	IsActive      bool                   `json:"isActive" dynamodbav:"isActive"`
	AccountID     string                 `json:"accountId,omitempty" dynamodbav:"accountId,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	CreatedAt     time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt     time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type EmailVariable struct {
	Name         string `json:"name" dynamodbav:"name"`
	Type         string `json:"type" dynamodbav:"type"`
	Description  string `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Required     bool   `json:"required" dynamodbav:"required"`
	DefaultValue string `json:"defaultValue,omitempty" dynamodbav:"defaultValue,omitempty"`
	Format       string `json:"format,omitempty" dynamodbav:"format,omitempty"`
}

type EmailOptions struct {
	ToAddresses   []string               `json:"toAddresses"`
	CCAddresses   []string               `json:"ccAddresses,omitempty"`
	BCCAddresses  []string               `json:"bccAddresses,omitempty"`
	FromAddress   string                 `json:"fromAddress,omitempty"`
	FromName      string                 `json:"fromName,omitempty"`
	ReplyTo       []string               `json:"replyTo,omitempty"`
	Subject       string                 `json:"subject"`
	HTMLBody      string                 `json:"htmlBody,omitempty"`
	TextBody      string                 `json:"textBody,omitempty"`
	TemplateID    string                 `json:"templateId,omitempty"`
	TemplateData  map[string]interface{} `json:"templateData,omitempty"`
	Priority      string                 `json:"priority,omitempty"`
	Tags          map[string]string      `json:"tags,omitempty"`
	ConfigSet     string                 `json:"configSet,omitempty"`
	TrackOpens    bool                   `json:"trackOpens,omitempty"`
	TrackClicks   bool                   `json:"trackClicks,omitempty"`
	Attachments   []EmailAttachment      `json:"attachments,omitempty"`
}

type EmailAttachment struct {
	Name        string `json:"name"`
	Content     []byte `json:"content"`
	ContentType string `json:"contentType"`
}

type EmailResult struct {
	Success   bool      `json:"success"`
	MessageID string    `json:"messageId,omitempty"`
	Error     string    `json:"error,omitempty"`
	SentAt    time.Time `json:"sentAt"`
}

type EmailVerificationOptions struct {
	UserID      string `json:"userId"`
	Email       string `json:"email"`
	TokenType   string `json:"tokenType"` // "registration", "password_reset", "email_change"
	CallbackURL string `json:"callbackUrl,omitempty"`
}

type EmailVerificationResult struct {
	Success        bool      `json:"success"`
	VerificationID string    `json:"verificationId,omitempty"`
	Token          string    `json:"token,omitempty"`
	ExpiresAt      time.Time `json:"expiresAt"`
	Error          string    `json:"error,omitempty"`
}

type EmailVerification struct {
	VerificationID string    `json:"verificationId" dynamodbav:"verificationId"`
	UserID         string    `json:"userId" dynamodbav:"userId"`
	Email          string    `json:"email" dynamodbav:"email"`
	Token          string    `json:"token" dynamodbav:"token"`
	TokenType      string    `json:"tokenType" dynamodbav:"tokenType"`
	CallbackURL    string    `json:"callbackUrl,omitempty" dynamodbav:"callbackUrl,omitempty"`
	Verified       bool      `json:"verified" dynamodbav:"verified"`
	VerifiedAt     time.Time `json:"verifiedAt,omitempty" dynamodbav:"verifiedAt,omitempty"`
	ExpiresAt      time.Time `json:"expiresAt" dynamodbav:"expiresAt"`
	CreatedAt      time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

func NewEmailService() (*EmailService, error) {
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

	return &EmailService{
		ses: ses.New(sess),
		db:  dynamodb.New(sess),
	}, nil
}

// SendEmail sends an email using AWS SES
func (s *EmailService) SendEmail(opts EmailOptions) (*EmailResult, error) {
	result := &EmailResult{
		SentAt: time.Now(),
	}

	// Set default from address
	if opts.FromAddress == "" {
		opts.FromAddress = s.getDefaultFromAddress()
	}

	// Build source address with name if provided
	source := opts.FromAddress
	if opts.FromName != "" {
		source = fmt.Sprintf("%s <%s>", opts.FromName, opts.FromAddress)
	}

	var htmlBody, textBody string
	var err error

	// Use template if specified
	if opts.TemplateID != "" {
		htmlBody, textBody, err = s.renderTemplate(opts.TemplateID, opts.TemplateData)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to render template: %v", err)
			return result, nil
		}
		
		// Also render subject if template contains subject template
		opts.Subject, err = s.renderSubject(opts.TemplateID, opts.TemplateData)
		if err != nil {
			log.Printf("WARNING: Failed to render subject template: %v", err)
		}
	} else {
		htmlBody = opts.HTMLBody
		textBody = opts.TextBody
	}

	// Prepare destination
	destination := &ses.Destination{
		ToAddresses: aws.StringSlice(opts.ToAddresses),
	}
	if len(opts.CCAddresses) > 0 {
		destination.CcAddresses = aws.StringSlice(opts.CCAddresses)
	}
	if len(opts.BCCAddresses) > 0 {
		destination.BccAddresses = aws.StringSlice(opts.BCCAddresses)
	}

	// Prepare message
	message := &ses.Message{
		Subject: &ses.Content{
			Data: aws.String(opts.Subject),
		},
		Body: &ses.Body{},
	}

	if htmlBody != "" {
		message.Body.Html = &ses.Content{
			Data: aws.String(htmlBody),
		}
	}

	if textBody != "" {
		message.Body.Text = &ses.Content{
			Data: aws.String(textBody),
		}
	}

	// Prepare send email input
	input := &ses.SendEmailInput{
		Destination: destination,
		Message:     message,
		Source:      aws.String(source),
	}

	if len(opts.ReplyTo) > 0 {
		input.ReplyToAddresses = aws.StringSlice(opts.ReplyTo)
	}

	if opts.ConfigSet != "" {
		input.ConfigurationSetName = aws.String(opts.ConfigSet)
	}

	// Add tags if specified
	if len(opts.Tags) > 0 {
		var tags []*ses.MessageTag
		for key, value := range opts.Tags {
			tags = append(tags, &ses.MessageTag{
				Name:  aws.String(key),
				Value: aws.String(value),
			})
		}
		input.Tags = tags
	}

	// Send email
	response, err := s.ses.SendEmail(input)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to send email: %v", err)
		log.Printf("ERROR: Failed to send email: %v", err)
		return result, nil
	}

	result.Success = true
	result.MessageID = *response.MessageId
	log.Printf("Email sent successfully: %s", result.MessageID)

	return result, nil
}

// SendVerificationEmail sends an email verification link
func (s *EmailService) SendVerificationEmail(opts EmailVerificationOptions) (*EmailVerificationResult, error) {
	result := &EmailVerificationResult{}

	// Generate verification token
	token := s.generateVerificationToken()
	verificationID := s.generateVerificationID()
	expiresAt := time.Now().Add(24 * time.Hour) // 24 hour expiry

	// Create verification record
	verification := &EmailVerification{
		VerificationID: verificationID,
		UserID:         opts.UserID,
		Email:          opts.Email,
		Token:          token,
		TokenType:      opts.TokenType,
		CallbackURL:    opts.CallbackURL,
		Verified:       false,
		ExpiresAt:      expiresAt,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Save verification to database
	err := s.saveVerification(verification)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to save verification: %v", err)
		return result, nil
	}

	// Generate verification URL
	verificationURL := s.generateVerificationURL(verificationID, token, opts.CallbackURL)

	// Determine template based on token type
	templateID := s.getVerificationTemplateID(opts.TokenType)

	// Send verification email
	emailOpts := EmailOptions{
		ToAddresses: []string{opts.Email},
		TemplateID:  templateID,
		TemplateData: map[string]interface{}{
			"verificationUrl": verificationURL,
			"email":          opts.Email,
			"tokenType":      opts.TokenType,
			"expiresAt":      expiresAt.Format("2006-01-02 15:04:05 MST"),
		},
		Tags: map[string]string{
			"Category": "verification",
			"Type":     opts.TokenType,
		},
		TrackOpens:  true,
		TrackClicks: true,
	}

	emailResult, err := s.SendEmail(emailOpts)
	if err != nil || !emailResult.Success {
		result.Error = fmt.Sprintf("Failed to send verification email: %v", emailResult.Error)
		return result, nil
	}

	result.Success = true
	result.VerificationID = verificationID
	result.Token = token
	result.ExpiresAt = expiresAt

	return result, nil
}

// VerifyEmail verifies an email using the verification token
func (s *EmailService) VerifyEmail(verificationID, token string) (*EmailVerification, error) {
	verification, err := s.getVerification(verificationID)
	if err != nil {
		return nil, err
	}

	if verification == nil {
		return nil, fmt.Errorf("verification not found")
	}

	if verification.Verified {
		return nil, fmt.Errorf("email already verified")
	}

	if time.Now().After(verification.ExpiresAt) {
		return nil, fmt.Errorf("verification token expired")
	}

	if verification.Token != token {
		return nil, fmt.Errorf("invalid verification token")
	}

	// Mark as verified
	verification.Verified = true
	verification.VerifiedAt = time.Now()
	verification.UpdatedAt = time.Now()

	err = s.saveVerification(verification)
	if err != nil {
		return nil, fmt.Errorf("failed to update verification: %v", err)
	}

	return verification, nil
}

// Template rendering methods

func (s *EmailService) renderTemplate(templateID string, data map[string]interface{}) (htmlBody, textBody string, err error) {
	emailTemplate, err := s.getEmailTemplate(templateID)
	if err != nil {
		return "", "", err
	}

	if emailTemplate == nil {
		return "", "", fmt.Errorf("template %s not found", templateID)
	}

	if !emailTemplate.IsActive {
		return "", "", fmt.Errorf("template %s is not active", templateID)
	}

	// Render HTML template
	if emailTemplate.HTMLTemplate != "" {
		htmlTemplate, err := template.New("html").Parse(emailTemplate.HTMLTemplate)
		if err != nil {
			return "", "", fmt.Errorf("failed to parse HTML template: %v", err)
		}

		var htmlBuffer bytes.Buffer
		err = htmlTemplate.Execute(&htmlBuffer, data)
		if err != nil {
			return "", "", fmt.Errorf("failed to execute HTML template: %v", err)
		}
		htmlBody = htmlBuffer.String()
	}

	// Render text template
	if emailTemplate.TextTemplate != "" {
		textTemplate, err := template.New("text").Parse(emailTemplate.TextTemplate)
		if err != nil {
			return "", "", fmt.Errorf("failed to parse text template: %v", err)
		}

		var textBuffer bytes.Buffer
		err = textTemplate.Execute(&textBuffer, data)
		if err != nil {
			return "", "", fmt.Errorf("failed to execute text template: %v", err)
		}
		textBody = textBuffer.String()
	}

	return htmlBody, textBody, nil
}

func (s *EmailService) renderSubject(templateID string, data map[string]interface{}) (string, error) {
	emailTemplate, err := s.getEmailTemplate(templateID)
	if err != nil {
		return "", err
	}

	if emailTemplate == nil {
		return "", fmt.Errorf("template %s not found", templateID)
	}

	subjectTemplate, err := template.New("subject").Parse(emailTemplate.Subject)
	if err != nil {
		return "", fmt.Errorf("failed to parse subject template: %v", err)
	}

	var buffer bytes.Buffer
	err = subjectTemplate.Execute(&buffer, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute subject template: %v", err)
	}

	return buffer.String(), nil
}

// Helper methods

func (s *EmailService) getEmailTemplate(templateID string) (*EmailTemplate, error) {
	tableName := s.getEmailTemplatesTableName()

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

	var template EmailTemplate
	err = dynamodbattribute.UnmarshalMap(result.Item, &template)
	if err != nil {
		return nil, err
	}

	return &template, nil
}

func (s *EmailService) saveVerification(verification *EmailVerification) error {
	tableName := s.getEmailVerificationsTableName()

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

func (s *EmailService) getVerification(verificationID string) (*EmailVerification, error) {
	tableName := s.getEmailVerificationsTableName()

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

	var verification EmailVerification
	err = dynamodbattribute.UnmarshalMap(result.Item, &verification)
	if err != nil {
		return nil, err
	}

	return &verification, nil
}

func (s *EmailService) generateVerificationToken() string {
	// In production, use a cryptographically secure random generator
	return fmt.Sprintf("token_%d", time.Now().UnixNano())
}

func (s *EmailService) generateVerificationID() string {
	// In production, use UUID
	return fmt.Sprintf("verify_%d", time.Now().UnixNano())
}

func (s *EmailService) generateVerificationURL(verificationID, token, callbackURL string) string {
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "https://listbackup.ai"
	}

	if callbackURL != "" {
		return fmt.Sprintf("%s?verificationId=%s&token=%s", callbackURL, verificationID, token)
	}

	return fmt.Sprintf("%s/verify-email?verificationId=%s&token=%s", baseURL, verificationID, token)
}

func (s *EmailService) getVerificationTemplateID(tokenType string) string {
	switch tokenType {
	case "registration":
		return "email_verification_registration"
	case "password_reset":
		return "email_verification_password_reset"
	case "email_change":
		return "email_verification_email_change"
	default:
		return "email_verification_generic"
	}
}

func (s *EmailService) getDefaultFromAddress() string {
	fromAddress := os.Getenv("DEFAULT_FROM_EMAIL")
	if fromAddress == "" {
		fromAddress = "noreply@listbackup.ai"
	}
	return fromAddress
}

func (s *EmailService) getEmailTemplatesTableName() string {
	tableName := os.Getenv("EMAIL_TEMPLATES_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-email-templates"
	}
	return tableName
}

func (s *EmailService) getEmailVerificationsTableName() string {
	tableName := os.Getenv("EMAIL_VERIFICATIONS_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-email-verifications"
	}
	return tableName
}

// Convenience methods for common email types

func (s *EmailService) SendWelcomeEmail(email, firstName string) (*EmailResult, error) {
	return s.SendEmail(EmailOptions{
		ToAddresses: []string{email},
		TemplateID:  "welcome_email",
		TemplateData: map[string]interface{}{
			"firstName": firstName,
			"email":     email,
		},
		Tags: map[string]string{
			"Category": "welcome",
		},
	})
}

func (s *EmailService) SendPasswordResetEmail(email, resetURL string) (*EmailResult, error) {
	return s.SendEmail(EmailOptions{
		ToAddresses: []string{email},
		TemplateID:  "password_reset",
		TemplateData: map[string]interface{}{
			"resetUrl": resetURL,
			"email":    email,
		},
		Tags: map[string]string{
			"Category": "password_reset",
		},
		Priority: "high",
	})
}

func (s *EmailService) SendBackupNotificationEmail(email, sourceName string, success bool, details string) (*EmailResult, error) {
	templateID := "backup_success"
	category := "backup_success"
	if !success {
		templateID = "backup_failure"
		category = "backup_failure"
	}

	return s.SendEmail(EmailOptions{
		ToAddresses: []string{email},
		TemplateID:  templateID,
		TemplateData: map[string]interface{}{
			"sourceName": sourceName,
			"details":    details,
			"success":    success,
		},
		Tags: map[string]string{
			"Category": category,
		},
	})
}