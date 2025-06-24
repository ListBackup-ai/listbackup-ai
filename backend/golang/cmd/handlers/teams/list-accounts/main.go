package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/pkg/response"
)

func Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Team handler request - placeholder")
	return response.Success(map[string]interface{}{
		"message": "Team endpoint - not implemented yet",
	}), nil
}

func main() {
	lambda.Start(Handle)
}
