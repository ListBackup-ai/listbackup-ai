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

type GetPlatformSourceHandler struct {
	db *platformsdb.Client
}

func NewGetPlatformSourceHandler() (*GetPlatformSourceHandler, error) {
	db, err := platformsdb.NewClient()
	if err != nil {
		return nil, err
	}

	return &GetPlatformSourceHandler{
		db: db,
	}, nil
}

func (h *GetPlatformSourceHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	platformId := event.PathParameters["platformId"]
	platformSourceId := event.PathParameters["platformSourceId"]
	
	if platformId == "" {
		return response.BadRequest("Platform ID is required"), nil
	}
	if platformSourceId == "" {
		return response.BadRequest("Platform Source ID is required"), nil
	}

	log.Printf("Get platform source request: platform=%s, source=%s", platformId, platformSourceId)

	// Add prefixes if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}
	if len(platformSourceId) < 17 || platformSourceId[:17] != "platform-source:" {
		platformSourceId = "platform-source:" + platformSourceId
	}

	// Get table name from environment
	tableName := os.Getenv("PLATFORM_SOURCES_TABLE")
	if tableName == "" {
		tableName = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platform-sources"
	}

	// Get platform source
	key := map[string]*dynamodb.AttributeValue{
		"platformSourceId": {S: &platformSourceId},
	}

	var platformSource types.PlatformSource
	err := h.db.GetItem(tableName, key, &platformSource)
	if err != nil {
		log.Printf("Failed to get platform source %s: %v", platformSourceId, err)
		if err.Error() == "item not found" {
			return response.NotFound("Platform source not found"), nil
		}
		return response.InternalServerError("Failed to get platform source"), nil
	}

	// Verify the platform source belongs to the requested platform
	if platformSource.PlatformID != platformId {
		return response.NotFound("Platform source not found for this platform"), nil
	}

	return response.Success(platformSource), nil
}

func main() {
	handler, err := NewGetPlatformSourceHandler()
	if err != nil {
		log.Fatalf("Failed to create get platform source handler: %v", err)
	}

	lambda.Start(handler.Handle)
}