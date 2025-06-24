package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type HealthStatus struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
	Service   string    `json:"service"`
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	health := HealthStatus{
		Status:    "healthy",
		Timestamp: time.Now(),
		Version:   "2.0.0",
		Service:   "listbackup-api",
	}

	body, _ := json.Marshal(map[string]interface{}{
		"success": true,
		"data":    health,
	})

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
			"Content-Type":                 "application/json",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(handler)
}