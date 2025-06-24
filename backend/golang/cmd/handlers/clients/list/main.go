package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// Response structures to match create handler
type APIResponse struct {
	StatusCode int               `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

type ResponseBody struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

func success(data interface{}) APIResponse {
	body := ResponseBody{
		Success: true,
		Data:    data,
	}
	bodyBytes, _ := json.Marshal(body)
	return APIResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(bodyBytes),
	}
}

func Handle(ctx context.Context, event events.APIGatewayProxyRequest) (APIResponse, error) {
	log.Printf("List clients endpoint called")
	
	responseData := map[string]interface{}{
		"clients": []interface{}{},
		"count":   0,
		"message": "Clients service working - list endpoint",
	}
	
	return success(responseData), nil
}

func main() {
	lambda.Start(Handle)
}