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
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type UpdateProfileHandler struct {
	db *dynamodb.DynamoDB
}

type UpdateProfileRequest struct {
	Name        *string          `json:"name,omitempty"`
	Preferences *UserPreferences `json:"preferences,omitempty"`
}

type User struct {
	UserID           string          `json:"userId" dynamodbav:"userId"`
	CognitoUserID    string          `json:"cognitoUserId" dynamodbav:"cognitoUserId"`
	Email            string          `json:"email" dynamodbav:"email"`
	Name             string          `json:"name" dynamodbav:"name"`
	Status           string          `json:"status" dynamodbav:"status"`
	CurrentAccountID string          `json:"currentAccountId" dynamodbav:"currentAccountId"`
	Preferences      UserPreferences `json:"preferences" dynamodbav:"preferences"`
	CreatedAt        time.Time       `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt" dynamodbav:"updatedAt"`
}

type UserPreferences struct {
	Timezone      string                `json:"timezone" dynamodbav:"timezone"`
	Theme         string                `json:"theme" dynamodbav:"theme"`
	Notifications NotificationSettings `json:"notifications" dynamodbav:"notifications"`
}

type NotificationSettings struct {
	Email          bool `json:"email" dynamodbav:"email"`
	Slack          bool `json:"slack" dynamodbav:"slack"`
	BackupComplete bool `json:"backupComplete" dynamodbav:"backupComplete"`
	BackupFailed   bool `json:"backupFailed" dynamodbav:"backupFailed"`
	WeeklyReport   bool `json:"weeklyReport" dynamodbav:"weeklyReport"`
}

func NewUpdateProfileHandler() (*UpdateProfileHandler, error) {
	// Get region from environment or default to us-west-2
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	// Create DynamoDB client
	db := dynamodb.New(sess)
	
	return &UpdateProfileHandler{db: db}, nil
}

func (h *UpdateProfileHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Update profile request")

	// Handle OPTIONS for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract user ID from JWT claims via Cognito authorizer
	userID := ""
	if event.RequestContext.Authorizer != nil {
		// Try different auth context patterns
		if jwt, ok := event.RequestContext.Authorizer["jwt"].(map[string]interface{}); ok {
			if claims, ok := jwt["claims"].(map[string]interface{}); ok {
				if sub, exists := claims["sub"].(string); exists {
					userID = "user:" + sub
				}
			}
		} else if claims, ok := event.RequestContext.Authorizer["claims"].(map[string]interface{}); ok {
			// Direct claims access (some authorizer configurations)
			if sub, exists := claims["sub"].(string); exists {
				userID = "user:" + sub
			}
		}
	}

	if userID == "" {
		log.Printf("No user ID found in JWT authorizer context - event: %+v", event.RequestContext.Authorizer)
		response := map[string]interface{}{
			"success": false,
			"error":   "User not authenticated",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	var updateReq UpdateProfileRequest
	if err := json.Unmarshal([]byte(event.Body), &updateReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Invalid JSON format in request body",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	// Get current user from database
	user, err := h.getUserFromDynamoDB(userID)
	if err != nil {
		log.Printf("Failed to get user from database: %v", err)
		if strings.Contains(err.Error(), "item not found") {
			response := map[string]interface{}{
				"success": false,
				"error":   "User not found",
			}
			return events.APIGatewayProxyResponse{
				StatusCode: 404,
				Headers: map[string]string{
					"Access-Control-Allow-Origin": "*",
					"Content-Type":                "application/json",
				},
				Body: mustMarshal(response),
			}, nil
		}
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to get user profile",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	// Update the user object with new values
	if updateReq.Name != nil && *updateReq.Name != "" {
		user.Name = *updateReq.Name
	}

	if updateReq.Preferences != nil {
		// Merge preferences - only update provided fields, preserve existing ones
		if updateReq.Preferences.Timezone != "" {
			user.Preferences.Timezone = updateReq.Preferences.Timezone
		}
		if updateReq.Preferences.Theme != "" {
			user.Preferences.Theme = updateReq.Preferences.Theme
		}
		// For notifications, only update if explicitly provided in request
		// Check if the notifications struct was provided in the request
		if updateReq.Preferences.Notifications != (NotificationSettings{}) {
			// Selectively update only the notification settings that were provided
			user.Preferences.Notifications.Email = updateReq.Preferences.Notifications.Email
			user.Preferences.Notifications.Slack = updateReq.Preferences.Notifications.Slack
			user.Preferences.Notifications.BackupComplete = updateReq.Preferences.Notifications.BackupComplete
			user.Preferences.Notifications.BackupFailed = updateReq.Preferences.Notifications.BackupFailed
			user.Preferences.Notifications.WeeklyReport = updateReq.Preferences.Notifications.WeeklyReport
		}
	}

	// Update timestamp
	user.UpdatedAt = time.Now()

	// Put the updated user back to the database
	usersTable := os.Getenv("USERS_TABLE")
	av, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		log.Printf("Failed to marshal user: %v", err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to update profile",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(usersTable),
		Item:      av,
	}

	_, err = h.db.PutItem(input)
	if err != nil {
		log.Printf("Failed to update user: %v", err)
		response := map[string]interface{}{
			"success": false,
			"error":   "Failed to update profile",
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin": "*",
				"Content-Type":                "application/json",
			},
			Body: mustMarshal(response),
		}, nil
	}

	// Return updated profile
	profile := map[string]interface{}{
		"userId":      strings.TrimPrefix(user.UserID, "user:"),
		"email":       user.Email,
		"name":        user.Name,
		"preferences": user.Preferences,
		"updatedAt":   user.UpdatedAt,
	}

	response := map[string]interface{}{
		"success": true,
		"data":    profile,
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Access-Control-Allow-Origin": "*",
			"Content-Type":                "application/json",
		},
		Body: mustMarshal(response),
	}, nil
}

func (h *UpdateProfileHandler) getUserFromDynamoDB(userID string) (*User, error) {
	usersTable := os.Getenv("USERS_TABLE")
	key := map[string]*dynamodb.AttributeValue{
		"userId": {
			S: aws.String(userID),
		},
	}

	input := &dynamodb.GetItemInput{
		TableName: aws.String(usersTable),
		Key:       key,
	}

	resp, err := h.db.GetItem(input)
	if err != nil {
		return nil, err
	}

	if resp.Item == nil {
		return nil, fmt.Errorf("item not found")
	}

	var user User
	err = dynamodbattribute.UnmarshalMap(resp.Item, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func mustMarshal(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		return `{"success": false, "error": "Failed to marshal response"}`
	}
	return string(b)
}


func main() {
	handler, err := NewUpdateProfileHandler()
	if err != nil {
		log.Fatalf("Failed to create update profile handler: %v", err)
	}

	lambda.Start(handler.Handle)
}