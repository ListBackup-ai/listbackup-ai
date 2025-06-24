package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"

	"github.com/listbackup/api/internal/middleware"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

var (
	brandingService *services.BrandingService
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("unable to load SDK config: %v", err))
	}

	dbClient := dynamodb.NewFromConfig(cfg)
	brandingTable := os.Getenv("BRANDING_TABLE")

	brandingService = services.NewBrandingService(dbClient, brandingTable)
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract auth context
	authContext, err := middleware.GetAuthContext(request)
	if err != nil {
		return response.Error(401, "Unauthorized", err)
	}

	// Get brandingId from path
	brandingID := request.PathParameters["brandingId"]
	if brandingID == "" {
		return response.Error(400, "Branding ID is required", nil)
	}

	// Parse request body
	var req types.UploadLogoRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return response.Error(400, "Invalid request body", err)
	}

	// Validate request
	if req.ImageData == "" {
		return response.Error(400, "Image data is required", nil)
	}

	if req.ContentType == "" {
		return response.Error(400, "Content type is required", nil)
	}

	if req.LogoType == "" {
		req.LogoType = "full" // Default to full logo
	}

	if req.Theme == "" {
		req.Theme = "light" // Default to light theme
	}

	// Validate logo type
	validTypes := []string{"full", "compact", "square"}
	validType := false
	for _, t := range validTypes {
		if req.LogoType == t {
			validType = true
			break
		}
	}
	if !validType {
		return response.Error(400, "Invalid logo type. Must be: full, compact, or square", nil)
	}

	// Validate theme
	validThemes := []string{"light", "dark"}
	validTheme := false
	for _, t := range validThemes {
		if req.Theme == t {
			validTheme = true
			break
		}
	}
	if !validTheme {
		return response.Error(400, "Invalid theme. Must be: light or dark", nil)
	}

	// Decode base64 image data
	imageData, err := base64.StdEncoding.DecodeString(req.ImageData)
	if err != nil {
		return response.Error(400, "Invalid base64 image data", err)
	}

	// Validate image data
	if err := brandingService.ValidateImageData(imageData, req.ContentType); err != nil {
		return response.Error(400, err.Error(), nil)
	}

	// Upload logo
	if err := brandingService.UploadLogo(ctx, brandingID, authContext.AccountID, imageData, req.ContentType, req.LogoType, req.Theme); err != nil {
		return response.Error(500, "Failed to upload logo", err)
	}

	// Get updated branding
	branding, err := brandingService.GetBranding(ctx, brandingID, authContext.AccountID)
	if err != nil {
		return response.Error(500, "Failed to retrieve updated branding", err)
	}

	return response.Success(types.ImageUploadResponse{
		Success: true,
		Message: "Logo uploaded successfully",
	})
}

func main() {
	lambda.Start(handler)
}