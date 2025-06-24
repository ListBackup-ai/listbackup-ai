package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type GetPlatformSourceHandler struct {
	db *database.DynamoDBClient
}

func NewGetPlatformSourceHandler(ctx context.Context) (*GetPlatformSourceHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
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

	// Add prefixes if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}
	if len(platformSourceId) < 16 || platformSourceId[:16] != "platform-source:" {
		platformSourceId = "platform-source:" + platformSourceId
	}

	log.Printf("Get platform source request: %s from platform %s", platformSourceId, platformId)

	// Get platform source
	key := map[string]types.AttributeValue{
		"platformSourceId": &types.AttributeValueMemberS{Value: platformSourceId},
	}

	var platformSource apitypes.PlatformSource
	err := h.db.GetItem(ctx, database.PlatformSourcesTable, key, &platformSource)
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
	handler, err := NewGetPlatformSourceHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create get platform source handler: %v", err)
	}

	lambda.Start(handler.Handle)
}