package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	cognitotypes "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dynamotypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/listbackup/api/internal/types"
)

// CognitoGroupsService manages AWS Cognito user groups for plan management
type CognitoGroupsService struct {
	cognitoClient *cognitoidentityprovider.Client
	dynamoClient  *dynamodb.Client
	userPoolID    string
	tableName     string
}

// NewCognitoGroupsService creates a new Cognito groups service
func NewCognitoGroupsService(cognitoClient *cognitoidentityprovider.Client, dynamoClient *dynamodb.Client, userPoolID, tableName string) *CognitoGroupsService {
	return &CognitoGroupsService{
		cognitoClient: cognitoClient,
		dynamoClient:  dynamoClient,
		userPoolID:    userPoolID,
		tableName:     tableName,
	}
}

// ============ GROUP MANAGEMENT ============

// CreateGroup creates a new Cognito group for a plan
func (s *CognitoGroupsService) CreateGroup(ctx context.Context, groupName, description, planID string, precedence int32) error {
	// Create the group in Cognito
	_, err := s.cognitoClient.CreateGroup(ctx, &cognitoidentityprovider.CreateGroupInput{
		UserPoolId:  aws.String(s.userPoolID),
		GroupName:   aws.String(groupName),
		Description: aws.String(description),
		Precedence:  aws.Int32(precedence),
	})
	if err != nil {
		return fmt.Errorf("failed to create Cognito group: %w", err)
	}

	// Store group information in DynamoDB
	group := &types.CognitoGroup{
		GroupName:   groupName,
		Description: description,
		PlanID:      planID,
		Precedence:  int(precedence),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	item, err := attributevalue.MarshalMap(group)
	if err != nil {
		return fmt.Errorf("failed to marshal group: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to store group in database: %w", err)
	}

	log.Printf("Created Cognito group: %s for plan: %s", groupName, planID)
	return nil
}

// UpdateGroup updates an existing Cognito group
func (s *CognitoGroupsService) UpdateGroup(ctx context.Context, groupName, description string, precedence int32) error {
	// Update the group in Cognito
	_, err := s.cognitoClient.UpdateGroup(ctx, &cognitoidentityprovider.UpdateGroupInput{
		UserPoolId:  aws.String(s.userPoolID),
		GroupName:   aws.String(groupName),
		Description: aws.String(description),
		Precedence:  aws.Int32(precedence),
	})
	if err != nil {
		return fmt.Errorf("failed to update Cognito group: %w", err)
	}

	// Update group information in DynamoDB
	_, err = s.dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]dynamotypes.AttributeValue{
			"groupName": &dynamotypes.AttributeValueMemberS{Value: groupName},
		},
		UpdateExpression: aws.String("SET description = :desc, precedence = :prec, updatedAt = :updated"),
		ExpressionAttributeValues: map[string]dynamotypes.AttributeValue{
			":desc":    &dynamotypes.AttributeValueMemberS{Value: description},
			":prec":    &dynamotypes.AttributeValueMemberN{Value: fmt.Sprintf("%d", precedence)},
			":updated": &dynamotypes.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to update group in database: %w", err)
	}

	log.Printf("Updated Cognito group: %s", groupName)
	return nil
}

// DeleteGroup deletes a Cognito group
func (s *CognitoGroupsService) DeleteGroup(ctx context.Context, groupName string) error {
	// Delete the group from Cognito
	_, err := s.cognitoClient.DeleteGroup(ctx, &cognitoidentityprovider.DeleteGroupInput{
		UserPoolId: aws.String(s.userPoolID),
		GroupName:  aws.String(groupName),
	})
	if err != nil {
		return fmt.Errorf("failed to delete Cognito group: %w", err)
	}

	// Delete group information from DynamoDB
	_, err = s.dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]dynamotypes.AttributeValue{
			"groupName": &dynamotypes.AttributeValueMemberS{Value: groupName},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete group from database: %w", err)
	}

	log.Printf("Deleted Cognito group: %s", groupName)
	return nil
}

// GetGroup retrieves group information
func (s *CognitoGroupsService) GetGroup(ctx context.Context, groupName string) (*types.CognitoGroup, error) {
	result, err := s.dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]dynamotypes.AttributeValue{
			"groupName": &dynamotypes.AttributeValueMemberS{Value: groupName},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get group: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("group not found")
	}

	var group types.CognitoGroup
	err = attributevalue.UnmarshalMap(result.Item, &group)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal group: %w", err)
	}

	return &group, nil
}

// ListGroups lists all Cognito groups
func (s *CognitoGroupsService) ListGroups(ctx context.Context) ([]types.CognitoGroup, error) {
	result, err := s.dynamoClient.Scan(ctx, &dynamodb.ScanInput{
		TableName: aws.String(s.tableName),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list groups: %w", err)
	}

	var groups []types.CognitoGroup
	for _, item := range result.Items {
		var group types.CognitoGroup
		err = attributevalue.UnmarshalMap(item, &group)
		if err != nil {
			log.Printf("Failed to unmarshal group: %v", err)
			continue
		}
		groups = append(groups, group)
	}

	return groups, nil
}

// ============ USER GROUP MEMBERSHIP ============

// AddUserToGroup adds a user to a Cognito group
func (s *CognitoGroupsService) AddUserToGroup(ctx context.Context, username, groupName string) error {
	// Add user to group in Cognito
	_, err := s.cognitoClient.AdminAddUserToGroup(ctx, &cognitoidentityprovider.AdminAddUserToGroupInput{
		UserPoolId: aws.String(s.userPoolID),
		Username:   aws.String(username),
		GroupName:  aws.String(groupName),
	})
	if err != nil {
		return fmt.Errorf("failed to add user to Cognito group: %w", err)
	}

	// Record membership in DynamoDB
	userGroup := &types.UserGroup{
		UserID:    username,
		GroupName: groupName,
		AddedAt:   time.Now(),
	}

	item, err := attributevalue.MarshalMap(userGroup)
	if err != nil {
		return fmt.Errorf("failed to marshal user group: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to record user group membership: %w", err)
	}

	log.Printf("Added user %s to group %s", username, groupName)
	return nil
}

// RemoveUserFromGroup removes a user from a Cognito group
func (s *CognitoGroupsService) RemoveUserFromGroup(ctx context.Context, username, groupName string) error {
	// Remove user from group in Cognito
	_, err := s.cognitoClient.AdminRemoveUserFromGroup(ctx, &cognitoidentityprovider.AdminRemoveUserFromGroupInput{
		UserPoolId: aws.String(s.userPoolID),
		Username:   aws.String(username),
		GroupName:  aws.String(groupName),
	})
	if err != nil {
		return fmt.Errorf("failed to remove user from Cognito group: %w", err)
	}

	// Remove membership record from DynamoDB
	_, err = s.dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]dynamotypes.AttributeValue{
			"userId":    &dynamotypes.AttributeValueMemberS{Value: username},
			"groupName": &dynamotypes.AttributeValueMemberS{Value: groupName},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to remove user group membership record: %w", err)
	}

	log.Printf("Removed user %s from group %s", username, groupName)
	return nil
}

// GetUserGroups retrieves all groups for a user
func (s *CognitoGroupsService) GetUserGroups(ctx context.Context, username string) ([]string, error) {
	// Get user groups from Cognito
	result, err := s.cognitoClient.AdminListGroupsForUser(ctx, &cognitoidentityprovider.AdminListGroupsForUserInput{
		UserPoolId: aws.String(s.userPoolID),
		Username:   aws.String(username),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get user groups from Cognito: %w", err)
	}

	var groups []string
	for _, group := range result.Groups {
		groups = append(groups, *group.GroupName)
	}

	return groups, nil
}

// GetGroupUsers retrieves all users in a group
func (s *CognitoGroupsService) GetGroupUsers(ctx context.Context, groupName string) ([]string, error) {
	// Get group users from Cognito
	result, err := s.cognitoClient.ListUsersInGroup(ctx, &cognitoidentityprovider.ListUsersInGroupInput{
		UserPoolId: aws.String(s.userPoolID),
		GroupName:  aws.String(groupName),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get group users from Cognito: %w", err)
	}

	var users []string
	for _, user := range result.Users {
		users = append(users, *user.Username)
	}

	return users, nil
}

// ============ SUBSCRIPTION-BASED GROUP ASSIGNMENT ============

// AssignUserToGroupByPlan assigns a user to a group based on their subscription plan
func (s *CognitoGroupsService) AssignUserToGroupByPlan(ctx context.Context, username, planID string) error {
	// First, remove user from all plan-related groups
	err := s.RemoveUserFromAllPlanGroups(ctx, username)
	if err != nil {
		log.Printf("Warning: failed to remove user from existing plan groups: %v", err)
	}

	// Map plan ID to group name
	groupName := s.GetGroupNameForPlan(planID)
	if groupName == "" {
		return fmt.Errorf("no group found for plan: %s", planID)
	}

	// Add user to the appropriate group
	err = s.AddUserToGroup(ctx, username, groupName)
	if err != nil {
		return fmt.Errorf("failed to assign user to group: %w", err)
	}

	log.Printf("Assigned user %s to group %s based on plan %s", username, groupName, planID)
	return nil
}

// RemoveUserFromAllPlanGroups removes a user from all plan-related groups
func (s *CognitoGroupsService) RemoveUserFromAllPlanGroups(ctx context.Context, username string) error {
	// Get all plan-related groups
	planGroups := []string{"free_plan", "starter_plan", "pro_plan", "enterprise_plan"}

	// Get user's current groups
	userGroups, err := s.GetUserGroups(ctx, username)
	if err != nil {
		return fmt.Errorf("failed to get user groups: %w", err)
	}

	// Remove user from any plan groups they're currently in
	for _, userGroup := range userGroups {
		for _, planGroup := range planGroups {
			if userGroup == planGroup {
				err = s.RemoveUserFromGroup(ctx, username, userGroup)
				if err != nil {
					log.Printf("Failed to remove user %s from group %s: %v", username, userGroup, err)
				}
				break
			}
		}
	}

	return nil
}

// GetGroupNameForPlan maps a plan ID to a Cognito group name
func (s *CognitoGroupsService) GetGroupNameForPlan(planID string) string {
	switch planID {
	case "plan_free":
		return "free_plan"
	case "plan_starter":
		return "starter_plan"
	case "plan_pro":
		return "pro_plan"
	case "plan_enterprise":
		return "enterprise_plan"
	default:
		return ""
	}
}

// GetPlanForGroup maps a Cognito group name to a plan ID
func (s *CognitoGroupsService) GetPlanForGroup(groupName string) string {
	switch groupName {
	case "free_plan":
		return "plan_free"
	case "starter_plan":
		return "plan_starter"
	case "pro_plan":
		return "plan_pro"
	case "enterprise_plan":
		return "plan_enterprise"
	default:
		return ""
	}
}

// ============ SETUP FUNCTIONS ============

// SetupDefaultGroups creates the default plan groups
func (s *CognitoGroupsService) SetupDefaultGroups(ctx context.Context) error {
	defaultGroups := []struct {
		name        string
		description string
		planID      string
		precedence  int32
	}{
		{"free_plan", "Free Plan Users", "plan_free", 40},
		{"starter_plan", "Starter Plan Users", "plan_starter", 30},
		{"pro_plan", "Pro Plan Users", "plan_pro", 20},
		{"enterprise_plan", "Enterprise Plan Users", "plan_enterprise", 10},
	}

	for _, group := range defaultGroups {
		err := s.CreateGroup(ctx, group.name, group.description, group.planID, group.precedence)
		if err != nil {
			// If group already exists, continue
			if _, ok := err.(*cognitotypes.GroupExistsException); ok {
				log.Printf("Group %s already exists, skipping", group.name)
				continue
			}
			return fmt.Errorf("failed to create group %s: %w", group.name, err)
		}
	}

	log.Printf("Successfully set up default Cognito groups")
	return nil
}

// ============ UTILITY FUNCTIONS ============

// CheckUserPlanAccess checks if a user has access to a specific plan feature
func (s *CognitoGroupsService) CheckUserPlanAccess(ctx context.Context, username, feature string) (bool, error) {
	userGroups, err := s.GetUserGroups(ctx, username)
	if err != nil {
		return false, fmt.Errorf("failed to get user groups: %w", err)
	}

	// Check each group the user belongs to
	for _, groupName := range userGroups {
		planID := s.GetPlanForGroup(groupName)
		if planID == "" {
			continue
		}

		// This would integrate with the billing service to check plan features
		// For now, implement basic logic
		hasAccess := s.checkFeatureForPlan(planID, feature)
		if hasAccess {
			return true, nil
		}
	}

	return false, nil
}

// checkFeatureForPlan checks if a plan includes a specific feature
func (s *CognitoGroupsService) checkFeatureForPlan(planID, feature string) bool {
	// This would normally query the billing service or database
	// Implementing basic logic for demonstration
	switch planID {
	case "plan_free":
		return feature == "basicBackups"
	case "plan_starter":
		return feature == "basicBackups" || feature == "teamManagement"
	case "plan_pro":
		return feature != "auditTrails" && feature != "complianceReports" // Most features except enterprise ones
	case "plan_enterprise":
		return true // All features
	default:
		return false
	}
}

// SyncUserGroupWithSubscription synchronizes user's Cognito group with their subscription
func (s *CognitoGroupsService) SyncUserGroupWithSubscription(ctx context.Context, username, subscriptionID string, billingService *BillingService) error {
	// Get the subscription
	subscription, err := billingService.GetSubscription(ctx, subscriptionID)
	if err != nil {
		return fmt.Errorf("failed to get subscription: %w", err)
	}

	// Assign user to appropriate group based on plan
	err = s.AssignUserToGroupByPlan(ctx, username, subscription.PlanID)
	if err != nil {
		return fmt.Errorf("failed to assign user to group: %w", err)
	}

	log.Printf("Synchronized user %s with subscription %s (plan: %s)", username, subscriptionID, subscription.PlanID)
	return nil
}