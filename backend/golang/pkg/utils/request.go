package utils

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"unicode/utf8"

	"github.com/aws/aws-lambda-go/events"
)

// ParseRequestBody handles potential base64 encoding and extracts the request body
// This function addresses common JSON parsing issues in Lambda handlers:
// 1. Base64 encoded request bodies
// 2. Content-Type validation  
// 3. Character encoding issues
// 4. Basic JSON structure validation
func ParseRequestBody(event events.APIGatewayV2HTTPRequest) ([]byte, error) {
	body := event.Body
	
	// Check if body is base64 encoded
	if event.IsBase64Encoded {
		log.Printf("Body is base64 encoded, decoding...")
		decodedBody, err := base64.StdEncoding.DecodeString(body)
		if err != nil {
			return nil, fmt.Errorf("failed to decode base64 body: %w", err)
		}
		body = string(decodedBody)
	}
	
	// Log the content type for debugging
	contentType := ""
	if ct, exists := event.Headers["content-type"]; exists {
		contentType = ct
	} else if ct, exists := event.Headers["Content-Type"]; exists {
		contentType = ct
	}
	log.Printf("Content-Type: %s", contentType)
	
	// Validate that it's JSON content (warning only, don't fail)
	if contentType != "" && !strings.Contains(strings.ToLower(contentType), "application/json") {
		log.Printf("Warning: Content-Type is not application/json: %s", contentType)
	}
	
	// Trim whitespace and validate non-empty
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, fmt.Errorf("empty body after processing")
	}
	
	// Check for valid UTF-8 encoding
	if !utf8.ValidString(body) {
		return nil, fmt.Errorf("body contains invalid UTF-8 characters")
	}
	
	// Basic JSON structure validation
	if !strings.HasPrefix(body, "{") || !strings.HasSuffix(body, "}") {
		return nil, fmt.Errorf("body does not appear to be JSON object: %s", truncateString(body, 100))
	}
	
	// Validate JSON syntax by attempting to parse into generic interface
	var testJSON interface{}
	if err := json.Unmarshal([]byte(body), &testJSON); err != nil {
		return nil, fmt.Errorf("invalid JSON syntax: %w", err)
	}
	
	log.Printf("Successfully parsed request body (length: %d)", len(body))
	return []byte(body), nil
}

// ValidateJSONRequest validates and parses a JSON request into the provided struct
func ValidateJSONRequest(event events.APIGatewayV2HTTPRequest, target interface{}) error {
	// Check for empty body
	if event.Body == "" {
		return fmt.Errorf("request body is required")
	}
	
	// Parse request body
	body, err := ParseRequestBody(event)
	if err != nil {
		return fmt.Errorf("failed to parse request body: %w", err)
	}
	
	// Unmarshal into target struct
	if err := json.Unmarshal(body, target); err != nil {
		log.Printf("JSON unmarshaling error: %v", err)
		log.Printf("Body content: %s", truncateString(string(body), 200))
		return fmt.Errorf("invalid JSON format: %w", err)
	}
	
	return nil
}

// truncateString truncates a string to the specified length with ellipsis
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// SanitizeForLog removes sensitive information from strings for safe logging
func SanitizeForLog(input string) string {
	// Don't log passwords, tokens, or other sensitive data
	if len(input) == 0 {
		return ""
	}
	
	// For short strings, show length only
	if len(input) < 10 {
		return fmt.Sprintf("[%d chars]", len(input))
	}
	
	// For longer strings, show first few chars + length
	return fmt.Sprintf("%s... [%d chars total]", input[:3], len(input))
}