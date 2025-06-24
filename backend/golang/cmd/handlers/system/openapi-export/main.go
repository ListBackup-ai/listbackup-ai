package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/apigatewayv2"
	"github.com/listbackup/api/pkg/response"
)

type OpenAPIExportHandler struct {
	apiGatewayClient *apigatewayv2.ApiGatewayV2
	apiId            string
}

func NewOpenAPIExportHandler(ctx context.Context) (*OpenAPIExportHandler, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	if err != nil {
		return nil, err
	}

	return &OpenAPIExportHandler{
		apiGatewayClient: apigatewayv2.New(sess),
		apiId:            os.Getenv("API_GATEWAY_ID"),
	}, nil
}

func (h *OpenAPIExportHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Get format from query parameter (yaml or json)
	format := event.QueryStringParameters["format"]
	if format == "" {
		format = "yaml" // default to YAML
	}

	var outputType string
	var contentType string
	
	switch format {
	case "json":
		outputType = "JSON"
		contentType = "application/json"
	case "yaml":
		outputType = "YAML"
		contentType = "application/x-yaml"
	default:
		return response.BadRequest("Invalid format. Use 'yaml' or 'json'"), nil
	}

	// Export the API specification
	input := &apigatewayv2.ExportApiInput{
		ApiId:         aws.String(h.apiId),
		OutputType:    aws.String(outputType),
		Specification: aws.String("OAS30"),
		ExportVersion: aws.String("1.0"),
	}

	result, err := h.apiGatewayClient.ExportApi(input)
	if err != nil {
		log.Printf("Failed to export API: %v", err)
		return response.InternalServerError("Failed to export API specification"), nil
	}

	// Handle CORS for web requests
	headers := map[string]string{
		"Content-Type":                 contentType,
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	}

	// Handle OPTIONS request for CORS preflight
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers:    headers,
			Body:       "",
		}, nil
	}

	// Parse and enhance the spec
	var spec map[string]interface{}
	if err := json.Unmarshal(result.Body, &spec); err != nil {
		log.Printf("Failed to parse spec: %v", err)
		return response.InternalServerError("Failed to parse API specification"), nil
	}

	// Enhance the spec
	log.Printf("Enhancing OpenAPI spec with %d paths", len(spec["paths"].(map[string]interface{})))
	enhanceOpenAPISpec(spec)
	log.Printf("Enhancement complete")

	if format == "json" {
		prettyJSON, err := json.MarshalIndent(spec, "", "  ")
		if err != nil {
			log.Printf("Failed to marshal JSON: %v", err)
			return response.InternalServerError("Failed to format API specification"), nil
		}

		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers:    headers,
			Body:       string(prettyJSON),
		}, nil
	}

	// For YAML format, return enhanced JSON content with YAML headers
	enhancedJSON, err := json.MarshalIndent(spec, "", "  ")
	if err != nil {
		log.Printf("Failed to marshal enhanced spec for YAML: %v", err)
		return response.InternalServerError("Failed to format API specification"), nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers:    headers,
		Body:       string(enhancedJSON),
	}, nil
}

// enhanceOpenAPISpec cleans up and enhances the exported OpenAPI specification
func enhanceOpenAPISpec(spec map[string]interface{}) {
	// Enhance info section
	if info, ok := spec["info"].(map[string]interface{}); ok {
		info["title"] = "ListBackup.ai API"
		info["description"] = "Complete API documentation for ListBackup.ai backup and synchronization services. This API enables you to manage data backups, platform connections, and synchronization across various third-party services."
		info["contact"] = map[string]interface{}{
			"name":  "ListBackup.ai Support",
			"url":   "https://listbackup.ai/support",
			"email": "support@listbackup.ai",
		}
		info["license"] = map[string]interface{}{
			"name": "MIT",
			"url":  "https://opensource.org/licenses/MIT",
		}
	}

	// Clean up security schemes
	if components, ok := spec["components"].(map[string]interface{}); ok {
		if securitySchemes, ok := components["securitySchemes"].(map[string]interface{}); ok {
			// Replace complex Cognito details with simple Bearer auth
			securitySchemes["BearerAuth"] = map[string]interface{}{
				"type":         "http",
				"scheme":       "bearer",
				"bearerFormat": "JWT",
				"description":  "JWT access token obtained from authentication endpoints",
			}
			// Remove the complex Cognito authorizer
			delete(securitySchemes, "cognitoAuthorizer")
		}
	}

	// Add proper tags
	spec["tags"] = []map[string]interface{}{
		{"name": "Authentication", "description": "User authentication and authorization"},
		{"name": "User Management", "description": "User profile and account management"},
		{"name": "Platforms", "description": "Available backup platforms and integrations"},
		{"name": "Connections", "description": "Platform connections and authentication"},
		{"name": "Sources", "description": "Data sources and backup management"},
		{"name": "Jobs", "description": "Background job management"},
		{"name": "System", "description": "System health and API information"},
	}

	// Add comprehensive schemas
	addSchemas(spec)

	// Enhance paths
	if paths, ok := spec["paths"].(map[string]interface{}); ok {
		enhancePaths(paths)
	}

	// Remove AWS-specific extensions
	removeAWSExtensions(spec)
}

// addSchemas adds comprehensive data schemas to the OpenAPI specification  
func addSchemas(spec map[string]interface{}) {
	log.Printf("Adding schemas to OpenAPI spec")
	
	// Ensure components exists
	if _, exists := spec["components"]; !exists {
		spec["components"] = map[string]interface{}{}
	}
	
	components := spec["components"].(map[string]interface{})
	log.Printf("Found components section")
	
	// Ensure schemas exists
	components["schemas"] = map[string]interface{}{}
	schemas := components["schemas"].(map[string]interface{})
	log.Printf("Adding schemas to components")

	// User schema
	schemas["User"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"userId": map[string]interface{}{
					"type": "string",
					"example": "user:123e4567-e89b-12d3-a456-426614174000",
					"description": "Unique user identifier",
				},
				"email": map[string]interface{}{
					"type": "string",
					"format": "email",
					"example": "user@example.com",
				},
				"name": map[string]interface{}{
					"type": "string",
					"example": "John Doe",
				},
				"status": map[string]interface{}{
					"type": "string",
					"enum": []string{"active", "inactive", "pending"},
					"example": "active",
				},
				"currentAccount": map[string]interface{}{
					"$ref": "#/components/schemas/Account",
				},
				"createdAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T10:30:00Z",
				},
			},
			"required": []string{"userId", "email", "name", "status"},
		}

		// Account schema
		schemas["Account"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"accountId": map[string]interface{}{
					"type": "string",
					"example": "account:123e4567-e89b-12d3-a456-426614174000",
				},
				"accountName": map[string]interface{}{
					"type": "string",
					"example": "My Company",
				},
				"company": map[string]interface{}{
					"type": "string",
					"example": "Acme Corp",
				},
				"role": map[string]interface{}{
					"type": "string",
					"example": "Owner",
				},
			},
		}

		// Platform schema
		schemas["Platform"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"platformId": map[string]interface{}{
					"type": "string",
					"example": "keap",
				},
				"name": map[string]interface{}{
					"type": "string",
					"example": "Keap",
				},
				"description": map[string]interface{}{
					"type": "string",
					"example": "CRM and marketing automation platform",
				},
				"category": map[string]interface{}{
					"type": "string",
					"example": "CRM",
				},
				"logoUrl": map[string]interface{}{
					"type": "string",
					"format": "uri",
					"example": "https://logos.listbackup.ai/keap.png",
				},
				"isActive": map[string]interface{}{
					"type": "boolean",
					"example": true,
				},
				"requiresOAuth": map[string]interface{}{
					"type": "boolean",
					"example": true,
				},
				"supportedFeatures": map[string]interface{}{
					"type": "array",
					"items": map[string]interface{}{"type": "string"},
					"example": []string{"contacts", "companies", "orders"},
				},
			},
		}

		// Connection schema
		schemas["Connection"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"connectionId": map[string]interface{}{
					"type": "string",
					"example": "conn_123e4567",
				},
				"platformId": map[string]interface{}{
					"type": "string",
					"example": "keap",
				},
				"accountId": map[string]interface{}{
					"type": "string",
					"example": "account:123e4567-e89b-12d3-a456-426614174000",
				},
				"name": map[string]interface{}{
					"type": "string",
					"example": "Main Keap Account",
				},
				"status": map[string]interface{}{
					"type": "string",
					"enum": []string{"active", "inactive", "error", "pending"},
					"example": "active",
				},
				"isActive": map[string]interface{}{
					"type": "boolean",
					"example": true,
				},
				"lastSyncAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T14:30:00Z",
				},
				"createdAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T10:30:00Z",
				},
			},
		}

		// Source schema
		schemas["Source"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"sourceId": map[string]interface{}{
					"type": "string",
					"example": "src_123e4567",
				},
				"accountId": map[string]interface{}{
					"type": "string",
					"example": "account:123e4567-e89b-12d3-a456-426614174000",
				},
				"connectionId": map[string]interface{}{
					"type": "string",
					"example": "conn_123e4567",
				},
				"platformSourceId": map[string]interface{}{
					"type": "string",
					"example": "keap-contacts",
				},
				"name": map[string]interface{}{
					"type": "string",
					"example": "Customer Contacts",
				},
				"description": map[string]interface{}{
					"type": "string",
					"example": "All customer contact data from Keap",
				},
				"status": map[string]interface{}{
					"type": "string",
					"enum": []string{"active", "inactive", "error", "syncing"},
					"example": "active",
				},
				"isActive": map[string]interface{}{
					"type": "boolean",
					"example": true,
				},
				"lastSyncAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T14:30:00Z",
				},
				"nextSyncAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-16T14:30:00Z",
				},
				"createdAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T10:30:00Z",
				},
			},
		}

		// Job schema
		schemas["Job"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"jobId": map[string]interface{}{
					"type": "string",
					"example": "job_123e4567",
				},
				"type": map[string]interface{}{
					"type": "string",
					"enum": []string{"sync", "backup", "export"},
					"example": "sync",
				},
				"status": map[string]interface{}{
					"type": "string",
					"enum": []string{"pending", "running", "completed", "failed"},
					"example": "running",
				},
				"progress": map[string]interface{}{
					"type": "integer",
					"minimum": 0,
					"maximum": 100,
					"example": 45,
					"description": "Progress percentage (0-100)",
				},
				"createdAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T10:30:00Z",
				},
				"completedAt": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T10:35:00Z",
					"nullable": true,
				},
			},
		}

		// Error schema
		schemas["Error"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"error": map[string]interface{}{
					"type": "string",
					"example": "Validation failed",
				},
				"message": map[string]interface{}{
					"type": "string",
					"example": "The request body is invalid",
				},
				"details": map[string]interface{}{
					"type": "object",
					"additionalProperties": true,
				},
				"timestamp": map[string]interface{}{
					"type": "string",
					"format": "date-time",
					"example": "2024-01-15T10:30:00Z",
				},
			},
			"required": []string{"error", "message", "timestamp"},
		}

		// Auth schemas
		schemas["LoginRequest"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"email": map[string]interface{}{
					"type": "string",
					"format": "email",
					"example": "user@example.com",
				},
				"password": map[string]interface{}{
					"type": "string",
					"minLength": 8,
					"example": "securePassword123",
				},
			},
			"required": []string{"email", "password"},
		}

		schemas["LoginResponse"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"accessToken": map[string]interface{}{
					"type": "string",
					"example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
					"description": "JWT access token for API authentication",
				},
				"refreshToken": map[string]interface{}{
					"type": "string",
					"example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
					"description": "JWT refresh token for obtaining new access tokens",
				},
				"expiresIn": map[string]interface{}{
					"type": "integer",
					"example": 3600,
					"description": "Access token expiration time in seconds",
				},
				"user": map[string]interface{}{
					"$ref": "#/components/schemas/User",
				},
			},
			"required": []string{"accessToken", "refreshToken", "expiresIn", "user"},
		}

		schemas["RegisterRequest"] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"email": map[string]interface{}{
					"type": "string",
					"format": "email",
					"example": "newuser@example.com",
				},
				"password": map[string]interface{}{
					"type": "string",
					"minLength": 8,
					"example": "securePassword123",
				},
				"name": map[string]interface{}{
					"type": "string",
					"example": "John Doe",
				},
				"company": map[string]interface{}{
					"type": "string",
					"example": "Acme Corp",
				},
			},
			"required": []string{"email", "password", "name"},
		}
	
	log.Printf("Added %d schemas to OpenAPI spec", len(schemas))
}

// enhancePaths adds better descriptions, summaries, and response schemas to API paths
func enhancePaths(paths map[string]interface{}) {
	endpointDescriptions := map[string]map[string]map[string]interface{}{
		"/auth/login": {
			"post": {
				"summary":     "User login",
				"description": "Authenticate a user with email and password to receive JWT tokens",
				"tags":        []string{"Authentication"},
				"requestBody": map[string]interface{}{
					"required": true,
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]interface{}{
								"$ref": "#/components/schemas/LoginRequest",
							},
							"example": map[string]interface{}{
								"email":    "user@example.com",
								"password": "securePassword123",
							},
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Login successful",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/LoginResponse",
								},
								"example": map[string]interface{}{
									"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyOjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcxMDc5NDQwMCwiZXhwIjoxNzEwNzk4MDAwfQ.example_signature",
									"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyOjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzEwNzk0NDAwLCJleHAiOjE3MTE0OTkyMDB9.refresh_signature",
									"expiresIn": 3600,
									"user": map[string]interface{}{
										"userId": "user:123e4567-e89b-12d3-a456-426614174000",
										"email": "user@example.com",
										"name": "John Doe",
										"status": "active",
										"currentAccount": map[string]interface{}{
											"accountId": "account:123e4567-e89b-12d3-a456-426614174000",
											"accountName": "My Company",
											"company": "Acme Corp",
											"role": "Owner",
											"isCurrent": true,
										},
										"createdAt": "2024-01-15T10:30:00Z",
										"lastLoginAt": "2024-01-20T14:30:00Z",
									},
								},
							},
						},
					},
					"401": map[string]interface{}{
						"description": "Invalid credentials",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/Error",
								},
								"example": map[string]interface{}{
									"error":     "Authentication failed",
									"message":   "Invalid email or password",
									"timestamp": "2024-01-15T10:30:00Z",
								},
							},
						},
					},
				},
			},
		},
		"/auth/register": {
			"post": {
				"summary":     "User registration",
				"description": "Register a new user account with email and password",
				"tags":        []string{"Authentication"},
				"requestBody": map[string]interface{}{
					"required": true,
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]interface{}{
								"$ref": "#/components/schemas/RegisterRequest",
							},
							"example": map[string]interface{}{
								"email":    "newuser@example.com",
								"password": "securePassword123",
								"name":     "John Doe",
								"company":  "Acme Corp",
							},
						},
					},
				},
				"responses": map[string]interface{}{
					"201": map[string]interface{}{
						"description": "User created successfully",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/LoginResponse",
								},
								"example": map[string]interface{}{
									"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyOmFiYzEyMzQ1LWZnaGktNjc4OS1qazEyLXQzNDU2Nzg5MGFiYyIsImVtYWlsIjoibmV3dXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcxMDc5NDQwMCwiZXhwIjoxNzEwNzk4MDAwfQ.new_user_signature",
									"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyOmFiYzEyMzQ1LWZnaGktNjc4OS1qazEyLXQzNDU2Nzg5MGFiYyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzEwNzk0NDAwLCJleHAiOjE3MTE0OTkyMDB9.new_refresh_signature",
									"expiresIn": 3600,
									"user": map[string]interface{}{
										"userId": "user:abc12345-fghi-6789-jk12-t34567890abc",
										"email": "newuser@example.com",
										"name": "John Doe",
										"status": "active",
										"currentAccount": map[string]interface{}{
											"accountId": "account:def67890-ghij-1234-kl56-m78901234def",
											"accountName": "Acme Corp",
											"company": "Acme Corp",
											"role": "Owner",
											"isCurrent": true,
										},
										"createdAt": "2024-01-20T15:45:00Z",
									},
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Registration failed",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/Error",
								},
								"example": map[string]interface{}{
									"error":     "Registration failed",
									"message":   "Email already exists",
									"timestamp": "2024-01-15T10:30:00Z",
								},
							},
						},
					},
				},
			},
		},
		"/auth/status": {
			"get": {
				"summary":     "Authentication status",
				"description": "Verify the current authentication status and token validity",
				"tags":        []string{"Authentication"},
			},
		},
		"/me": {
			"get": {
				"summary":     "Get current user",
				"description": "Retrieve the profile information for the currently authenticated user",
				"tags":        []string{"User Management"},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "User profile retrieved successfully",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/User",
								},
								"example": map[string]interface{}{
									"userId": "user:123e4567-e89b-12d3-a456-426614174000",
									"email": "user@example.com",
									"name": "John Doe",
									"status": "active",
									"currentAccount": map[string]interface{}{
										"accountId": "account:123e4567-e89b-12d3-a456-426614174000",
										"accountName": "My Company",
										"company": "Acme Corp",
										"role": "Owner",
										"isCurrent": true,
									},
									"preferences": map[string]interface{}{
										"theme": "light",
										"notifications": true,
										"timezone": "America/New_York",
										"language": "en",
									},
									"createdAt": "2024-01-15T10:30:00Z",
									"lastLoginAt": "2024-01-20T14:30:00Z",
								},
							},
						},
					},
				},
			},
			"put": {
				"summary":     "Update current user",
				"description": "Update the profile information for the currently authenticated user",
				"tags":        []string{"User Management"},
				"requestBody": map[string]interface{}{
					"required": true,
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]interface{}{
								"type": "object",
								"properties": map[string]interface{}{
									"name": map[string]interface{}{
										"type": "string",
										"example": "John Doe Updated",
									},
									"preferences": map[string]interface{}{
										"type": "object",
										"additionalProperties": true,
									},
								},
							},
							"example": map[string]interface{}{
								"name": "John Doe Updated",
								"preferences": map[string]interface{}{
									"theme": "dark",
									"notifications": true,
								},
							},
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "User updated successfully",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/User",
								},
							},
						},
					},
				},
			},
		},
		"/platforms": {
			"get": {
				"summary":     "List platforms",
				"description": "Retrieve all available platforms that can be connected for data backup",
				"tags":        []string{"Platforms"},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "List of available platforms",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"type": "object",
									"properties": map[string]interface{}{
										"platforms": map[string]interface{}{
											"type": "array",
											"items": map[string]interface{}{
												"$ref": "#/components/schemas/Platform",
											},
										},
										"total": map[string]interface{}{
											"type": "integer",
											"example": 10,
										},
									},
								},
								"example": map[string]interface{}{
									"platforms": []map[string]interface{}{
										{
											"platformId": "keap",
											"name": "Keap",
											"description": "CRM and marketing automation platform",
											"category": "CRM",
											"logoUrl": "https://logos.listbackup.ai/keap.png",
											"isActive": true,
											"requiresOAuth": true,
											"supportedFeatures": []string{"contacts", "companies", "orders"},
										},
										{
											"platformId": "stripe",
											"name": "Stripe",
											"description": "Payment processing platform",
											"category": "Payment",
											"logoUrl": "https://logos.listbackup.ai/stripe.png",
											"isActive": true,
											"requiresOAuth": true,
											"supportedFeatures": []string{"customers", "charges", "subscriptions"},
										},
									},
									"total": 10,
								},
							},
						},
					},
				},
			},
		},
		"/platforms/{platformId}": {
			"get": {
				"summary":     "Get platform details",
				"description": "Retrieve detailed information about a specific platform",
				"tags":        []string{"Platforms"},
			},
		},
		"/platforms/{platformId}/sources": {
			"get": {
				"summary":     "List platform sources",
				"description": "Get all available data sources for a specific platform",
				"tags":        []string{"Platforms"},
			},
		},
		"/connections": {
			"get": {
				"summary":     "List connections",
				"description": "Retrieve all platform connections for the authenticated user",
				"tags":        []string{"Connections"},
			},
			"post": {
				"summary":     "Create connection",
				"description": "Create a new connection to a platform using OAuth or API credentials",
				"tags":        []string{"Connections"},
			},
		},
		"/connections/{connectionId}": {
			"get": {
				"summary":     "Get connection",
				"description": "Retrieve details of a specific platform connection",
				"tags":        []string{"Connections"},
			},
			"put": {
				"summary":     "Update connection",
				"description": "Update the settings or configuration of a platform connection",
				"tags":        []string{"Connections"},
			},
			"delete": {
				"summary":     "Delete connection",
				"description": "Remove a platform connection and all associated data sources",
				"tags":        []string{"Connections"},
			},
		},
		"/connections/{connectionId}/test": {
			"post": {
				"summary":     "Test connection",
				"description": "Test a platform connection to verify it's working properly",
				"tags":        []string{"Connections"},
			},
		},
		"/sources": {
			"get": {
				"summary":     "List sources",
				"description": "Retrieve all data sources for the authenticated user",
				"tags":        []string{"Sources"},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "List of data sources",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"type": "object",
									"properties": map[string]interface{}{
										"sources": map[string]interface{}{
											"type": "array",
											"items": map[string]interface{}{
												"$ref": "#/components/schemas/Source",
											},
										},
									},
								},
								"example": map[string]interface{}{
									"sources": []map[string]interface{}{
										{
											"sourceId": "src_abc12345",
											"accountId": "account:123e4567-e89b-12d3-a456-426614174000",
											"connectionId": "conn_keap001",
											"platformSourceId": "keap-contacts",
											"name": "Customer Contacts",
											"description": "All customer contact data from Keap CRM",
											"status": "active",
											"isActive": true,
											"lastSyncAt": "2024-01-20T14:30:00Z",
											"nextSyncAt": "2024-01-21T14:30:00Z",
											"createdAt": "2024-01-15T10:30:00Z",
											"settings": map[string]interface{}{
												"syncFrequency": "daily",
												"includeInactive": false,
												"fieldsToSync": []string{"firstName", "lastName", "email", "phone"},
											},
										},
										{
											"sourceId": "src_def67890",
											"accountId": "account:123e4567-e89b-12d3-a456-426614174000",
											"connectionId": "conn_stripe001",
											"platformSourceId": "stripe-customers",
											"name": "Stripe Customers",
											"description": "Customer data from Stripe payment processing",
											"status": "active",
											"isActive": true,
											"lastSyncAt": "2024-01-20T16:45:00Z",
											"nextSyncAt": "2024-01-21T16:45:00Z",
											"createdAt": "2024-01-18T09:15:00Z",
											"settings": map[string]interface{}{
												"syncFrequency": "hourly",
												"includeTestData": false,
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"post": {
				"summary":     "Create source",
				"description": "Create a new data source from a platform connection",
				"tags":        []string{"Sources"},
				"requestBody": map[string]interface{}{
					"required": true,
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]interface{}{
								"type": "object",
								"required": []string{"connectionId", "platformSourceId", "name"},
								"properties": map[string]interface{}{
									"connectionId": map[string]interface{}{
										"type": "string",
										"example": "conn_123e4567",
									},
									"platformSourceId": map[string]interface{}{
										"type": "string",
										"example": "keap-contacts",
									},
									"name": map[string]interface{}{
										"type": "string",
										"example": "Customer Contacts",
									},
									"description": map[string]interface{}{
										"type": "string",
										"example": "All customer contact data from Keap",
									},
									"settings": map[string]interface{}{
										"type": "object",
										"additionalProperties": true,
									},
								},
							},
							"example": map[string]interface{}{
								"connectionId": "conn_123e4567",
								"platformSourceId": "keap-contacts",
								"name": "Customer Contacts",
								"description": "All customer contact data from Keap",
								"settings": map[string]interface{}{
									"syncFrequency": "daily",
									"includeInactive": false,
								},
							},
						},
					},
				},
				"responses": map[string]interface{}{
					"201": map[string]interface{}{
						"description": "Source created successfully",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/Source",
								},
								"example": map[string]interface{}{
									"sourceId": "src_new12345",
									"accountId": "account:123e4567-e89b-12d3-a456-426614174000",
									"connectionId": "conn_123e4567",
									"platformSourceId": "keap-contacts",
									"name": "Customer Contacts",
									"description": "All customer contact data from Keap",
									"status": "active",
									"isActive": true,
									"lastSyncAt": nil,
									"nextSyncAt": "2024-01-21T09:00:00Z",
									"createdAt": "2024-01-20T15:30:00Z",
									"settings": map[string]interface{}{
										"syncFrequency": "daily",
										"includeInactive": false,
										"autoSync": true,
									},
								},
							},
						},
					},
				},
			},
		},
		"/sources/{sourceId}": {
			"get": {
				"summary":     "Get source",
				"description": "Retrieve details of a specific data source",
				"tags":        []string{"Sources"},
			},
			"put": {
				"summary":     "Update source",
				"description": "Update the configuration or settings of a data source",
				"tags":        []string{"Sources"},
			},
			"delete": {
				"summary":     "Delete source",
				"description": "Remove a data source and stop all associated backups",
				"tags":        []string{"Sources"},
			},
		},
		"/sources/{sourceId}/sync": {
			"post": {
				"summary":     "Sync source",
				"description": "Trigger a manual synchronization of data from the source platform",
				"tags":        []string{"Sources"},
			},
		},
		"/sources/{sourceId}/test": {
			"post": {
				"summary":     "Test source",
				"description": "Test a data source to verify it can access data properly",
				"tags":        []string{"Sources"},
			},
		},
		"/jobs": {
			"post": {
				"summary":     "Create job",
				"description": "Create a new background job for data processing or backup",
				"tags":        []string{"Jobs"},
			},
		},
		"/jobs/{jobId}": {
			"get": {
				"summary":     "Get job status",
				"description": "Retrieve the status and details of a background job",
				"tags":        []string{"Jobs"},
			},
		},
		"/system/health": {
			"get": {
				"summary":     "Health check",
				"description": "Check the health status of the API and its dependencies",
				"tags":        []string{"System"},
			},
		},
		"/system/openapi": {
			"get": {
				"summary":     "API specification",
				"description": "Download the OpenAPI specification for this API",
				"tags":        []string{"System"},
			},
		},
	}

	// Apply enhancements to each path
	log.Printf("Applying enhancements to %d paths", len(paths))
	for pathKey, pathValue := range paths {
		if pathObj, ok := pathValue.(map[string]interface{}); ok {
			// Get descriptions for this path
			if descriptions, exists := endpointDescriptions[pathKey]; exists {
				log.Printf("Enhancing path: %s", pathKey)
				// Apply to each HTTP method
				for method, methodObj := range pathObj {
					if methodData, ok := methodObj.(map[string]interface{}); ok {
						if desc, exists := descriptions[method]; exists {
							// Add summary, description, and tags
							if summary, ok := desc["summary"]; ok {
								methodData["summary"] = summary
							}
							if description, ok := desc["description"]; ok {
								methodData["description"] = description
							}
							if tags, ok := desc["tags"]; ok {
								methodData["tags"] = tags
							}

							// Add request body if specified
							if requestBody, ok := desc["requestBody"]; ok {
								methodData["requestBody"] = requestBody
							}

							// Add/update responses
							if responses, ok := desc["responses"]; ok {
								methodData["responses"] = responses
							}

							// Update security references
							if security, ok := methodData["security"].([]interface{}); ok {
								for _, secItem := range security {
									if secMap, ok := secItem.(map[string]interface{}); ok {
										if _, exists := secMap["cognitoAuthorizer"]; exists {
											delete(secMap, "cognitoAuthorizer")
											secMap["BearerAuth"] = []interface{}{}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

// removeAWSExtensions removes AWS-specific implementation details from the spec
func removeAWSExtensions(spec map[string]interface{}) {
	// Remove AWS extensions from root level
	delete(spec, "x-amazon-apigateway-cors")
	delete(spec, "x-amazon-apigateway-importexport-version")

	// Remove AWS tags
	if tags, ok := spec["tags"].([]interface{}); ok {
		var cleanTags []interface{}
		for _, tag := range tags {
			if tagMap, ok := tag.(map[string]interface{}); ok {
				if name, ok := tagMap["name"].(string); ok && name != "STAGE" {
					cleanTags = append(cleanTags, tag)
				}
			}
		}
		spec["tags"] = cleanTags
	}

	// Remove AWS extensions from paths
	if paths, ok := spec["paths"].(map[string]interface{}); ok {
		removeAWSExtensionsFromPaths(paths)
	}
}

// removeAWSExtensionsFromPaths removes AWS-specific details from path definitions
func removeAWSExtensionsFromPaths(paths map[string]interface{}) {
	for _, pathValue := range paths {
		if pathObj, ok := pathValue.(map[string]interface{}); ok {
			for _, methodValue := range pathObj {
				if methodObj, ok := methodValue.(map[string]interface{}); ok {
					// Remove AWS integration details
					delete(methodObj, "x-amazon-apigateway-integration")
					
					// Clean up responses
					if responses, ok := methodObj["responses"].(map[string]interface{}); ok {
						// Remove generic default responses and replace with meaningful ones
						delete(responses, "default")
						
						// Add standard responses based on method
						responses["200"] = map[string]interface{}{
							"description": "Successful operation",
							"content": map[string]interface{}{
								"application/json": map[string]interface{}{
									"schema": map[string]interface{}{
										"type": "object",
									},
								},
							},
						}
						
						responses["400"] = map[string]interface{}{
							"description": "Bad request - invalid input",
						}
						
						responses["401"] = map[string]interface{}{
							"description": "Unauthorized - authentication required",
						}
						
						responses["404"] = map[string]interface{}{
							"description": "Resource not found",
						}
						
						responses["500"] = map[string]interface{}{
							"description": "Internal server error",
						}
					}
				}
			}
		}
	}
}

func main() {
	handler, err := NewOpenAPIExportHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create OpenAPI export handler: %v", err)
	}

	lambda.Start(handler.Handle)
}