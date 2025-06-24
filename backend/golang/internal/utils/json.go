package utils

import (
	"encoding/base64"
	"encoding/json"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

// ParseJSON parses JSON from a string body
func ParseJSON(body string, target interface{}) error {
	// Try direct JSON parsing first
	if err := json.Unmarshal([]byte(body), target); err == nil {
		return nil
	}

	// Handle specific API Gateway double-escaping issues
	// Replace \\! with ! and other common escape patterns
	fixedBody := strings.ReplaceAll(body, "\\!", "!")
	fixedBody = strings.ReplaceAll(fixedBody, "\\@", "@")
	fixedBody = strings.ReplaceAll(fixedBody, "\\#", "#")
	fixedBody = strings.ReplaceAll(fixedBody, "\\$", "$")
	fixedBody = strings.ReplaceAll(fixedBody, "\\%", "%")
	fixedBody = strings.ReplaceAll(fixedBody, "\\^", "^")
	fixedBody = strings.ReplaceAll(fixedBody, "\\&", "&")
	fixedBody = strings.ReplaceAll(fixedBody, "\\*", "*")
	
	// Try parsing the fixed JSON
	if err := json.Unmarshal([]byte(fixedBody), target); err == nil {
		return nil
	}

	// Try unescaping the JSON if direct parsing fails
	unescaped, unescapeErr := strconv.Unquote(`"` + body + `"`)
	if unescapeErr != nil {
		// Return original error if unescaping fails
		return json.Unmarshal([]byte(body), target)
	}

	// Try parsing the unescaped JSON
	return json.Unmarshal([]byte(unescaped), target)
}

// ParseJSONBody parses JSON from API Gateway event, handling escaping issues
func ParseJSONBody(event events.APIGatewayProxyRequest, target interface{}) error {
	// Handle base64 encoded body
	body := event.Body
	if event.IsBase64Encoded {
		decoded, err := base64.StdEncoding.DecodeString(body)
		if err != nil {
			return err
		}
		body = string(decoded)
	}

	// Try direct JSON parsing first
	if err := json.Unmarshal([]byte(body), target); err == nil {
		return nil
	}

	// Handle specific API Gateway double-escaping issues
	// Replace \\! with ! and other common escape patterns
	fixedBody := strings.ReplaceAll(body, "\\!", "!")
	fixedBody = strings.ReplaceAll(fixedBody, "\\@", "@")
	fixedBody = strings.ReplaceAll(fixedBody, "\\#", "#")
	fixedBody = strings.ReplaceAll(fixedBody, "\\$", "$")
	fixedBody = strings.ReplaceAll(fixedBody, "\\%", "%")
	fixedBody = strings.ReplaceAll(fixedBody, "\\^", "^")
	fixedBody = strings.ReplaceAll(fixedBody, "\\&", "&")
	fixedBody = strings.ReplaceAll(fixedBody, "\\*", "*")
	
	// Try parsing the fixed JSON
	if err := json.Unmarshal([]byte(fixedBody), target); err == nil {
		return nil
	}

	// Try unescaping the JSON if direct parsing fails
	unescaped, unescapeErr := strconv.Unquote(`"` + body + `"`)
	if unescapeErr != nil {
		// Return original error if unescaping fails
		return json.Unmarshal([]byte(body), target)
	}

	// Try parsing the unescaped JSON
	return json.Unmarshal([]byte(unescaped), target)
}