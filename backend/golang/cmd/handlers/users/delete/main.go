package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/google/uuid"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type UserAccount struct {
	UserID      string      `dynamodbav:"userId"`
	AccountID   string      `dynamodbav:"accountId"`
	Role        string      `dynamodbav:"role"`
	Permissions Permissions `dynamodbav:"permissions"`
	JoinedAt    time.Time   `dynamodbav:"joinedAt"`
	IsActive    bool        `dynamodbav:"isActive"`
}

type Permissions struct {
	ManageUsers       bool `dynamodbav:"manageUsers" json:"manageUsers"`
	ManageSettings    bool `dynamodbav:"manageSettings" json:"manageSettings"`
	ManageBilling     bool `dynamodbav:"manageBilling" json:"manageBilling"`
	ViewReports       bool `dynamodbav:"viewReports" json:"viewReports"`
	ManageIntegrations bool `dynamodbav:"manageIntegrations" json:"manageIntegrations"`
}

type Activity struct {
	EventID   string `dynamodbav:"eventId"`
	AccountID string `dynamodbav:"accountId"`
	UserID    string `dynamodbav:"userId"`
	Type      string `dynamodbav:"type"`
	Action    string `dynamodbav:"action"`
	Status    string `dynamodbav:"status"`
	Message   string `dynamodbav:"message"`
	Timestamp int64  `dynamodbav:"timestamp"`
	TTL       int64  `dynamodbav:"ttl"`
	Metadata  map[string]string `dynamodbav:"metadata,omitempty"`
}

var (
	usersTable            = os.Getenv("USERS_TABLE")
	userAccountsTable     = os.Getenv("USER_ACCOUNTS_TABLE")
	activitiesTable       = os.Getenv("ACTIVITIES_TABLE")
	cognitoUserPoolID     = os.Getenv("COGNITO_USER_POOL_ID")
	cognitoRegion         = os.Getenv("COGNITO_REGION")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Delete user called with method: %s", event.RequestContext.HTTP.Method)

	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract requesting user ID from authorizer context
	requestingUserID := extractUserID(event)
	if requestingUserID == "" {
		return createErrorResponse(401, "Unauthorized"), nil
	}

	// Check admin permissions
	hasPermission, accountID, err := checkAdminPermission(requestingUserID)
	if err != nil {
		log.Printf("Error checking permissions: %v", err)
		return createErrorResponse(500, "Failed to check permissions"), nil
	}
	if !hasPermission {
		return createErrorResponse(403, "Forbidden: Admin access required"), nil
	}

	// Get user ID from path parameters
	targetUserID := event.PathParameters["userId"]
	if targetUserID == "" {
		return createErrorResponse(400, "User ID is required"), nil
	}

	// Ensure proper format
	if !strings.HasPrefix(targetUserID, "user:") {
		targetUserID = fmt.Sprintf("user:%s", targetUserID)
	}

	// Prevent users from deleting themselves
	if targetUserID == requestingUserID {
		return createErrorResponse(400, "Cannot delete your own account"), nil
	}

	// Create AWS session
	sess := session.Must(session.NewSession())
	dynamoClient := dynamodb.New(sess)

	// 1. Update user status to "deleted" in DynamoDB (soft delete)
	log.Printf("Updating user status to deleted for user: %s", targetUserID)
	updateExpr := expression.UpdateBuilder{}.
		Set(expression.Name("status"), expression.Value("deleted")).
		Set(expression.Name("updatedAt"), expression.Value(time.Now().Format(time.RFC3339)))
	
	updateExpression, err := expression.NewBuilder().WithUpdate(updateExpr).Build()
	if err != nil {
		log.Printf("Failed to build update expression: %v", err)
		return createErrorResponse(500, "Failed to delete user"), nil
	}

	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {
				S: aws.String(targetUserID),
			},
		},
		UpdateExpression:          updateExpression.Update(),
		ExpressionAttributeNames:  updateExpression.Names(),
		ExpressionAttributeValues: updateExpression.Values(),
	})
	if err != nil {
		log.Printf("Failed to update user status: %v", err)
		return createErrorResponse(500, "Failed to delete user"), nil
	}

	// 2. Remove user from all accounts (UserAccounts table)
	log.Printf("Removing user from all accounts")
	err = removeUserFromAllAccounts(dynamoClient, targetUserID)
	if err != nil {
		log.Printf("Failed to remove user from accounts: %v", err)
		// Continue with the deletion process even if this fails
	}

	// 3. Disable the user in Cognito
	log.Printf("Disabling user in Cognito")
	err = disableUserInCognito(targetUserID)
	if err != nil {
		log.Printf("Failed to disable user in Cognito: %v", err)
		// Continue with the deletion process even if this fails
	}

	// 4. Log the deletion activity
	log.Printf("Logging deletion activity")
	err = logActivity(dynamoClient, accountID, requestingUserID, targetUserID)
	if err != nil {
		log.Printf("Failed to log activity: %v", err)
		// Don't fail the request if activity logging fails
	}

	response := Response{
		Success: true,
		Message: "User deleted successfully",
		Data: map[string]interface{}{
			"userId":    strings.TrimPrefix(targetUserID, "user:"),
			"deletedAt": time.Now().Format(time.RFC3339),
		},
	}

	return createSuccessResponse(response), nil
}

func extractUserID(event events.APIGatewayV2HTTPRequest) string {
	if event.RequestContext.Authorizer != nil {
		if jwt := event.RequestContext.Authorizer.JWT; jwt != nil {
			if sub, ok := jwt.Claims["sub"]; ok {
				return fmt.Sprintf("user:%s", sub)
			}
		}
		if lambda := event.RequestContext.Authorizer.Lambda; lambda != nil {
			if userID, ok := lambda["userId"].(string); ok {
				return userID
			}
		}
	}
	return ""
}

func checkAdminPermission(userID string) (bool, string, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Query user's accounts to check for admin role
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("userId").Equal(expression.Value(userID))).
		Build()
	if err != nil {
		return false, "", err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return false, "", err
	}

	// Check each account for admin permissions
	for _, item := range result.Items {
		var userAccount UserAccount
		if err := dynamodbattribute.UnmarshalMap(item, &userAccount); err != nil {
			continue
		}
		if userAccount.Role == "admin" || userAccount.Role == "owner" || userAccount.Permissions.ManageUsers {
			return true, userAccount.AccountID, nil
		}
	}

	return false, "", nil
}

func removeUserFromAllAccounts(svc *dynamodb.DynamoDB, userID string) error {
	// Query all user accounts
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("userId").Equal(expression.Value(userID))).
		Build()
	if err != nil {
		return err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return err
	}

	// Delete each user account entry
	for _, item := range result.Items {
		accountID := item["accountId"]
		if accountID != nil && accountID.S != nil {
			_, err := svc.DeleteItem(&dynamodb.DeleteItemInput{
				TableName: aws.String(userAccountsTable),
				Key: map[string]*dynamodb.AttributeValue{
					"userId": {
						S: aws.String(userID),
					},
					"accountId": accountID,
				},
			})
			if err != nil {
				log.Printf("Failed to remove user from account %s: %v", *accountID.S, err)
				// Continue removing from other accounts
			}
		}
	}

	return nil
}

func disableUserInCognito(userID string) error {
	// Extract Cognito user ID from the user ID (remove "user:" prefix)
	cognitoUserID := strings.TrimPrefix(userID, "user:")

	// Create Cognito client
	region := cognitoRegion
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return err
	}

	cognitoClient := cognitoidentityprovider.New(sess)

	// Disable the user
	_, err = cognitoClient.AdminDisableUser(&cognitoidentityprovider.AdminDisableUserInput{
		UserPoolId: aws.String(cognitoUserPoolID),
		Username:   aws.String(cognitoUserID),
	})

	if err != nil {
		// Check if it's a user not found error
		if strings.Contains(err.Error(), "UserNotFoundException") {
			log.Printf("User not found in Cognito: %s", cognitoUserID)
			return nil // Don't fail if user doesn't exist in Cognito
		}
		return err
	}

	return nil
}

func logActivity(svc *dynamodb.DynamoDB, accountID, requestingUserID, targetUserID string) error {
	if activitiesTable == "" {
		log.Printf("Activities table not configured, skipping activity logging")
		return nil
	}

	activity := Activity{
		EventID:   fmt.Sprintf("activity:%s", uuid.New().String()),
		AccountID: accountID,
		UserID:    requestingUserID,
		Type:      "user",
		Action:    "delete",
		Status:    "success",
		Message:   fmt.Sprintf("User %s deleted by %s", targetUserID, requestingUserID),
		Timestamp: time.Now().Unix(),
		TTL:       time.Now().Add(90 * 24 * time.Hour).Unix(), // 90 days retention
		Metadata: map[string]string{
			"targetUserId": targetUserID,
			"deletedBy":    requestingUserID,
		},
	}

	av, err := dynamodbattribute.MarshalMap(activity)
	if err != nil {
		return err
	}

	_, err = svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(activitiesTable),
		Item:      av,
	})

	return err
}

func createSuccessResponse(data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := Response{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func main() {
	lambda.Start(Handle)
}