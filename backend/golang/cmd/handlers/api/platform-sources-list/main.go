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

type ListPlatformSourcesHandler struct {
	db *platformsdb.Client
}

func NewListPlatformSourcesHandler() (*ListPlatformSourcesHandler, error) {
	db, err := platformsdb.NewClient()
	if err != nil {
		return nil, err
	}

	return &ListPlatformSourcesHandler{
		db: db,
	}, nil
}

func (h *ListPlatformSourcesHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	platformId := event.PathParameters["platformId"]
	if platformId == "" {
		return response.BadRequest("Platform ID is required"), nil
	}

	log.Printf("List platform sources request for platform: %s", platformId)

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

	// Get table name from environment
	tableName := os.Getenv("PLATFORM_SOURCES_TABLE")
	if tableName == "" {
		tableName = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platform-sources"
	}

	// Get category filter if provided
	category := event.QueryStringParameters["category"]
	status := event.QueryStringParameters["status"]

	var platformSources []types.PlatformSource
	var err error

	if category != "" {
		// Filter by both platformId and category using GSI
		expressionValues := map[string]*dynamodb.AttributeValue{
			":platformId": {S: &platformId},
			":category":   {S: &category},
		}
		err = h.db.QueryGSI(tableName, "PlatformCategoryIndex", "platformId = :platformId AND category = :category", expressionValues, &platformSources)
	} else if status != "" {
		// Filter by both platformId and status using GSI
		expressionValues := map[string]*dynamodb.AttributeValue{
			":platformId": {S: &platformId},
			":status":     {S: &status},
		}
		err = h.db.QueryGSI(tableName, "PlatformStatusIndex", "platformId = :platformId AND #status = :status", expressionValues, &platformSources)
	} else {
		// Get all platform sources for this platform
		expressionValues := map[string]*dynamodb.AttributeValue{
			":platformId": {S: &platformId},
		}
		err = h.db.QueryGSI(tableName, "PlatformIndex", "platformId = :platformId", expressionValues, &platformSources)
	}

	if err != nil {
		log.Printf("Failed to list platform sources for platform %s: %v", platformId, err)
		return response.InternalServerError("Failed to list platform sources"), nil
	}

	log.Printf("Found %d platform sources for platform %s", len(platformSources), platformId)
	return response.Success(map[string]interface{}{
		"platformSources": platformSources,
		"total":           len(platformSources),
		"platformId":      platformId,
	}), nil
}

func main() {
	handler, err := NewListPlatformSourcesHandler()
	if err != nil {
		log.Fatalf("Failed to create list platform sources handler: %v", err)
	}

	lambda.Start(handler.Handle)
}