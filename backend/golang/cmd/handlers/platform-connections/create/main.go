package main

import (
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
	"github.com/google/uuid"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type CreateConnectionRequest struct {
	Name        string                 `json:"name"`
	AuthType    string                 `json:"authType"`    // oauth|apikey|basic
	Credentials map[string]interface{} `json:"credentials"` // Auth credentials
}

type PlatformConnection struct {
	ConnectionID string                 `json:"connectionId" dynamodbav:"connectionId"`
	AccountID    string                 `json:"accountId" dynamodbav:"accountId"`
	UserID       string                 `json:"userId" dynamodbav:"userId"`
	PlatformID   string                 `json:"platformId" dynamodbav:"platformId"`
	Name         string                 `json:"name" dynamodbav:"name"`
	Status       string                 `json:"status" dynamodbav:"status"`
	AuthType     string                 `json:"authType" dynamodbav:"authType"`
	Credentials  map[string]interface{} `json:"credentials,omitempty" dynamodbav:"credentials"`
	ExpiresAt    *time.Time             `json:"expiresAt,omitempty" dynamodbav:"expiresAt"`
	CreatedAt    time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type User struct {
	UserID           string `json:"userId" dynamodbav:"userId"`
	Email            string `json:"email" dynamodbav:"email"`
	Name             string `json:"name" dynamodbav:"name"`
	Status           string `json:"status" dynamodbav:"status"`
	CurrentAccountID string `json:"currentAccountId,omitempty" dynamodbav:"currentAccountId"`
	CreatedAt        string `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        string `json:"updatedAt" dynamodbav:"updatedAt"`
}

type Platform struct {
	PlatformID      string               `json:"platformId" dynamodbav:"platformId"`
	Name            string               `json:"name" dynamodbav:"name"`
	DisplayName     string               `json:"displayName" dynamodbav:"displayName"`
	Category        string               `json:"category" dynamodbav:"category"`
	Description     string               `json:"description" dynamodbav:"description"`
	Icon            string               `json:"icon" dynamodbav:"icon"`
	Status          string               `json:"status" dynamodbav:"status"`
	DataTypes       []string             `json:"dataTypes" dynamodbav:"dataTypes"`
	SupportedScopes []string             `json:"supportedScopes" dynamodbav:"supportedScopes"`
	APIConfig       APIConfiguration     `json:"apiConfig" dynamodbav:"apiConfig"`
	OAuth           *OAuthConfiguration  `json:"oauth,omitempty" dynamodbav:"oauth"`
	CreatedAt       string               `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       string               `json:"updatedAt" dynamodbav:"updatedAt"`
}

type APIConfiguration struct {
	AuthType      string            `json:"authType" dynamodbav:"authType"`
	BaseURL       string            `json:"baseUrl" dynamodbav:"baseUrl"`
	RateLimit     int               `json:"rateLimit" dynamodbav:"rateLimit"`
	Headers       map[string]string `json:"headers" dynamodbav:"headers"`
	CustomConfig  map[string]string `json:"customConfig" dynamodbav:"customConfig"`
}

type OAuthConfiguration struct {
	AuthURL      string   `json:"authUrl" dynamodbav:"authUrl"`
	Scopes       []string `json:"scopes" dynamodbav:"scopes"`
	ResponseType string   `json:"responseType" dynamodbav:"responseType"`
}

var (
	platformConnectionsTable = os.Getenv("PLATFORM_CONNECTIONS_TABLE")
	usersTable               = os.Getenv("USERS_TABLE")
	platformsTable           = os.Getenv("PLATFORMS_TABLE")
)

func Handle(event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	platformID := event.PathParameters["platformId"]
	if platformID == "" {
		return createErrorResponse(400, "Platform ID is required"), nil
	}

	// Add platform: prefix if not present
	if len(platformID) < 9 || platformID[:9] != "platform:" {
		platformID = "platform:" + platformID
	}

	log.Printf("Create platform connection request for platform: %s", platformID)

	// Extract user ID from JWT claims
	userID := extractUserID(event)
	if userID == "" {
		return createErrorResponse(401, "User not authenticated"), nil
	}

	// Get table names from environment
	if platformConnectionsTable == "" {
		platformConnectionsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platform-connections"
	}
	if usersTable == "" {
		usersTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-users"
	}
	if platformsTable == "" {
		platformsTable = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}

	// Parse request body
	var createReq CreateConnectionRequest
	if err := json.Unmarshal([]byte(event.Body), &createReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return createErrorResponse(400, "Invalid JSON format in request body"), nil
	}

	// Validate required fields
	if createReq.Name == "" {
		return createErrorResponse(400, "Connection name is required"), nil
	}
	if createReq.AuthType == "" {
		return createErrorResponse(400, "Auth type is required"), nil
	}
	if createReq.Credentials == nil {
		return createErrorResponse(400, "Credentials are required"), nil
	}

	// Get user's current account
	user, err := getUserFromDB(userID)
	if err != nil {
		log.Printf("Failed to get user: %v", err)
		return createErrorResponse(500, "Failed to get user account"), nil
	}

	accountID := user.CurrentAccountID
	if accountID == "" {
		return createErrorResponse(400, "User has no current account"), nil
	}

	// Verify platform exists
	platform, err := getPlatformFromDB(platformID)
	if err != nil {
		log.Printf("Failed to get platform: %v", err)
		return createErrorResponse(400, "Platform not found"), nil
	}

	// Validate auth type matches platform
	if !isValidAuthType(platform, createReq.AuthType) {
		return createErrorResponse(400, fmt.Sprintf("Auth type %s not supported for platform %s", createReq.AuthType, platform.Name)), nil
	}

	// Create platform connection record
	connectionID := fmt.Sprintf("connection:%s", uuid.New().String())
	timestamp := time.Now()

	connection := PlatformConnection{
		ConnectionID: connectionID,
		AccountID:    accountID,
		UserID:       userID,
		PlatformID:   platformID,
		Name:         createReq.Name,
		Status:       "active",
		AuthType:     createReq.AuthType,
		Credentials:  createReq.Credentials, // TODO: Encrypt before storing
		CreatedAt:    timestamp,
		UpdatedAt:    timestamp,
	}

	// Set expiration for OAuth tokens if applicable
	if createReq.AuthType == "oauth" {
		if expiresIn, ok := createReq.Credentials["expires_in"].(float64); ok {
			expiresAt := timestamp.Add(time.Duration(expiresIn) * time.Second)
			connection.ExpiresAt = &expiresAt
		}
	}

	// Save to DynamoDB
	err = saveConnection(&connection)
	if err != nil {
		log.Printf("Failed to save platform connection: %v", err)
		return createErrorResponse(500, "Failed to create platform connection"), nil
	}

	// Remove sensitive credentials from response
	connection.Credentials = nil

	// Strip connection: prefix for API response
	connection.ConnectionID = strings.TrimPrefix(connection.ConnectionID, "connection:")

	log.Printf("Created platform connection %s for platform %s", connection.ConnectionID, platformID)
	return createSuccessResponse(Response{
		Success: true,
		Data:    connection,
		Message: "Platform connection created successfully",
	}), nil
}

func getUserFromDB(userID string) (*User, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"userId": {
				S: aws.String(userID),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("user not found")
	}

	var user User
	err = dynamodbattribute.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func getPlatformFromDB(platformID string) (*Platform, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(platformsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"platformId": {
				S: aws.String(platformID),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("platform not found")
	}

	var platform Platform
	err = dynamodbattribute.UnmarshalMap(result.Item, &platform)
	if err != nil {
		return nil, err
	}

	return &platform, nil
}

func saveConnection(connection *PlatformConnection) error {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	item, err := dynamodbattribute.MarshalMap(connection)
	if err != nil {
		return err
	}

	_, err = svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(platformConnectionsTable),
		Item:      item,
	})

	return err
}

func isValidAuthType(platform *Platform, authType string) bool {
	switch authType {
	case "oauth":
		return platform.OAuth != nil
	case "apikey", "basic":
		return platform.APIConfig.AuthType == authType || platform.APIConfig.AuthType == "multiple"
	default:
		return false
	}
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

func createSuccessResponse(data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
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