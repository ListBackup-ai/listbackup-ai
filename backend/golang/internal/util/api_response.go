package util

import (
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

func JSON(statusCode int, body interface{}) (events.APIGatewayProxyResponse, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		log.Printf("ERROR: Failed to marshal response body: %v", err)
		return Error(500, "Internal server error"), err
	}

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type,Authorization",
		},
		Body: string(jsonBody),
	}, nil
}

func WithCookies(statusCode int, body interface{}, cookies []string) (events.APIGatewayProxyResponse, error) {
	resp, err := JSON(statusCode, body)
	if err != nil {
		return resp, err
	}
	
	// Convert to multiValueHeaders for cookies
	if len(cookies) > 0 {
		resp.MultiValueHeaders = map[string][]string{
			"Set-Cookie": cookies,
		}
	}
	
	return resp, nil
}

func Error(statusCode int, message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type,Authorization",
		},
		Body: `{"success":false,"error":"` + message + `"}`,
	}
}