package main

import (
	"context"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/pkg/response"
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
		Service:   "listbackup",
	}

	return response.Success(health), nil
}

func main() {
	lambda.Start(handler)
}