package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/platformsdb"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type ListPlatformsHandler struct {
	db *platformsdb.Client
}

func NewListPlatformsHandler() (*ListPlatformsHandler, error) {
	db, err := platformsdb.NewClient()
	if err != nil {
		return nil, err
	}

	return &ListPlatformsHandler{
		db: db,
	}, nil
}

func (h *ListPlatformsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List platforms request")

	// Get table name from environment
	tableName := os.Getenv("PLATFORMS_TABLE")
	if tableName == "" {
		tableName = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}

	// Get category filter if provided
	category := event.QueryStringParameters["category"]
	status := event.QueryStringParameters["status"]

	var platforms []types.Platform
	var err error

	if category != "" {
		// Filter by category using GSI
		expressionValues := map[string]*dynamodb.AttributeValue{
			":category": {S: &category},
		}
		err = h.db.QueryGSI(tableName, "CategoryIndex", "category = :category", expressionValues, &platforms)
	} else if status != "" {
		// Filter by status using GSI
		expressionValues := map[string]*dynamodb.AttributeValue{
			":status": {S: &status},
		}
		err = h.db.QueryGSI(tableName, "StatusIndex", "#status = :status", expressionValues, &platforms)
	} else {
		// Get all platforms
		err = h.db.ScanAll(tableName, &platforms)
	}

	if err != nil {
		log.Printf("Failed to list platforms: %v", err)
		return response.InternalServerError("Failed to list platforms"), nil
	}

	// Remove sensitive OAuth client secrets from response
	for i := range platforms {
		if platforms[i].OAuth != nil {
			// Keep only public OAuth config
			platforms[i].OAuth = &types.OAuthConfiguration{
				AuthURL:      platforms[i].OAuth.AuthURL,
				Scopes:       platforms[i].OAuth.Scopes,
				ResponseType: platforms[i].OAuth.ResponseType,
			}
		}
	}

	log.Printf("Found %d platforms", len(platforms))
	return response.Success(map[string]interface{}{
		"platforms": platforms,
		"total":     len(platforms),
	}), nil
}

func main() {
	handler, err := NewListPlatformsHandler()
	if err != nil {
		log.Fatalf("Failed to create list platforms handler: %v", err)
	}

	lambda.Start(handler.Handle)
}