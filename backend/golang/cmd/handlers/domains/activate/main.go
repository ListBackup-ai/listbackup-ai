package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/acm"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/route53"

	"github.com/listbackup/api/internal/middleware"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

var (
	domainService         *services.DomainService
	apiGatewayDomainService *services.APIGatewayDomainService
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("unable to load SDK config: %v", err))
	}

	dbClient := dynamodb.NewFromConfig(cfg)
	apiGatewayClient := apigateway.NewFromConfig(cfg)
	acmClient := acm.NewFromConfig(cfg)
	route53Client := route53.NewFromConfig(cfg)

	domainsTable := os.Getenv("DOMAINS_TABLE")
	brandingTable := os.Getenv("BRANDING_TABLE")
	verificationTable := os.Getenv("DOMAIN_VERIFICATION_TABLE")
	
	// Get API Gateway configuration
	apiId := os.Getenv("API_GATEWAY_ID")
	if apiId == "" {
		apiId = "9sj3qz07ie" // Your API ID
	}
	stage := os.Getenv("STAGE")
	if stage == "" {
		stage = "main"
	}
	hostedZoneId := os.Getenv("HOSTED_ZONE_ID")
	if hostedZoneId == "" {
		hostedZoneId = "Z01040453V93CTQT4QFNW" // Your hosted zone
	}

	domainService = services.NewDomainService(
		dbClient,
		acmClient,
		route53Client,
		nil, // S3 not needed
		domainsTable,
		brandingTable,
		verificationTable,
		hostedZoneId,
	)

	apiGatewayDomainService = services.NewAPIGatewayDomainService(
		apiGatewayClient,
		acmClient,
		route53Client,
		apiId,
		stage,
		hostedZoneId,
	)
}

type ActivateDomainRequest struct {
	RequestCertificate bool `json:"requestCertificate"`
}

type ActivateDomainResponse struct {
	Success        bool                       `json:"success"`
	Message        string                     `json:"message"`
	DomainStatus   *services.CustomDomainResult `json:"domainStatus,omitempty"`
	DNSInstructions *DNSInstructions          `json:"dnsInstructions,omitempty"`
}

type DNSInstructions struct {
	RecordType  string `json:"recordType"`
	RecordName  string `json:"recordName"`
	RecordValue string `json:"recordValue"`
	Purpose     string `json:"purpose"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract auth context
	authContext, err := middleware.GetAuthContext(request)
	if err != nil {
		return response.Error(401, "Unauthorized", err)
	}

	// Get domainId from path
	domainID := request.PathParameters["domainId"]
	if domainID == "" {
		return response.Error(400, "Domain ID is required", nil)
	}

	// Parse request
	var req ActivateDomainRequest
	if request.Body != "" {
		if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
			return response.Error(400, "Invalid request body", err)
		}
	}

	// Get domain
	domain, err := domainService.GetDomain(ctx, domainID, authContext.AccountID)
	if err != nil {
		return response.Error(404, "Domain not found", err)
	}

	// Check if domain is verified
	if domain.VerificationStatus != "verified" {
		return response.Error(400, "Domain must be verified before activation", nil)
	}

	// Handle certificate if needed
	certificateArn := domain.CertificateARN
	if certificateArn == "" && req.RequestCertificate {
		// Request a new certificate
		certArn, err := apiGatewayDomainService.RequestCertificate(ctx, domain.DomainName)
		if err != nil {
			return response.Error(500, "Failed to request certificate", err)
		}
		certificateArn = certArn

		// Update domain with certificate ARN
		updateReq := types.UpdateDomainRequest{
			CertificateARN: &certificateArn,
		}
		if _, err := domainService.UpdateDomain(ctx, domainID, authContext.AccountID, authContext.UserID, updateReq); err != nil {
			fmt.Printf("Warning: Failed to update domain with certificate ARN: %v\n", err)
		}
	}

	if certificateArn == "" {
		// No certificate available
		resp := ActivateDomainResponse{
			Success: false,
			Message: "No SSL certificate available. Please request a certificate first or provide one.",
		}
		return response.Success(resp)
	}

	// Add custom domain to API Gateway
	domainResult, err := apiGatewayDomainService.AddCustomDomain(ctx, domain.DomainName, certificateArn)
	if err != nil {
		return response.Error(500, "Failed to add custom domain", err)
	}

	// Update domain status
	newStatus := "active"
	updateReq := types.UpdateDomainRequest{
		Status: &newStatus,
	}
	if _, err := domainService.UpdateDomain(ctx, domainID, authContext.AccountID, authContext.UserID, updateReq); err != nil {
		fmt.Printf("Warning: Failed to update domain status: %v\n", err)
	}

	// Prepare response
	resp := ActivateDomainResponse{
		Success:      true,
		Message:      fmt.Sprintf("Domain %s activated successfully", domain.DomainName),
		DomainStatus: domainResult,
		DNSInstructions: &DNSInstructions{
			RecordType:  "CNAME",
			RecordName:  domain.DomainName,
			RecordValue: domainResult.DNSTarget,
			Purpose:     "Point your domain to ListBackup API Gateway",
		},
	}

	return response.Success(resp)
}

func main() {
	lambda.Start(handler)
}