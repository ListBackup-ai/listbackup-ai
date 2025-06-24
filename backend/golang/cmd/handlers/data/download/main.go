package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/listbackup/api/internal/database"
	apitypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

type DownloadDataHandler struct {
	db       *database.DynamoDBClient
	s3Client *s3.Client
	s3Bucket string
}

func NewDownloadDataHandler(ctx context.Context) (*DownloadDataHandler, error) {
	db, err := database.NewDynamoDBClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create DynamoDB client: %v", err)
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %v", err)
	}

	s3Client := s3.NewFromConfig(cfg)
	s3Bucket := os.Getenv("S3_BUCKET")
	if s3Bucket == "" {
		s3Bucket = "listbackup-data-main" // fallback
	}

	return &DownloadDataHandler{
		db:       db,
		s3Client: s3Client,
		s3Bucket: s3Bucket,
	}, nil
}

func (h *DownloadDataHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	accountID := "account:default"
	userID := "user:default"
	log.Printf("Download data request for accountId: %s", accountID)
	
	// Get fileId from path parameters
	fileID := event.PathParameters["fileId"]
	if fileID == "" {
		return response.BadRequest("File ID is required"), nil
	}
	
	// Add file: prefix for DynamoDB lookup
	fullFileID := "file:" + fileID
	
	// Get file metadata from DynamoDB
	fileIDAttr, err := attributevalue.Marshal(fullFileID)
	if err != nil {
		log.Printf("Failed to marshal fileID: %v", err)
		return response.InternalServerError("Failed to process request"), nil
	}
	
	var file apitypes.File
	err = h.db.GetItem(ctx, database.FilesTable, map[string]types.AttributeValue{
		"fileId": fileIDAttr,
	}, &file)
	if err != nil {
		log.Printf("Failed to get file: %v", err)
		return response.NotFound("File not found"), nil
	}
	
	// Verify file belongs to the authenticated account
	if file.AccountID != accountID {
		return response.NotFound("File not found"), nil
	}
	
	// Generate presigned URL for S3 download
	presignClient := s3.NewPresignClient(h.s3Client)
	request, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(h.s3Bucket),
		Key:    aws.String(file.S3Key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(3600 * time.Second) // 1 hour
	})
	if err != nil {
		log.Printf("Failed to generate presigned URL: %v", err)
		return response.InternalServerError("Failed to generate download URL"), nil
	}
	
	// Log download activity
	err = h.logActivity(ctx, accountID, userID, "data", "download_success", fmt.Sprintf("Downloaded file: %s", file.Path))
	if err != nil {
		log.Printf("Failed to log activity: %v", err)
	}
	
	return response.Success(map[string]interface{}{
		"downloadUrl": request.URL,
		"expiresIn":   3600,
		"fileName":    file.Path,
		"size":        file.Size,
		"contentType": file.ContentType,
	}), nil
}

func (h *DownloadDataHandler) logActivity(ctx context.Context, accountID, userID, activityType, action, message string) error {
	eventID := fmt.Sprintf("activity:%d:%s", time.Now().UnixNano()/1000000, generateRandomString(9))
	timestamp := time.Now().UnixNano() / 1000000 // Unix timestamp in milliseconds
	ttl := time.Now().Add(90 * 24 * time.Hour).Unix()

	activity := apitypes.Activity{
		EventID:   eventID,
		AccountID: accountID,
		UserID:    userID,
		Type:      activityType,
		Action:    action,
		Status:    "success",
		Message:   message,
		Timestamp: timestamp,
		TTL:       ttl,
	}

	return h.db.PutItem(ctx, database.ActivityTable, activity)
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

func main() {
	handler, err := NewDownloadDataHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create download data handler: %v", err)
	}

	lambda.Start(handler.Handle)
}