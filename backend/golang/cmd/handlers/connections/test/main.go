package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type TestConnectionHandler struct {
	db *database.DynamoDBClientV1
}

func NewTestConnectionHandler() (*TestConnectionHandler, error) {
	db, err := database.NewDynamoDBClientV1()
	if err != nil {
		return nil, err
	}

	return &TestConnectionHandler{
		db: db,
	}, nil
}

func (h *TestConnectionHandler) Handle(event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	connectionId := event.PathParameters["connectionId"]
	if connectionId == "" {
		return response.BadRequest("Connection ID is required"), nil
	}

	// Add connection: prefix if not present
	if len(connectionId) < 11 || connectionId[:11] != "connection:" {
		connectionId = "connection:" + connectionId
	}

	// Extract user ID and account ID from auth context (Lambda authorizer)
	var userId, accountId string
	if event.RequestContext.Authorizer != nil {
		if lambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
			if uid, exists := lambda["userId"].(string); exists {
				userId = uid
			}
			if aid, exists := lambda["accountId"].(string); exists {
				accountId = aid
			}
		} else {
			if uid, exists := event.RequestContext.Authorizer["userId"].(string); exists {
				userId = uid
			}
			if aid, exists := event.RequestContext.Authorizer["accountId"].(string); exists {
				accountId = aid
			}
		}
	}

	if userId == "" || accountId == "" {
		return response.Unauthorized("User not authenticated"), nil
	}

	log.Printf("Test connection request: %s for user %s, account %s", connectionId, userId, accountId)

	// Get existing connection
	key := map[string]*dynamodb.AttributeValue{
		"connectionId": database.StringValue(connectionId),
	}

	var connection apitypes.PlatformConnection
	err := h.db.GetItem(database.PlatformConnectionsTable, key, &connection)
	if err != nil {
		log.Printf("Failed to get connection %s: %v", connectionId, err)
		if err.Error() == "item not found" {
			return response.NotFound("Connection not found"), nil
		}
		return response.InternalServerError("Failed to get connection"), nil
	}

	// Verify the connection belongs to the authenticated user and account
	if connection.UserID != userId {
		return response.Forbidden("Access denied: connection belongs to different user"), nil
	}
	if connection.AccountID != accountId {
		return response.Forbidden("Access denied: connection belongs to different account"), nil
	}

	// Get platform details for testing
	platformKey := map[string]*dynamodb.AttributeValue{
		"platformId": database.StringValue(connection.PlatformID),
	}
	var platform apitypes.Platform
	err = h.db.GetItem(database.PlatformsTable, platformKey, &platform)
	if err != nil {
		log.Printf("Failed to get platform %s: %v", connection.PlatformID, err)
		return response.InternalServerError("Failed to get platform details"), nil
	}

	// Perform actual connection test
	testResult := h.testConnection(connection, platform)

	// Update last tested timestamp
	now := time.Now()
	connection.LastConnected = &now
	if testResult["success"].(bool) {
		connection.Status = "active"
	} else {
		connection.Status = "error"
	}
	connection.UpdatedAt = now

	// Save updated connection
	err = h.db.PutItem(database.PlatformConnectionsTable, connection)
	if err != nil {
		log.Printf("Failed to update connection after test: %v", err)
		return response.InternalServerError("Failed to update connection"), nil
	}

	// Remove credentials from response
	connection.Credentials = nil

	log.Printf("Tested connection %s: %v", connectionId, testResult["success"])
	return response.Success(map[string]interface{}{
		"connection": connection,
		"testResult": testResult,
		"message":    "Connection test completed",
	}), nil
}

func (h *TestConnectionHandler) testConnection(connection apitypes.PlatformConnection, platform apitypes.Platform) map[string]interface{} {
	start := time.Now()
	testedAt := start

	// Validate credentials exist
	if len(connection.Credentials) == 0 {
		return map[string]interface{}{
			"success":  false,
			"message":  "Connection test failed: No credentials found",
			"testedAt": testedAt,
			"testType": connection.AuthType,
			"error":    "MISSING_CREDENTIALS",
		}
	}

	// Build test endpoint URL
	testEndpoint := platform.APIConfig.BaseURL
	if platform.APIConfig.TestEndpoint != "" {
		testEndpoint = platform.APIConfig.BaseURL + platform.APIConfig.TestEndpoint
	}

	// Create HTTP request
	req, err := http.NewRequest("GET", testEndpoint, nil)
	if err != nil {
		return map[string]interface{}{
			"success":  false,
			"message":  fmt.Sprintf("Failed to create test request: %v", err),
			"testedAt": testedAt,
			"testType": connection.AuthType,
			"error":    "REQUEST_CREATION_FAILED",
		}
	}

	// Add authentication headers based on auth type
	h.addAuthHeaders(req, connection, platform)

	// Make the request with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return map[string]interface{}{
			"success":     false,
			"message":     fmt.Sprintf("Connection test failed: %v", err),
			"testedAt":    testedAt,
			"testType":    connection.AuthType,
			"endpoint":    testEndpoint,
			"error":       "CONNECTION_FAILED",
			"responseTime": time.Since(start).String(),
		}
	}
	defer resp.Body.Close()

	// Read response body
	body, _ := io.ReadAll(resp.Body)
	responseTime := time.Since(start)

	// Consider 2xx status codes as success
	success := resp.StatusCode >= 200 && resp.StatusCode < 300

	if success {
		return map[string]interface{}{
			"success":     true,
			"message":     "Connection test successful",
			"testedAt":    testedAt,
			"testType":    connection.AuthType,
			"endpoint":    testEndpoint,
			"statusCode":  resp.StatusCode,
			"responseTime": responseTime.String(),
			"responseSize": len(body),
		}
	} else {
		return map[string]interface{}{
			"success":     false,
			"message":     fmt.Sprintf("Connection test failed with status %d", resp.StatusCode),
			"testedAt":    testedAt,
			"testType":    connection.AuthType,
			"endpoint":    testEndpoint,
			"statusCode":  resp.StatusCode,
			"error":       "HTTP_ERROR",
			"responseTime": responseTime.String(),
			"responseBody": string(body)[:min(500, len(body))], // Limit response body size
		}
	}
}

func (h *TestConnectionHandler) addAuthHeaders(req *http.Request, connection apitypes.PlatformConnection, platform apitypes.Platform) {
	switch connection.AuthType {
	case "oauth":
		if accessToken, ok := connection.Credentials["access_token"].(string); ok {
			req.Header.Set("Authorization", "Bearer "+accessToken)
		}
	case "apikey":
		if apiKey, ok := connection.Credentials["api_key"].(string); ok {
			// Different platforms use different header names for API keys
			switch platform.Type {
			case "stripe":
				req.Header.Set("Authorization", "Bearer "+apiKey)
			case "keap":
				req.Header.Set("X-Keap-API-Key", apiKey)
			default:
				req.Header.Set("Authorization", "Bearer "+apiKey)
			}
		}
	case "bearer":
		if token, ok := connection.Credentials["token"].(string); ok {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	case "basic":
		if username, ok := connection.Credentials["username"].(string); ok {
			if password, ok := connection.Credentials["password"].(string); ok {
				req.SetBasicAuth(username, password)
			}
		}
	}

	// Add any required headers from platform config
	for header, value := range platform.APIConfig.RequiredHeaders {
		req.Header.Set(header, value)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func main() {
	handler, err := NewTestConnectionHandler()
	if err != nil {
		log.Fatalf("Failed to create test connection handler: %v", err)
	}

	lambda.Start(handler.Handle)
}