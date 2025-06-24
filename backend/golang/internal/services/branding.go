package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	
	"github.com/listbackup/api/internal/database"
	customTypes "github.com/listbackup/api/internal/types"
)

// Image size constraints
const (
	LogoFullMaxWidth    = 400
	LogoFullMaxHeight   = 200
	LogoCompactSize     = 48  // Square for collapsed sidebar
	LogoSquareSize      = 200 // Square version for various uses
	FaviconSize         = 32
	MaxImageSizeKB      = 500 // 500KB max
)

type BrandingService struct {
	db            *dynamodb.Client
	brandingTable string
}

func NewBrandingService(db *dynamodb.Client, brandingTable string) *BrandingService {
	return &BrandingService{
		db:            db,
		brandingTable: brandingTable,
	}
}

// AddBranding creates a new branding configuration
func (s *BrandingService) AddBranding(ctx context.Context, accountID, userID string, req customTypes.AddBrandingRequest) (*customTypes.Branding, error) {
	brandingID := uuid.New().String()

	// If this is set as default, unset other defaults
	if req.IsDefault {
		if err := s.unsetDefaultBranding(ctx, accountID); err != nil {
			return nil, fmt.Errorf("failed to unset existing default: %w", err)
		}
	}

	branding := customTypes.Branding{
		BrandingID:    brandingID,
		AccountID:     accountID,
		Name:          req.Name,
		Description:   req.Description,
		Logos:         customTypes.BrandLogos{},
		Colors:        req.Colors,
		Fonts:         req.Fonts,
		CustomCSS:     req.CustomCSS,
		EmailSettings: req.EmailSettings,
		SocialLinks:   req.SocialLinks,
		Settings:      req.Settings,
		CreatedAt:     time.Now(),
		CreatedBy:     userID,
		UpdatedAt:     time.Now(),
		UpdatedBy:     userID,
		IsDefault:     req.IsDefault,
	}

	if err := s.saveBranding(ctx, &branding); err != nil {
		return nil, fmt.Errorf("failed to save branding: %w", err)
	}

	return &branding, nil
}

// GetBranding retrieves a branding configuration
func (s *BrandingService) GetBranding(ctx context.Context, brandingID, accountID string) (*customTypes.Branding, error) {
	result, err := s.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.brandingTable),
		Key: map[string]types.AttributeValue{
			"brandingId": &types.AttributeValueMemberS{Value: brandingID},
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get branding: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("branding not found")
	}

	var branding customTypes.Branding
	if err := database.UnmarshalDynamoDBItem(result.Item, &branding); err != nil {
		return nil, fmt.Errorf("failed to unmarshal branding: %w", err)
	}

	// Verify ownership
	if branding.AccountID != accountID {
		return nil, fmt.Errorf("unauthorized")
	}

	return &branding, nil
}

// GetBrandingPublic retrieves branding without auth check (for public endpoints)
func (s *BrandingService) GetBrandingPublic(ctx context.Context, brandingID string) (*customTypes.Branding, error) {
	result, err := s.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.brandingTable),
		Key: map[string]types.AttributeValue{
			"brandingId": &types.AttributeValueMemberS{Value: brandingID},
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get branding: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("branding not found")
	}

	var branding customTypes.Branding
	if err := database.UnmarshalDynamoDBItem(result.Item, &branding); err != nil {
		return nil, fmt.Errorf("failed to unmarshal branding: %w", err)
	}

	// No ownership check for public endpoint
	return &branding, nil
}

// ListBranding lists all branding configurations for an account
func (s *BrandingService) ListBranding(ctx context.Context, accountID string) ([]customTypes.Branding, error) {
	result, err := s.db.Query(ctx, &dynamodb.QueryInput{
		TableName: aws.String(s.brandingTable),
		IndexName: aws.String("accountId-index"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":accountId": &types.AttributeValueMemberS{Value: accountID},
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to list branding: %w", err)
	}

	brandings := make([]customTypes.Branding, 0, len(result.Items))
	for _, item := range result.Items {
		var branding customTypes.Branding
		if err := database.UnmarshalDynamoDBItem(item, &branding); err != nil {
			continue
		}
		brandings = append(brandings, branding)
	}

	return brandings, nil
}

// UpdateBranding updates a branding configuration
func (s *BrandingService) UpdateBranding(ctx context.Context, brandingID, accountID, userID string, req customTypes.UpdateBrandingRequest) (*customTypes.Branding, error) {
	branding, err := s.GetBranding(ctx, brandingID, accountID)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Name != "" {
		branding.Name = req.Name
	}
	if req.Description != "" {
		branding.Description = req.Description
	}
	if req.Colors != nil {
		branding.Colors = *req.Colors
	}
	if req.Fonts != nil {
		branding.Fonts = *req.Fonts
	}
	if req.CustomCSS != "" {
		branding.CustomCSS = req.CustomCSS
	}
	if req.EmailSettings != nil {
		branding.EmailSettings = *req.EmailSettings
	}
	if req.SocialLinks != nil {
		branding.SocialLinks = req.SocialLinks
	}
	if req.Settings != nil {
		branding.Settings = *req.Settings
	}

	branding.UpdatedAt = time.Now()
	branding.UpdatedBy = userID

	if err := s.saveBranding(ctx, branding); err != nil {
		return nil, fmt.Errorf("failed to update branding: %w", err)
	}

	return branding, nil
}

// UploadLogo processes and stores a logo image
func (s *BrandingService) UploadLogo(ctx context.Context, brandingID, accountID string, imageData []byte, contentType, logoType, theme string) error {
	branding, err := s.GetBranding(ctx, brandingID, accountID)
	if err != nil {
		return err
	}

	// Determine image dimensions based on logo type
	var maxWidth, maxHeight int
	var square bool
	
	switch logoType {
	case "full":
		maxWidth = LogoFullMaxWidth
		maxHeight = LogoFullMaxHeight
		square = false
	case "compact":
		maxWidth = LogoCompactSize
		maxHeight = LogoCompactSize
		square = true
	case "square":
		maxWidth = LogoSquareSize
		maxHeight = LogoSquareSize
		square = true
	default:
		return fmt.Errorf("invalid logo type: %s", logoType)
	}

	// Process the image
	processedImage, err := s.processImage(imageData, contentType, maxWidth, maxHeight, square)
	if err != nil {
		return fmt.Errorf("failed to process logo: %w", err)
	}

	// Convert to base64
	base64Image := base64.StdEncoding.EncodeToString(processedImage)
	
	// Store with data URI format
	dataURI := fmt.Sprintf("data:%s;base64,%s", contentType, base64Image)
	
	// Update branding based on theme and type
	switch theme {
	case "light":
		switch logoType {
		case "full":
			branding.Logos.Light.Full = dataURI
		case "compact":
			branding.Logos.Light.Compact = dataURI
		case "square":
			branding.Logos.Light.Square = dataURI
		}
	case "dark":
		switch logoType {
		case "full":
			branding.Logos.Dark.Full = dataURI
		case "compact":
			branding.Logos.Dark.Compact = dataURI
		case "square":
			branding.Logos.Dark.Square = dataURI
		}
	default:
		return fmt.Errorf("invalid theme: %s", theme)
	}
	
	branding.UpdatedAt = time.Now()
	return s.saveBranding(ctx, branding)
}

// UploadFavicon processes and stores a favicon image
func (s *BrandingService) UploadFavicon(ctx context.Context, brandingID, accountID string, imageData []byte, contentType string) error {
	branding, err := s.GetBranding(ctx, brandingID, accountID)
	if err != nil {
		return err
	}

	// Process the image (favicon needs to be square)
	processedImage, err := s.processImage(imageData, contentType, FaviconSize, FaviconSize, true)
	if err != nil {
		return fmt.Errorf("failed to process favicon: %w", err)
	}

	// Convert to base64
	base64Image := base64.StdEncoding.EncodeToString(processedImage)
	
	// Store with data URI format
	dataURI := fmt.Sprintf("data:%s;base64,%s", contentType, base64Image)
	
	// Update branding
	branding.FaviconURL = dataURI
	branding.UpdatedAt = time.Now()

	return s.saveBranding(ctx, branding)
}

// Helper methods

func (s *BrandingService) processImage(imageData []byte, contentType string, maxWidth, maxHeight int, square bool) ([]byte, error) {
	// Check size limit
	if len(imageData) > MaxImageSizeKB*1024 {
		return nil, fmt.Errorf("image size exceeds %dKB limit", MaxImageSizeKB)
	}

	// Decode image
	var img image.Image
	var err error
	
	reader := bytes.NewReader(imageData)
	
	switch contentType {
	case "image/jpeg", "image/jpg":
		img, err = jpeg.Decode(reader)
	case "image/png":
		img, err = png.Decode(reader)
	default:
		return nil, fmt.Errorf("unsupported image format: %s", contentType)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Process image
	if square {
		// For favicon, crop to square first
		bounds := img.Bounds()
		width := bounds.Dx()
		height := bounds.Dy()
		
		if width > height {
			// Crop horizontally
			cropX := (width - height) / 2
			img = imaging.Crop(img, image.Rect(cropX, 0, cropX+height, height))
		} else if height > width {
			// Crop vertically
			cropY := (height - width) / 2
			img = imaging.Crop(img, image.Rect(0, cropY, width, cropY+width))
		}
		
		// Resize to exact size
		img = imaging.Resize(img, maxWidth, maxHeight, imaging.Lanczos)
	} else {
		// For logo, fit within bounds while maintaining aspect ratio
		img = imaging.Fit(img, maxWidth, maxHeight, imaging.Lanczos)
	}

	// Encode back to bytes
	var buf bytes.Buffer
	
	switch contentType {
	case "image/jpeg", "image/jpg":
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85})
	case "image/png":
		err = png.Encode(&buf, img)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to encode image: %w", err)
	}

	return buf.Bytes(), nil
}

func (s *BrandingService) unsetDefaultBranding(ctx context.Context, accountID string) error {
	// Find all default brandings for the account
	brandings, err := s.ListBranding(ctx, accountID)
	if err != nil {
		return err
	}

	for _, branding := range brandings {
		if branding.IsDefault {
			branding.IsDefault = false
			if err := s.saveBranding(ctx, &branding); err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *BrandingService) saveBranding(ctx context.Context, branding *customTypes.Branding) error {
	item, err := database.MarshalDynamoDBItem(branding)
	if err != nil {
		return err
	}

	_, err = s.db.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.brandingTable),
		Item:      item,
	})

	return err
}

// GetDefaultBranding gets the default branding for an account
func (s *BrandingService) GetDefaultBranding(ctx context.Context, accountID string) (*customTypes.Branding, error) {
	brandings, err := s.ListBranding(ctx, accountID)
	if err != nil {
		return nil, err
	}

	for _, branding := range brandings {
		if branding.IsDefault {
			return &branding, nil
		}
	}

	return nil, fmt.Errorf("no default branding found")
}

// ValidateImageData validates image data before processing
func (s *BrandingService) ValidateImageData(imageData []byte, contentType string) error {
	// Check if data is provided
	if len(imageData) == 0 {
		return fmt.Errorf("no image data provided")
	}

	// Check content type
	validTypes := []string{"image/jpeg", "image/jpg", "image/png"}
	valid := false
	for _, t := range validTypes {
		if strings.EqualFold(contentType, t) {
			valid = true
			break
		}
	}
	
	if !valid {
		return fmt.Errorf("invalid content type: %s", contentType)
	}

	// Check size
	if len(imageData) > MaxImageSizeKB*1024 {
		return fmt.Errorf("image size exceeds %dKB limit", MaxImageSizeKB)
	}

	return nil
}