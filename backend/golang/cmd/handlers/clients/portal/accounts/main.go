package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/pkg/response"
)

func Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Client portal handler - not implemented yet")
	return response.Success(map[string]interface{}{
		"message": "Client portal endpoint - not implemented yet",
		"status":  "stub",
	}), nil
}

func main() {
	lambda.Start(Handle)
}
