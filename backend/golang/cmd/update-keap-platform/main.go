package main

import (
	"context"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
)

func main() {
	ctx := context.Background()
	
	// Initialize DynamoDB client
	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create DynamoDB client: %v", err)
	}

	// Get existing Keap platform
	key := map[string]types.AttributeValue{
		"platformId": &types.AttributeValueMemberS{Value: "platform:keap"},
	}
	
	var platform apitypes.Platform
	err = db.GetItem(ctx, database.PlatformsTable, key, &platform)
	if err != nil {
		log.Fatalf("Failed to get Keap platform: %v", err)
	}

	log.Printf("Current Keap platform authType: %s", platform.APIConfig.AuthType)

	// Update to support API key authentication  
	platform.APIConfig.AuthType = "apikey"
	platform.UpdatedAt = time.Now()

	// Save updated platform
	err = db.PutItem(ctx, database.PlatformsTable, platform)
	if err != nil {
		log.Fatalf("Failed to update Keap platform: %v", err)
	}

	log.Printf("Successfully updated Keap platform to support API key authentication")
}