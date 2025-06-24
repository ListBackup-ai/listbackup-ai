package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2/types"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/aws"

	"github.com/listbackup/api/internal/middleware"
	"github.com/listbackup/api/internal/services"
	customTypes "github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

var (
	domainService    *services.DomainService
	apiGatewayClient *apigatewayv2.Client
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("unable to load SDK config: %v", err))
	}

	dbClient := dynamodb.NewFromConfig(cfg)
	apiGatewayClient = apigatewayv2.NewFromConfig(cfg)

	domainsTable := os.Getenv("DOMAINS_TABLE")
	brandingTable := os.Getenv("BRANDING_TABLE")
	verificationTable := os.Getenv("DOMAIN_VERIFICATION_TABLE")

	domainService = services.NewDomainService(
		dbClient,
		nil, // ACM not needed
		nil, // Route53 not needed
		nil, // S3 not needed
		domainsTable,
		brandingTable,
		verificationTable,
		"", // hostedZoneID not needed
	)
}

type SetupCustomDomainResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	ApiMappingId string `json:"apiMappingId,omitempty"`
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

	// Get domain
	domain, err := domainService.GetDomain(ctx, domainID, authContext.AccountID)
	if err != nil {
		return response.Error(404, "Domain not found", err)
	}

	// Check if domain is verified
	if domain.VerificationStatus != "verified" {
		return response.Error(400, "Domain must be verified before activation", nil)
	}

	// Get API Gateway ID
	apiGatewayId := os.Getenv("API_GATEWAY_REST_API_ID")
	if apiGatewayId == "" {
		// Try to get from the request context
		if request.RequestContext.APIID != "" {
			apiGatewayId = request.RequestContext.APIID
		} else {
			return response.Error(500, "API Gateway ID not configured", nil)
		}
	}

	// Create custom domain in API Gateway
	createDomainInput := &apigatewayv2.CreateDomainNameInput{
		DomainName: aws.String(domain.DomainName),
		DomainNameConfigurations: []types.DomainNameConfiguration{
			{
				CertificateArn: aws.String(domain.CertificateARN),
				EndpointType:   types.EndpointTypeRegional,
				SecurityPolicy: types.SecurityPolicyTls12,
			},
		},
		Tags: map[string]string{
			"AccountId": authContext.AccountID,
			"DomainId":  domainID,
			"Stage":     os.Getenv("STAGE"),
		},
	}

	createDomainOutput, err := apiGatewayClient.CreateDomainName(ctx, createDomainInput)
	if err != nil {
		// Check if domain already exists
		if err.Error() != "" {
			// Try to get existing domain
			getDomainOutput, getErr := apiGatewayClient.GetDomainName(ctx, &apigatewayv2.GetDomainNameInput{
				DomainName: aws.String(domain.DomainName),
			})
			if getErr == nil {
				createDomainOutput = &apigatewayv2.CreateDomainNameOutput{
					ApiMappingSelectionExpression: getDomainOutput.ApiMappingSelectionExpression,
					DomainName:                    getDomainOutput.DomainName,
					DomainNameConfigurations:      getDomainOutput.DomainNameConfigurations,
				}
			} else {
				return response.Error(500, "Failed to create custom domain", err)
			}
		}
	}

	// Create API mapping
	stage := os.Getenv("STAGE")
	if stage == "" {
		stage = "main"
	}

	createMappingInput := &apigatewayv2.CreateApiMappingInput{
		ApiId:      aws.String(apiGatewayId),
		DomainName: aws.String(domain.DomainName),
		Stage:      aws.String(stage),
	}

	mappingOutput, err := apiGatewayClient.CreateApiMapping(ctx, createMappingInput)
	if err != nil {
		// Mapping might already exist, which is ok
		fmt.Printf("Warning: Failed to create API mapping: %v\n", err)
	}

	// Update domain status to active
	updateReq := customTypes.UpdateDomainRequest{
		Status: aws.String("active"),
	}
	if _, err := domainService.UpdateDomain(ctx, domainID, authContext.AccountID, authContext.UserID, updateReq); err != nil {
		fmt.Printf("Warning: Failed to update domain status: %v\n", err)
	}

	resp := SetupCustomDomainResponse{
		Success:      true,
		Message:      fmt.Sprintf("Custom domain %s activated successfully", domain.DomainName),
		ApiMappingId: aws.StringValue(mappingOutput.ApiMappingId),
	}

	return response.Success(resp)
}

func main() {
	lambda.Start(handler)
}