package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
)

// AccountService handles hierarchical account operations
type AccountService struct {
	db *database.DynamoDBClient
}

// NewAccountService creates a new account service
func NewAccountService(ctx context.Context) (*AccountService, error) {
	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create DynamoDB client: %v", err)
	}

	return &AccountService{db: db}, nil
}

// GetDefaultPermissions returns default permissions for a role
func GetDefaultPermissions(role string) apitypes.UserPermissions {
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
func (s *AccountService) CreateRootAccount(ctx context.Context, ownerUserID, createdByUserID, name, company string) (*apitypes.Account, error) {
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
	if err := s.db.PutItem(ctx, database.AccountsTable, account); err != nil {
		return nil, fmt.Errorf("failed to create account: %v", err)
	}

	// Create user-account relationship
	userAccount := &apitypes.UserAccount{
		UserID:      ownerUserID,
		AccountID:   accountID,
		Role:        "Owner",
		Status:      "Active",
		Permissions: GetDefaultPermissions("Owner"),
		LinkedAt:    now,
		UpdatedAt:   now,
	}

	if err := s.db.PutItem(ctx, database.UserAccountsTable, userAccount); err != nil {
		return nil, fmt.Errorf("failed to create user-account relationship: %v", err)
	}

	return account, nil
}

// CreateSubAccount creates a new sub-account under a parent
func (s *AccountService) CreateSubAccount(ctx context.Context, parentAccountID, ownerUserID, createdByUserID, name string) (*apitypes.Account, error) {
	// Get parent account to validate and build path
	parent, err := s.GetAccountByID(ctx, parentAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get parent account: %v", err)
	}

	// Validate sub-account creation permissions
	if !parent.Settings.AllowSubAccounts {
		return nil, fmt.Errorf("sub-accounts are not allowed for this account")
	}

	// Check current sub-account count
	subAccountCount, err := s.GetSubAccountCount(ctx, parentAccountID)
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
			MaxSources:       5,  // Sub-accounts get reduced limits
			MaxStorageGB:     2,
			MaxBackupJobs:    3,
			RetentionDays:    30,
			AllowSubAccounts: true,
			MaxSubAccounts:   3,
		},
		Usage: apitypes.AccountUsage{},
	}

	// Create account record
	if err := s.db.PutItem(ctx, database.AccountsTable, account); err != nil {
		return nil, fmt.Errorf("failed to create sub-account: %v", err)
	}

	// Create user-account relationship
	userAccount := &apitypes.UserAccount{
		UserID:      ownerUserID,
		AccountID:   accountID,
		Role:        "Owner",
		Status:      "Active",
		Permissions: GetDefaultPermissions("Owner"),
		LinkedAt:    now,
		UpdatedAt:   now,
	}

	if err := s.db.PutItem(ctx, database.UserAccountsTable, userAccount); err != nil {
		return nil, fmt.Errorf("failed to create user-account relationship: %v", err)
	}

	return account, nil
}

// GetAccountByID retrieves an account by ID
func (s *AccountService) GetAccountByID(ctx context.Context, accountID string) (*apitypes.Account, error) {
	// Ensure account: prefix
	if !strings.HasPrefix(accountID, "account:") {
		accountID = "account:" + accountID
	}

	accountIDAttr, err := attributevalue.Marshal(accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal accountID: %v", err)
	}

	var account apitypes.Account
	err = s.db.GetItem(ctx, database.AccountsTable, map[string]types.AttributeValue{
		"accountId": accountIDAttr,
	}, &account)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %v", err)
	}

	return &account, nil
}

// GetUserAccounts retrieves all accounts a user has access to
func (s *AccountService) GetUserAccounts(ctx context.Context, userID string) ([]apitypes.UserAccount, error) {
	// Ensure user: prefix
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}

	userIDAttr, err := attributevalue.Marshal(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal userID: %v", err)
	}

	var userAccounts []apitypes.UserAccount
	err = s.db.Query(ctx, database.UserAccountsTable, "userId = :userId", map[string]types.AttributeValue{
		":userId": userIDAttr,
	}, &userAccounts)
	if err != nil {
		return nil, fmt.Errorf("failed to query user accounts: %v", err)
	}

	return userAccounts, nil
}

// GetUserAccountRelationship gets the relationship between a user and specific account
func (s *AccountService) GetUserAccountRelationship(ctx context.Context, userID, accountID string) (*apitypes.UserAccount, error) {
	// Ensure prefixes
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}
	if !strings.HasPrefix(accountID, "account:") {
		accountID = "account:" + accountID
	}

	userIDAttr, err := attributevalue.Marshal(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal userID: %v", err)
	}

	accountIDAttr, err := attributevalue.Marshal(accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal accountID: %v", err)
	}

	var userAccount apitypes.UserAccount
	err = s.db.GetItem(ctx, database.UserAccountsTable, map[string]types.AttributeValue{
		"userId":    userIDAttr,
		"accountId": accountIDAttr,
	}, &userAccount)
	if err != nil {
		return nil, fmt.Errorf("failed to get user-account relationship: %v", err)
	}

	return &userAccount, nil
}

// ValidateAccountAccess checks if a user has access to an account and returns their permissions
func (s *AccountService) ValidateAccountAccess(ctx context.Context, userID, accountID string) (*apitypes.UserAccount, error) {
	userAccount, err := s.GetUserAccountRelationship(ctx, userID, accountID)
	if err != nil {
		return nil, fmt.Errorf("user does not have access to account")
	}

	if userAccount.Status != "Active" {
		return nil, fmt.Errorf("user access to account is not active")
	}

	return userAccount, nil
}

// GetSubAccountCount returns the number of sub-accounts for a given account
func (s *AccountService) GetSubAccountCount(ctx context.Context, parentAccountID string) (int, error) {
	// Ensure account: prefix
	if !strings.HasPrefix(parentAccountID, "account:") {
		parentAccountID = "account:" + parentAccountID
	}

	parentIDAttr, err := attributevalue.Marshal(parentAccountID)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal parentAccountID: %v", err)
	}

	var subAccounts []apitypes.Account
	err = s.db.Query(ctx, database.AccountsTable, "parentAccountId = :parentId", map[string]types.AttributeValue{
		":parentId": parentIDAttr,
	}, &subAccounts)
	if err != nil {
		log.Printf("Failed to query sub-accounts, returning 0: %v", err)
		return 0, nil // Return 0 instead of error to allow account creation
	}

	return len(subAccounts), nil
}

// GetAccountHierarchy returns the full hierarchy tree for an account
func (s *AccountService) GetAccountHierarchy(ctx context.Context, rootAccountID string) ([]apitypes.Account, error) {
	// Get root account
	rootAccount, err := s.GetAccountByID(ctx, rootAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get root account: %v", err)
	}

	// For now, return just the root account
	// TODO: Implement full hierarchy traversal with GSI on accountPath
	hierarchy := []apitypes.Account{*rootAccount}
	return hierarchy, nil
}

// InviteUserToAccount invites a user to join an account
func (s *AccountService) InviteUserToAccount(ctx context.Context, accountID, inviterUserID, inviteeEmail, role string) error {
	// Validate inviter has permission to invite users
	inviterAccess, err := s.ValidateAccountAccess(ctx, inviterUserID, accountID)
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
func (s *AccountService) SwitchAccountContext(ctx context.Context, userID, targetAccountID string) (*apitypes.AuthContext, error) {
	// Validate user has access to target account
	userAccount, err := s.ValidateAccountAccess(ctx, userID, targetAccountID)
	if err != nil {
		return nil, fmt.Errorf("cannot switch to account: %v", err)
	}

	// Get all accounts user has access to
	userAccounts, err := s.GetUserAccounts(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user accounts: %v", err)
	}

	// Build available accounts list
	availableAccounts := make([]apitypes.AccountAccess, len(userAccounts))
	for i, ua := range userAccounts {
		account, err := s.GetAccountByID(ctx, ua.AccountID)
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
func (s *AccountService) GetUserCurrentAccount(ctx context.Context, userID string) (string, error) {
	// Ensure user: prefix
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}

	userIDAttr, err := attributevalue.Marshal(userID)
	if err != nil {
		return "", fmt.Errorf("failed to marshal userID: %v", err)
	}

	var user apitypes.User
	err = s.db.GetItem(ctx, database.UsersTable, map[string]types.AttributeValue{
		"userId": userIDAttr,
	}, &user)
	if err != nil {
		return "", fmt.Errorf("failed to get user: %v", err)
	}

	if user.CurrentAccountID == "" {
		return "", fmt.Errorf("user has no current account set")
	}

	return user.CurrentAccountID, nil
}

// SetUserCurrentAccount updates the user's currently selected account
func (s *AccountService) SetUserCurrentAccount(ctx context.Context, userID, accountID string) error {
	// Ensure prefixes
	if !strings.HasPrefix(userID, "user:") {
		userID = "user:" + userID
	}
	if !strings.HasPrefix(accountID, "account:") {
		accountID = "account:" + accountID
	}

	// Validate user has access to this account
	_, err := s.ValidateAccountAccess(ctx, userID, accountID)
	if err != nil {
		return fmt.Errorf("cannot set current account: %v", err)
	}

	// Update user's current account
	userIDAttr, err := attributevalue.Marshal(userID)
	if err != nil {
		return fmt.Errorf("failed to marshal userID: %v", err)
	}

	accountIDAttr, err := attributevalue.Marshal(accountID)
	if err != nil {
		return fmt.Errorf("failed to marshal accountID: %v", err)
	}

	updatedAtAttr, err := attributevalue.Marshal(time.Now())
	if err != nil {
		return fmt.Errorf("failed to marshal updatedAt: %v", err)
	}

	err = s.db.UpdateItem(ctx, database.UsersTable, map[string]types.AttributeValue{
		"userId": userIDAttr,
	}, "SET currentAccountId = :accountId, updatedAt = :updatedAt", map[string]types.AttributeValue{
		":accountId": accountIDAttr,
		":updatedAt": updatedAtAttr,
	})
	if err != nil {
		return fmt.Errorf("failed to update user current account: %v", err)
	}

	return nil
}