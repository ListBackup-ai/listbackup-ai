package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"

	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

var (
	domainService   *services.DomainService
	brandingService *services.BrandingService
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("unable to load SDK config: %v", err))
	}

	dbClient := dynamodb.NewFromConfig(cfg)

	domainsTable := os.Getenv("DOMAINS_TABLE")
	brandingTable := os.Getenv("BRANDING_TABLE")
	verificationTable := os.Getenv("DOMAIN_VERIFICATION_TABLE")
	brandsS3Bucket := os.Getenv("BRANDS_S3_BUCKET")

	domainService = services.NewDomainService(
		dbClient,
		nil, // ACM not needed
		nil, // Route53 not needed
		nil, // S3 not needed for domain lookup
		domainsTable,
		brandingTable,
		verificationTable,
		"", // hostedZoneID not needed
	)

	brandingService = services.NewBrandingService(
		dbClient,
		nil, // S3 not used in base64 mode
		brandingTable,
		brandsS3Bucket,
	)
}

type GetBrandingByDomainResponse struct {
	Domain   *types.Domain   `json:"domain,omitempty"`
	Branding *types.Branding `json:"branding,omitempty"`
	Default  bool            `json:"default"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// This is a PUBLIC endpoint - no auth required
	// Get domain from query parameter or header
	domainName := request.QueryStringParameters["domain"]
	if domainName == "" {
		// Try to get from Referer header
		referer := request.Headers["Referer"]
		if referer != "" {
			// Extract domain from referer
			domainName = extractDomainFromURL(referer)
		}
	}
	
	// If still no domain, try Host header
	if domainName == "" {
		domainName = request.Headers["Host"]
	}

	if domainName == "" {
		return response.Error(400, "Domain parameter is required", nil)
	}

	// Sanitize domain
	domainName = services.SanitizeDomain(domainName)

	// Check if this is a protected/system domain
	if services.IsProtectedDomain(domainName) {
		// Return default branding for system domains
		return response.Success(GetBrandingByDomainResponse{
			Default: true,
		})
	}

	// Look up domain
	domain, err := domainService.GetDomainByName(ctx, domainName)
	if err != nil {
		// Domain not found, return default branding
		return response.Success(GetBrandingByDomainResponse{
			Default: true,
		})
	}

	// Check if domain is active
	if domain.Status != "active" && domain.Status != "verified" {
		// Domain not active, return default branding
		return response.Success(GetBrandingByDomainResponse{
			Default: true,
		})
	}

	// Get branding if specified
	var branding *types.Branding
	if domain.BrandingID != "" {
		// Note: We can't verify account ownership in a public endpoint
		// So we need a different method to get branding
		branding, err = brandingService.GetBrandingPublic(ctx, domain.BrandingID)
		if err != nil {
			// Branding not found, return domain without branding
			return response.Success(GetBrandingByDomainResponse{
				Domain:  domain,
				Default: false,
			})
		}
	}

	// Return domain and branding
	return response.Success(GetBrandingByDomainResponse{
		Domain:   domain,
		Branding: branding,
		Default:  false,
	})
}

func extractDomainFromURL(url string) string {
	// Remove protocol
	url = strings.TrimPrefix(url, "http://")
	url = strings.TrimPrefix(url, "https://")
	
	// Get domain part (before first /)
	if idx := strings.Index(url, "/"); idx != -1 {
		url = url[:idx]
	}
	
	// Remove port if present
	if idx := strings.Index(url, ":"); idx != -1 {
		url = url[:idx]
	}
	
	return url
}

func main() {
	lambda.Start(handler)
}