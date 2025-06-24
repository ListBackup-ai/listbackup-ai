package main

import (
	"context"
	"log"
	"sort"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/internal/database"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type ListPlatformSourcesHandler struct {
	db *database.DynamoDBClient
}

func NewListPlatformSourcesHandler(ctx context.Context) (*ListPlatformSourcesHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
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

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

	log.Printf("List platform sources request for platform: %s", platformId)

	// Get query parameters for filtering
	category := event.QueryStringParameters["category"]
	dataType := event.QueryStringParameters["dataType"]
	status := event.QueryStringParameters["status"]
	popularSort := event.QueryStringParameters["popular"] == "true"

	var platformSources []types.PlatformSource
	var err error

	if category != "" {
		// Filter by category using GSI
		err = h.db.QueryGSI(ctx, database.PlatformSourcesTable, "CategoryIndex", "category = :category", map[string]interface{}{
			":category": category,
		}, &platformSources)
		// Then filter by platformId in memory
		platformSources = h.filterByPlatform(platformSources, platformId)
	} else if dataType != "" {
		// Filter by data type using GSI
		err = h.db.QueryGSI(ctx, database.PlatformSourcesTable, "DataTypeIndex", "dataType = :dataType", map[string]interface{}{
			":dataType": dataType,
		}, &platformSources)
		// Then filter by platformId in memory
		platformSources = h.filterByPlatform(platformSources, platformId)
	} else if status != "" {
		// Filter by status using GSI
		err = h.db.QueryGSI(ctx, database.PlatformSourcesTable, "StatusIndex", "#status = :status", map[string]interface{}{
			":status": status,
		}, &platformSources)
		// Then filter by platformId in memory
		platformSources = h.filterByPlatform(platformSources, platformId)
	} else if popularSort {
		// Sort by popularity using GSI
		err = h.db.QueryGSI(ctx, database.PlatformSourcesTable, "PopularityIndex", "platformId = :platformId", map[string]interface{}{
			":platformId": platformId,
		}, &platformSources)
	} else {
		// Get all platform sources for this platform
		err = h.db.QueryGSI(ctx, database.PlatformSourcesTable, "PlatformIndex", "platformId = :platformId", map[string]interface{}{
			":platformId": platformId,
		}, &platformSources)
	}

	if err != nil {
		log.Printf("Failed to list platform sources: %v", err)
		return response.InternalServerError("Failed to list platform sources"), nil
	}

	// Sort by popularity if not already sorted by GSI
	if !popularSort && len(platformSources) > 0 {
		sort.Slice(platformSources, func(i, j int) bool {
			return platformSources[i].Popularity > platformSources[j].Popularity
		})
	}

	log.Printf("Found %d platform sources for platform %s", len(platformSources), platformId)
	return response.Success(map[string]interface{}{
		"platformSources": platformSources,
		"total":          len(platformSources),
		"platformId":     platformId,
	}), nil
}

func (h *ListPlatformSourcesHandler) filterByPlatform(sources []types.PlatformSource, platformId string) []types.PlatformSource {
	var filtered []types.PlatformSource
	for _, source := range sources {
		if source.PlatformID == platformId {
			filtered = append(filtered, source)
		}
	}
	return filtered
}

func main() {
	handler, err := NewListPlatformSourcesHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create list platform sources handler: %v", err)
	}

	lambda.Start(handler.Handle)
}