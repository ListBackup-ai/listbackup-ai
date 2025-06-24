package services

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
)

// AccountServiceV1 handles hierarchical account operations using AWS SDK v1
type AccountServiceV1 struct {
	db *database.DynamoDBClientV1
}

// NewAccountServiceV1 creates a new account service using AWS SDK v1
func NewAccountServiceV1() (*AccountServiceV1, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, fmt.Errorf("failed to create DynamoDB client: %v", err)
	}

	return &AccountServiceV1{db: db}, nil
}

// GetDefaultPermissions returns default permissions for a role
func GetDefaultPermissionsV1(role string) apitypes.UserPermissions {
	switch strings.ToLower(role) {
	case "owner":
		return apitypes.UserPermissions{
			CanCreateSubAccounts:  true,
			CanInviteUsers:        true,
			CanManageIntegrations: true,
			CanViewAllData:        true,
			CanManageBilling:      true,
			CanDeleteAccount:      true,
			CanModifySettings:     true,
		}
	case "manager":
		return apitypes.UserPermissions{
			CanCreateSubAccounts:  false,
			CanInviteUsers:        true,
			CanManageIntegrations: true,
			CanViewAllData:        true,
			CanManageBilling:      false,
			CanDeleteAccount:      false,
			CanModifySettings:     true,
		}
	case "viewer":
		return apitypes.UserPermissions{
			CanCreateSubAccounts:  false,
			CanInviteUsers:        false,
			CanManageIntegrations: false,
			CanViewAllData:        true,
			CanManageBilling:      false,
			CanDeleteAccount:      false,
			CanModifySettings:     false,
		}
	default:
		// Return most restrictive permissions as default
		return apitypes.UserPermissions{}
	}
}

// CreateRootAccount creates a new root level account
func (s *AccountServiceV1) CreateRootAccount(ownerUserID, createdByUserID, name, company string) (*apitypes.Account, error) {
	accountID := "account:" + uuid.New().String()
	now := time.Now()

	account := &apitypes.Account{
		AccountID:       accountID,
		ParentAccountID: nil,
		OwnerUserID:     ownerUserID,
		CreatedByUserID: createdByUserID, // User from auth token who created this account
		Name:            name,
		Company:         company,
		AccountPath:     "/" + strings.TrimPrefix(accountID, "account:"),
		Level:           0,
		Plan:            "free",
		Status:          "active",
		CreatedAt:       now,
		UpdatedAt:       now,
		Settings: apitypes.AccountSettings{
			MaxSources:       10,
			MaxStorageGB:     5,
			MaxBackupJobs:    5,
			RetentionDays:    30,
			AllowSubAccounts: true,
			MaxSubAccounts:   5,
		},
		Usage: apitypes.AccountUsage{},
	}

	// Create account record
	if err := s.db.PutItem(database.AccountsTable, account); err != nil {
		return nil, fmt.Errorf("failed to create account: %v", err)
	}

	// Create user-account relationship
	userAccount := &apitypes.UserAccount{
		UserID:      ownerUserID,
		AccountID:   accountID,
		Role:        "Owner",
		Status:      "Active",
		Permissions: GetDefaultPermissionsV1("Owner"),
		LinkedAt:    now,
		UpdatedAt:   now,
	}

	if err := s.db.PutItem(database.UserAccountsTable, userAccount); err != nil {
		return nil, fmt.Errorf("failed to create user-account relationship: %v", err)
	}

	return account, nil
}

// CreateSubAccount creates a new sub-account under a parent
func (s *AccountServiceV1) CreateSubAccount(parentAccountID, ownerUserID, createdByUserID, name string) (*apitypes.Account, error) {
	// Get parent account to validate and build path
	parent, err := s.GetAccountByID(parentAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get parent account: %v", err)
	}

	// Validate sub-account creation permissions
	if !parent.Settings.AllowSubAccounts {
		return nil, fmt.Errorf("sub-accounts are not allowed for this account")
	}

	// Check current sub-account count
	subAccountCount, err := s.GetSubAccountCount(parentAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to check sub-account count: %v", err)
	}

	if subAccountCount >= parent.Settings.MaxSubAccounts {
		return nil, fmt.Errorf("maximum sub-accounts limit (%d) reached", parent.Settings.MaxSubAccounts)
	}

	accountID := "account:" + uuid.New().String()
	now := time.Now()

	account := &apitypes.Account{
		AccountID:       accountID,
		ParentAccountID: &parentAccountID,
		OwnerUserID:     ownerUserID,
		CreatedByUserID: createdByUserID, // Track who created this sub-account
		Name:            name,
		Company:         parent.Company, // Inherit from parent
		AccountPath:     parent.AccountPath + "/" + strings.TrimPrefix(accountID, "account:"),
		Level:           parent.Level + 1,
		Plan:            "free", // New sub-accounts start with free plan
		Status:          "active",
		CreatedAt:       now,
		UpdatedAt:       now,
		Settings: apitypes.AccountSettings{
			MaxSources:       5, // Sub-accounts get reduced limits
			MaxStorageGB:     2,
			MaxBackupJobs:    3,
			RetentionDays:    30,
			AllowSubAccounts: true,
			MaxSubAccounts:   3,
		},
		Usage: apitypes.AccountUsage{},
	}

	// Create account record
	if err := s.db.PutItem(database.AccountsTable, account); err != nil {
		return nil, fmt.Errorf("failed to create sub-account: %v", err)
	}

	// Create user-account relationship
	userAccount := &apitypes.UserAccount{
		UserID:      ownerUserID,
		AccountID:   accountID,
		Role:        "Owner",
		Status:      "Active",
		Permissions: GetDefaultPermissionsV1("Owner"),
		LinkedAt:    now,
		UpdatedAt:   now,
	}

	if err := s.db.PutItem(database.UserAccountsTable, userAccount); err != nil {
		return nil, fmt.Errorf("failed to create user-account relationship: %v", err)
	}

	return account, nil
}

// GetAccountByID retrieves an account by ID
func (s *AccountServiceV1) GetAccountByID(accountID string) (*apitypes.Account, error) {
	// Ensure account: prefix
	if !strings.HasPrefix(accountID, "account:") {
		accountID = "account:" + accountID
	}

	key := map[string]*dynamodb.AttributeValue{
		"accountId": {
			S: aws.String(accountID),
		},
	}

	var account apitypes.Account
	err := s.db.GetItem(database.AccountsTable, key, &account)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %v", err)
	}

	return &account, nil
}

// GetUserAccounts retrieves all accounts a user has access to
func (s *AccountServiceV1) GetUserAccounts(userID string) ([]apitypes.UserAccount, error) {
	// Ensure user: prefix
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}

	keyCondition := "userId = :userId"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":userId": {
			S: aws.String(userID),
		},
	}

	var userAccounts []apitypes.UserAccount
	err := s.db.Query(database.UserAccountsTable, keyCondition, expressionAttributeValues, &userAccounts)
	if err != nil {
		return nil, fmt.Errorf("failed to query user accounts: %v", err)
	}

	return userAccounts, nil
}

// GetUserAccountRelationship gets the relationship between a user and specific account
func (s *AccountServiceV1) GetUserAccountRelationship(userID, accountID string) (*apitypes.UserAccount, error) {
	// Ensure prefixes
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}
	if !strings.HasPrefix(accountID, "account:") {
		accountID = "account:" + accountID
	}

	key := map[string]*dynamodb.AttributeValue{
		"userId": {
			S: aws.String(userID),
		},
		"accountId": {
			S: aws.String(accountID),
		},
	}

	var userAccount apitypes.UserAccount
	err := s.db.GetItem(database.UserAccountsTable, key, &userAccount)
	if err != nil {
		return nil, fmt.Errorf("failed to get user-account relationship: %v", err)
	}

	return &userAccount, nil
}

// ValidateAccountAccess checks if a user has access to an account and returns their permissions
func (s *AccountServiceV1) ValidateAccountAccess(userID, accountID string) (*apitypes.UserAccount, error) {
	userAccount, err := s.GetUserAccountRelationship(userID, accountID)
	if err != nil {
		return nil, fmt.Errorf("user does not have access to account")
	}

	if userAccount.Status != "Active" {
		return nil, fmt.Errorf("user access to account is not active")
	}

	return userAccount, nil
}

// GetSubAccountCount returns the number of sub-accounts for a given account
func (s *AccountServiceV1) GetSubAccountCount(parentAccountID string) (int, error) {
	// Ensure account: prefix
	if !strings.HasPrefix(parentAccountID, "account:") {
		parentAccountID = "account:" + parentAccountID
	}

	keyCondition := "parentAccountId = :parentId"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":parentId": {
			S: aws.String(parentAccountID),
		},
	}

	var subAccounts []apitypes.Account
	err := s.db.Query(database.AccountsTable, keyCondition, expressionAttributeValues, &subAccounts)
	if err != nil {
		log.Printf("Failed to query sub-accounts, returning 0: %v", err)
		return 0, nil // Return 0 instead of error to allow account creation
	}

	return len(subAccounts), nil
}

// GetAccountHierarchy returns the full hierarchy tree for an account
func (s *AccountServiceV1) GetAccountHierarchy(rootAccountID string) ([]apitypes.Account, error) {
	// Get root account
	rootAccount, err := s.GetAccountByID(rootAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get root account: %v", err)
	}

	// For now, return just the root account
	// TODO: Implement full hierarchy traversal with GSI on accountPath
	hierarchy := []apitypes.Account{*rootAccount}
	return hierarchy, nil
}

// InviteUserToAccount invites a user to join an account
func (s *AccountServiceV1) InviteUserToAccount(accountID, inviterUserID, inviteeEmail, role string) error {
	// Validate inviter has permission to invite users
	inviterAccess, err := s.ValidateAccountAccess(inviterUserID, accountID)
	if err != nil {
		return fmt.Errorf("inviter does not have access to account: %v", err)
	}

	if !inviterAccess.Permissions.CanInviteUsers {
		return fmt.Errorf("inviter does not have permission to invite users")
	}

	// TODO: Implement user invitation logic
	// 1. Generate invitation token
	// 2. Send email invitation
	// 3. Create pending user-account relationship

	log.Printf("User invitation not yet implemented - would invite %s to account %s with role %s", inviteeEmail, accountID, role)
	return fmt.Errorf("user invitation not yet implemented")
}

// SwitchAccountContext prepares account context for a user
func (s *AccountServiceV1) SwitchAccountContext(userID, targetAccountID string) (*apitypes.AuthContext, error) {
	// Validate user has access to target account
	userAccount, err := s.ValidateAccountAccess(userID, targetAccountID)
	if err != nil {
		return nil, fmt.Errorf("cannot switch to account: %v", err)
	}

	// Get all accounts user has access to
	userAccounts, err := s.GetUserAccounts(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user accounts: %v", err)
	}

	// Build available accounts list
	availableAccounts := make([]apitypes.AccountAccess, len(userAccounts))
	for i, ua := range userAccounts {
		account, err := s.GetAccountByID(ua.AccountID)
		if err != nil {
			log.Printf("Failed to get account %s: %v", ua.AccountID, err)
			continue
		}

		availableAccounts[i] = apitypes.AccountAccess{
			AccountID:   strings.TrimPrefix(ua.AccountID, "account:"),
			AccountName: account.Name,
			Role:        ua.Role,
			Permissions: ua.Permissions,
			IsCurrent:   ua.AccountID == targetAccountID,
		}
	}

	// Create auth context
	authContext := &apitypes.AuthContext{
		UserID:            strings.TrimPrefix(userID, "user:"),
		AccountID:         strings.TrimPrefix(targetAccountID, "account:"),
		Role:              userAccount.Role,
		Permissions:       userAccount.Permissions,
		AvailableAccounts: availableAccounts,
	}

	return authContext, nil
}

// GetUserCurrentAccount retrieves the user's currently selected account
func (s *AccountServiceV1) GetUserCurrentAccount(userID string) (string, error) {
	// Ensure user: prefix
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}

	key := map[string]*dynamodb.AttributeValue{
		"userId": {
			S: aws.String(userID),
		},
	}

	var user apitypes.User
	err := s.db.GetItem(database.UsersTable, key, &user)
	if err != nil {
		return "", fmt.Errorf("failed to get user: %v", err)
	}

	if user.CurrentAccountID == "" {
		return "", fmt.Errorf("user has no current account set")
	}

	return user.CurrentAccountID, nil
}

// SetUserCurrentAccount updates the user's currently selected account
func (s *AccountServiceV1) SetUserCurrentAccount(userID, accountID string) error {
	// Ensure prefixes
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}
	if !strings.HasPrefix(accountID, "account:") {
		accountID = "account:" + accountID
	}

	// Validate user has access to this account
	_, err := s.ValidateAccountAccess(userID, accountID)
	if err != nil {
		return fmt.Errorf("cannot set current account: %v", err)
	}

	// Update user's current account using UpdateItem
	key := map[string]*dynamodb.AttributeValue{
		"userId": {
			S: aws.String(userID),
		},
	}

	updateExpression := "SET currentAccountId = :accountId, updatedAt = :updatedAt"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":accountId": {
			S: aws.String(accountID),
		},
		":updatedAt": {
			S: aws.String(time.Now().Format(time.RFC3339)),
		},
	}

	err = s.db.UpdateItem(database.UsersTable, key, updateExpression, expressionAttributeValues)
	if err != nil {
		return fmt.Errorf("failed to update user current account: %v", err)
	}

	return nil
}

// UpdateAccount updates an existing account
func (s *AccountServiceV1) UpdateAccount(accountID string, updates map[string]interface{}) (*apitypes.Account, error) {
	// Get existing account first
	account, err := s.GetAccountByID(accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing account: %v", err)
	}

	// Apply updates
	if name, ok := updates["name"].(string); ok && name != "" {
		account.Name = name
	}
	if settings, ok := updates["settings"].(apitypes.AccountSettings); ok {
		account.Settings = settings
	}
	account.UpdatedAt = time.Now()

	// Save updated account
	if err := s.db.PutItem(database.AccountsTable, account); err != nil {
		return nil, fmt.Errorf("failed to update account: %v", err)
	}

	return account, nil
}

// Helper method to log activity (v1 compatible)
func (s *AccountServiceV1) LogActivity(accountID, userID, activityType, action, message string) error {
	eventID := fmt.Sprintf("activity:%d:%s", time.Now().UnixNano()/1000000, generateRandomStringV1(9))
	timestamp := time.Now().UnixNano() / 1000000 // Unix timestamp in milliseconds
	ttl := time.Now().Add(90 * 24 * time.Hour).Unix()

	activity := apitypes.Activity{
		EventID:   eventID,
		AccountID: accountID,
		UserID:    userID,
		Type:      activityType,
		Action:    action,
		Status:    "success",
		Message:   message,
		Timestamp: timestamp,
		TTL:       ttl,
	}

	return s.db.PutItem(database.ActivityTable, activity)
}

func generateRandomStringV1(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}