package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/listbackup/api/internal/platformsdb"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type GetPlatformHandler struct {
	db *platformsdb.Client
}

func NewGetPlatformHandler() (*GetPlatformHandler, error) {
	db, err := platformsdb.NewClient()
	if err != nil {
		return nil, err
	}

	return &GetPlatformHandler{
		db: db,
	}, nil
}

func (h *GetPlatformHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	platformId := event.PathParameters["platformId"]
	if platformId == "" {
		return response.BadRequest("Platform ID is required"), nil
	}

	log.Printf("Get platform request: %s", platformId)

	// Add platform: prefix if not present
	if len(platformId) < 9 || platformId[:9] != "platform:" {
		platformId = "platform:" + platformId
	}

	// Get table name from environment
	tableName := os.Getenv("PLATFORMS_TABLE")
	if tableName == "" {
		tableName = os.Getenv("DYNAMODB_TABLE_PREFIX") + "-platforms"
	}

	// Get platform
	key := map[string]*dynamodb.AttributeValue{
		"platformId": {S: &platformId},
	}

	var platform apitypes.Platform
	err := h.db.GetItem(tableName, key, &platform)
	if err != nil {
		log.Printf("Failed to get platform %s: %v", platformId, err)
		if err.Error() == "item not found" {
			return response.NotFound("Platform not found"), nil
		}
		return response.InternalServerError("Failed to get platform"), nil
	}

	// Remove sensitive OAuth client secrets from response
	if platform.OAuth != nil {
		platform.OAuth = &apitypes.OAuthConfiguration{
			AuthURL:      platform.OAuth.AuthURL,
			Scopes:       platform.OAuth.Scopes,
			ResponseType: platform.OAuth.ResponseType,
		}
	}

	return response.Success(platform), nil
}

func main() {
	handler, err := NewGetPlatformHandler()
	if err != nil {
		log.Fatalf("Failed to create get platform handler: %v", err)
	}

	lambda.Start(handler.Handle)
}