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

type ListDataHandler struct {
	db *database.DynamoDBClient
}

func NewListDataHandler(ctx context.Context) (*ListDataHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create DynamoDB client: %v", err)
	}

	return &ListDataHandler{db: db}, nil
}

func (h *ListDataHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	accountID := "account:default"
	log.Printf("List data request for accountId: %s", accountID)
	
	// Query files by accountId
	accountIDAttr, err := attributevalue.Marshal(accountID)
	if err != nil {
		log.Printf("Failed to marshal accountID: %v", err)
		return response.InternalServerError("Failed to process request"), nil
	}
	
	var fileList []apitypes.File
	err = h.db.Query(ctx, database.FilesTable, "accountId = :accountId", map[string]types.AttributeValue{
		":accountId": accountIDAttr,
	}, &fileList)
	
	// If query fails, return empty list for now
	if err != nil {
		log.Printf("Query failed, returning empty list: %v", err)
		fileList = []apitypes.File{}
	}
	
	// Strip prefixes for API response
	for i := range fileList {
		if strings.HasPrefix(fileList[i].FileID, "file:") {
			fileList[i].FileID = strings.TrimPrefix(fileList[i].FileID, "file:")
		}
		if strings.HasPrefix(fileList[i].AccountID, "account:") {
			fileList[i].AccountID = strings.TrimPrefix(fileList[i].AccountID, "account:")
		}
		if strings.HasPrefix(fileList[i].SourceID, "source:") {
			fileList[i].SourceID = strings.TrimPrefix(fileList[i].SourceID, "source:")
		}
		if strings.HasPrefix(fileList[i].JobID, "job:") {
			fileList[i].JobID = strings.TrimPrefix(fileList[i].JobID, "job:")
		}
	}
	
	return response.Success(map[string]interface{}{
		"files": fileList,
		"total": len(fileList),
	}), nil
}

func main() {
	handler, err := NewListDataHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create list data handler: %v", err)
	}

	lambda.Start(handler.Handle)
}