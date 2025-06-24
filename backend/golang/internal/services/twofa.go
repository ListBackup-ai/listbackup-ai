package services

import (
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"log"
	"math"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type TwoFAService struct {
	db         *dynamodb.DynamoDB
	smsService *SMSService
}

type TwoFAMethod struct {
	UserID           string    `json:"userId" dynamodbav:"userId"`
	Method           string    `json:"method" dynamodbav:"method"` // "totp", "sms"
	Enabled          bool      `json:"enabled" dynamodbav:"enabled"`
	Secret           string    `json:"secret,omitempty" dynamodbav:"secret,omitempty"` // For TOTP
	PhoneNumber      string    `json:"phoneNumber,omitempty" dynamodbav:"phoneNumber,omitempty"` // For SMS
	BackupCodes      []string  `json:"backupCodes,omitempty" dynamodbav:"backupCodes,omitempty"`
	LastUsed         time.Time `json:"lastUsed,omitempty" dynamodbav:"lastUsed,omitempty"`
	CreatedAt        time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

type TwoFASetupRequest struct {
	UserID      string `json:"userId"`
	Method      string `json:"method"`
	PhoneNumber string `json:"phoneNumber,omitempty"`
}

type TwoFASetupResponse struct {
	Success     bool     `json:"success"`
	Method      string   `json:"method"`
	Secret      string   `json:"secret,omitempty"`      // TOTP secret for QR code generation
	QRCodeURL   string   `json:"qrCodeUrl,omitempty"`   // TOTP QR code URL
	BackupCodes []string `json:"backupCodes,omitempty"` // Backup recovery codes
	Error       string   `json:"error,omitempty"`
}

type TwoFAVerifyRequest struct {
	UserID      string `json:"userId"`
	Method      string `json:"method"`
	Code        string `json:"code"`
	BackupCode  string `json:"backupCode,omitempty"`
}

type TwoFAVerifyResponse struct {
	Success bool   `json:"success"`
	Valid   bool   `json:"valid"`
	Error   string `json:"error,omitempty"`
}

type TwoFAStatusResponse struct {
	Success     bool           `json:"success"`
	Enabled     bool           `json:"enabled"`
	Methods     []TwoFAMethod  `json:"methods"`
	BackupCodes int            `json:"backupCodesRemaining"`
	Error       string         `json:"error,omitempty"`
}

type TOTPConfig struct {
	Issuer      string `json:"issuer"`
	AccountName string `json:"accountName"`
	Secret      string `json:"secret"`
	Period      int    `json:"period"`
	Digits      int    `json:"digits"`
	Algorithm   string `json:"algorithm"`
}

func NewTwoFAService() (*TwoFAService, error) {
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

	smsService, err := NewSMSService()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize SMS service: %v", err)
	}

	return &TwoFAService{
		db:         dynamodb.New(sess),
		smsService: smsService,
	}, nil
}

// SetupTwoFA initiates 2FA setup for a user
func (s *TwoFAService) SetupTwoFA(req TwoFASetupRequest) (*TwoFASetupResponse, error) {
	response := &TwoFASetupResponse{
		Method: req.Method,
	}

	// Validate method
	if req.Method != "totp" && req.Method != "sms" {
		response.Error = "Invalid 2FA method. Supported methods: totp, sms"
		return response, nil
	}

	// Check if user already has this method enabled
	existing, err := s.getTwoFAMethod(req.UserID, req.Method)
	if err != nil {
		response.Error = fmt.Sprintf("Failed to check existing 2FA methods: %v", err)
		return response, nil
	}

	if existing != nil && existing.Enabled {
		response.Error = "This 2FA method is already enabled for the user"
		return response, nil
	}

	switch req.Method {
	case "totp":
		return s.setupTOTP(req.UserID)
	case "sms":
		return s.setupSMS(req.UserID, req.PhoneNumber)
	default:
		response.Error = "Unsupported 2FA method"
		return response, nil
	}
}

// VerifyTwoFA verifies a 2FA code
func (s *TwoFAService) VerifyTwoFA(req TwoFAVerifyRequest) (*TwoFAVerifyResponse, error) {
	response := &TwoFAVerifyResponse{}

	// Check backup code first if provided
	if req.BackupCode != "" {
		valid, err := s.verifyBackupCode(req.UserID, req.BackupCode)
		if err != nil {
			response.Error = fmt.Sprintf("Failed to verify backup code: %v", err)
			return response, nil
		}
		response.Success = true
		response.Valid = valid
		return response, nil
	}

	// Get 2FA method
	method, err := s.getTwoFAMethod(req.UserID, req.Method)
	if err != nil {
		response.Error = fmt.Sprintf("Failed to get 2FA method: %v", err)
		return response, nil
	}

	if method == nil || !method.Enabled {
		response.Error = "2FA method not enabled for user"
		return response, nil
	}

	switch req.Method {
	case "totp":
		valid := s.verifyTOTP(method.Secret, req.Code)
		response.Success = true
		response.Valid = valid
	case "sms":
		// For SMS, we need to verify against a previously sent code
		// This would typically involve checking a temporary verification record
		response.Error = "SMS verification not implemented in this context"
		return response, nil
	default:
		response.Error = "Unsupported 2FA method"
		return response, nil
	}

	// Update last used timestamp if verification succeeded
	if response.Valid {
		method.LastUsed = time.Now()
		method.UpdatedAt = time.Now()
		s.saveTwoFAMethod(method)
	}

	return response, nil
}

// GetTwoFAStatus returns the 2FA status for a user
func (s *TwoFAService) GetTwoFAStatus(userID string) (*TwoFAStatusResponse, error) {
	response := &TwoFAStatusResponse{}

	methods, err := s.getAllTwoFAMethods(userID)
	if err != nil {
		response.Error = fmt.Sprintf("Failed to get 2FA methods: %v", err)
		return response, nil
	}

	response.Success = true
	response.Methods = methods

	// Check if any method is enabled
	for _, method := range methods {
		if method.Enabled {
			response.Enabled = true
			break
		}
	}

	// Count remaining backup codes
	for _, method := range methods {
		if len(method.BackupCodes) > 0 {
			response.BackupCodes = len(method.BackupCodes)
			break
		}
	}

	return response, nil
}

// DisableTwoFA disables a specific 2FA method for a user
func (s *TwoFAService) DisableTwoFA(userID, method string) error {
	twoFAMethod, err := s.getTwoFAMethod(userID, method)
	if err != nil {
		return err
	}

	if twoFAMethod == nil {
		return fmt.Errorf("2FA method not found")
	}

	twoFAMethod.Enabled = false
	twoFAMethod.UpdatedAt = time.Now()

	return s.saveTwoFAMethod(twoFAMethod)
}

// GenerateBackupCodes generates new backup codes for a user
func (s *TwoFAService) GenerateBackupCodes(userID string) ([]string, error) {
	backupCodes := make([]string, 10) // Generate 10 backup codes
	
	for i := 0; i < 10; i++ {
		code, err := s.generateBackupCode()
		if err != nil {
			return nil, err
		}
		backupCodes[i] = code
	}

	// Find any existing 2FA method to store backup codes
	methods, err := s.getAllTwoFAMethods(userID)
	if err != nil {
		return nil, err
	}

	if len(methods) == 0 {
		return nil, fmt.Errorf("no 2FA methods found for user")
	}

	// Store backup codes in the first enabled method
	for _, method := range methods {
		if method.Enabled {
			method.BackupCodes = backupCodes
			method.UpdatedAt = time.Now()
			err = s.saveTwoFAMethod(&method)
			if err != nil {
				return nil, err
			}
			break
		}
	}

	return backupCodes, nil
}

// Private methods

func (s *TwoFAService) setupTOTP(userID string) (*TwoFASetupResponse, error) {
	response := &TwoFASetupResponse{
		Method: "totp",
	}

	// Generate secret
	secret, err := s.generateTOTPSecret()
	if err != nil {
		response.Error = fmt.Sprintf("Failed to generate TOTP secret: %v", err)
		return response, nil
	}

	// Generate backup codes
	backupCodes, err := s.generateInitialBackupCodes()
	if err != nil {
		response.Error = fmt.Sprintf("Failed to generate backup codes: %v", err)
		return response, nil
	}

	// Create 2FA method record (not enabled until verification)
	method := &TwoFAMethod{
		UserID:      userID,
		Method:      "totp",
		Enabled:     false, // Will be enabled after successful verification
		Secret:      secret,
		BackupCodes: backupCodes,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err = s.saveTwoFAMethod(method)
	if err != nil {
		response.Error = fmt.Sprintf("Failed to save 2FA method: %v", err)
		return response, nil
	}

	// Generate QR code URL
	qrCodeURL := s.generateTOTPQRCodeURL(userID, secret)

	response.Success = true
	response.Secret = secret
	response.QRCodeURL = qrCodeURL
	response.BackupCodes = backupCodes

	return response, nil
}

func (s *TwoFAService) setupSMS(userID, phoneNumber string) (*TwoFASetupResponse, error) {
	response := &TwoFASetupResponse{
		Method: "sms",
	}

	if phoneNumber == "" {
		response.Error = "Phone number is required for SMS 2FA"
		return response, nil
	}

	// Generate backup codes
	backupCodes, err := s.generateInitialBackupCodes()
	if err != nil {
		response.Error = fmt.Sprintf("Failed to generate backup codes: %v", err)
		return response, nil
	}

	// Create 2FA method record (not enabled until verification)
	method := &TwoFAMethod{
		UserID:      userID,
		Method:      "sms",
		Enabled:     false, // Will be enabled after successful verification
		PhoneNumber: phoneNumber,
		BackupCodes: backupCodes,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err = s.saveTwoFAMethod(method)
	if err != nil {
		response.Error = fmt.Sprintf("Failed to save 2FA method: %v", err)
		return response, nil
	}

	response.Success = true
	response.BackupCodes = backupCodes

	return response, nil
}

func (s *TwoFAService) generateTOTPSecret() (string, error) {
	// Generate 20 random bytes for the secret
	bytes := make([]byte, 20)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	// Encode as base32
	secret := base32.StdEncoding.EncodeToString(bytes)
	return strings.TrimRight(secret, "="), nil
}

func (s *TwoFAService) generateTOTPQRCodeURL(userID, secret string) string {
	issuer := "ListBackup"
	accountName := fmt.Sprintf("%s@listbackup.ai", userID)
	
	// Generate otpauth:// URL
	otpauthURL := fmt.Sprintf(
		"otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
		issuer,
		accountName,
		secret,
		issuer,
	)

	// Generate QR code URL (using a QR code service)
	qrCodeURL := fmt.Sprintf(
		"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=%s",
		otpauthURL,
	)

	return qrCodeURL
}

func (s *TwoFAService) verifyTOTP(secret, code string) bool {
	// Generate TOTP code for current time window
	currentTime := time.Now().Unix() / 30 // 30-second window
	
	// Check current window and previous window (to account for clock skew)
	for i := int64(-1); i <= 1; i++ {
		timeWindow := currentTime + i
		expectedCode := s.generateTOTPCode(secret, timeWindow)
		if expectedCode == code {
			return true
		}
	}

	return false
}

func (s *TwoFAService) generateTOTPCode(secret string, timeWindow int64) string {
	// Decode base32 secret
	key, err := base32.StdEncoding.DecodeString(secret + strings.Repeat("=", (8-len(secret)%8)%8))
	if err != nil {
		return ""
	}

	// Convert time window to bytes
	timeBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(timeBytes, uint64(timeWindow))

	// Generate HMAC-SHA1
	hash := sha1.New()
	hash.Write(key)
	hash.Write(timeBytes)
	hmac := hash.Sum(nil)

	// Dynamic truncation
	offset := hmac[len(hmac)-1] & 0x0F
	code := binary.BigEndian.Uint32(hmac[offset:offset+4]) & 0x7FFFFFFF

	// Generate 6-digit code
	code = code % uint32(math.Pow10(6))

	return fmt.Sprintf("%06d", code)
}

func (s *TwoFAService) generateInitialBackupCodes() ([]string, error) {
	backupCodes := make([]string, 10)
	
	for i := 0; i < 10; i++ {
		code, err := s.generateBackupCode()
		if err != nil {
			return nil, err
		}
		backupCodes[i] = code
	}

	return backupCodes, nil
}

func (s *TwoFAService) generateBackupCode() (string, error) {
	// Generate 8-character alphanumeric code
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	bytes := make([]byte, 8)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	for i, b := range bytes {
		bytes[i] = charset[b%byte(len(charset))]
	}

	return string(bytes), nil
}

func (s *TwoFAService) verifyBackupCode(userID, backupCode string) (bool, error) {
	methods, err := s.getAllTwoFAMethods(userID)
	if err != nil {
		return false, err
	}

	for _, method := range methods {
		for i, code := range method.BackupCodes {
			if code == backupCode {
				// Remove used backup code
				method.BackupCodes = append(method.BackupCodes[:i], method.BackupCodes[i+1:]...)
				method.UpdatedAt = time.Now()
				
				err = s.saveTwoFAMethod(&method)
				if err != nil {
					log.Printf("WARNING: Failed to update backup codes after use: %v", err)
				}
				
				return true, nil
			}
		}
	}

	return false, nil
}

// Database operations

func (s *TwoFAService) getTwoFAMethod(userID, method string) (*TwoFAMethod, error) {
	tableName := s.getTwoFATableName()

	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {S: aws.String(userID)},
			"method": {S: aws.String(method)},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var twoFAMethod TwoFAMethod
	err = dynamodbattribute.UnmarshalMap(result.Item, &twoFAMethod)
	if err != nil {
		return nil, err
	}

	return &twoFAMethod, nil
}

func (s *TwoFAService) getAllTwoFAMethods(userID string) ([]TwoFAMethod, error) {
	tableName := s.getTwoFATableName()

	result, err := s.db.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("userId = :userId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId": {S: aws.String(userID)},
		},
	})
	if err != nil {
		return nil, err
	}

	var methods []TwoFAMethod
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &methods)
	if err != nil {
		return nil, err
	}

	return methods, nil
}

func (s *TwoFAService) saveTwoFAMethod(method *TwoFAMethod) error {
	tableName := s.getTwoFATableName()

	item, err := dynamodbattribute.MarshalMap(method)
	if err != nil {
		return err
	}

	_, err = s.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	return err
}

func (s *TwoFAService) getTwoFATableName() string {
	tableName := os.Getenv("TWOFA_METHODS_TABLE")
	if tableName == "" {
		tableName = "listbackup-main-twofa-methods"
	}
	return tableName
}

// EnableTwoFA enables a 2FA method after successful verification
func (s *TwoFAService) EnableTwoFA(userID, method string) error {
	twoFAMethod, err := s.getTwoFAMethod(userID, method)
	if err != nil {
		return err
	}

	if twoFAMethod == nil {
		return fmt.Errorf("2FA method not found")
	}

	twoFAMethod.Enabled = true
	twoFAMethod.UpdatedAt = time.Now()

	return s.saveTwoFAMethod(twoFAMethod)
}

// SendSMSCode sends a 2FA code via SMS for SMS-based 2FA
func (s *TwoFAService) SendSMSCode(userID string) error {
	method, err := s.getTwoFAMethod(userID, "sms")
	if err != nil {
		return err
	}

	if method == nil || !method.Enabled {
		return fmt.Errorf("SMS 2FA not enabled for user")
	}

	// Send verification code via SMS
	_, err = s.smsService.SendVerificationCode(PhoneVerificationOptions{
		UserID:      userID,
		PhoneNumber: method.PhoneNumber,
		Purpose:     "2fa",
		CodeLength:  6,
		ExpiryMins:  5, // 5-minute expiry for 2FA codes
	})

	return err
}

// Convenience methods

func (s *TwoFAService) IsEnabled(userID string) (bool, error) {
	methods, err := s.getAllTwoFAMethods(userID)
	if err != nil {
		return false, err
	}

	for _, method := range methods {
		if method.Enabled {
			return true, nil
		}
	}

	return false, nil
}

func (s *TwoFAService) GetEnabledMethods(userID string) ([]string, error) {
	methods, err := s.getAllTwoFAMethods(userID)
	if err != nil {
		return nil, err
	}

	var enabledMethods []string
	for _, method := range methods {
		if method.Enabled {
			enabledMethods = append(enabledMethods, method.Method)
		}
	}

	return enabledMethods, nil
}