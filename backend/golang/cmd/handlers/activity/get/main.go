package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type GetActivityHandler struct {
	db *database.DynamoDBClient
}

func NewGetActivityHandler(ctx context.Context) (*GetActivityHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create DynamoDB client: %v", err)
	}

	return &GetActivityHandler{db: db}, nil
}

func (h *GetActivityHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	accountID := "account:default"
	log.Printf("Get activity request for accountId: %s", accountID)
	
	// Query activity by accountId
	accountIDAttr, err := attributevalue.Marshal(accountID)
	if err != nil {
		log.Printf("Failed to marshal accountID: %v", err)
		return response.InternalServerError("Failed to process request"), nil
	}
	
	var activityList []apitypes.Activity
	err = h.db.Query(ctx, database.ActivityTable, "accountId = :accountId", map[string]types.AttributeValue{
		":accountId": accountIDAttr,
	}, &activityList)
	
	// If query fails, return empty list for now
	if err != nil {
		log.Printf("Query failed, returning empty list: %v", err)
		activityList = []apitypes.Activity{}
	}
	
	// Strip prefixes for API response
	for i := range activityList {
		if strings.HasPrefix(activityList[i].EventID, "activity:") {
			activityList[i].EventID = strings.TrimPrefix(activityList[i].EventID, "activity:")
		}
		if strings.HasPrefix(activityList[i].AccountID, "account:") {
			activityList[i].AccountID = strings.TrimPrefix(activityList[i].AccountID, "account:")
		}
		if strings.HasPrefix(activityList[i].UserID, "user:") {
			activityList[i].UserID = strings.TrimPrefix(activityList[i].UserID, "user:")
		}
	}
	
	return response.Success(map[string]interface{}{
		"activities": activityList,
		"total":      len(activityList),
	}), nil
}

func main() {
	handler, err := NewGetActivityHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create get activity handler: %v", err)
	}

	lambda.Start(handler.Handle)
}