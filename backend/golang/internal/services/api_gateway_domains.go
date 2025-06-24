package services

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/acm"
	acmTypes "github.com/aws/aws-sdk-go-v2/service/acm/types"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/apigateway/types"
	"github.com/aws/aws-sdk-go-v2/service/route53"
	route53Types "github.com/aws/aws-sdk-go-v2/service/route53/types"
)

type APIGatewayDomainService struct {
	apiGateway     *apigateway.Client
	acm            *acm.Client
	route53        *route53.Client
	apiId          string
	stage          string
	hostedZoneId   string
}

func NewAPIGatewayDomainService(
	apiGatewayClient *apigateway.Client,
	acmClient *acm.Client,
	route53Client *route53.Client,
	apiId string,
	stage string,
	hostedZoneId string,
) *APIGatewayDomainService {
	return &APIGatewayDomainService{
		apiGateway:   apiGatewayClient,
		acm:          acmClient,
		route53:      route53Client,
		apiId:        apiId,
		stage:        stage,
		hostedZoneId: hostedZoneId,
	}
}

// AddCustomDomain adds a custom domain to API Gateway
func (s *APIGatewayDomainService) AddCustomDomain(ctx context.Context, domainName string, certificateArn string) (*CustomDomainResult, error) {
	// Create custom domain in API Gateway
	createInput := &apigateway.CreateDomainNameInput{
		DomainName: aws.String(domainName),
		RegionalCertificateArn: aws.String(certificateArn),
		EndpointConfiguration: &types.EndpointConfiguration{
			Types: []types.EndpointType{types.EndpointTypeRegional},
		},
		SecurityPolicy: types.SecurityPolicyTls12,
		Tags: map[string]string{
			"Service": "listbackup",
			"Stage":   s.stage,
		},
	}

	createOutput, err := s.apiGateway.CreateDomainName(ctx, createInput)
	if err != nil {
		// Check if domain already exists
		if getOutput, getErr := s.apiGateway.GetDomainName(ctx, &apigateway.GetDomainNameInput{
			DomainName: aws.String(domainName),
		}); getErr == nil {
			createOutput = &apigateway.CreateDomainNameOutput{
				DomainName:                     getOutput.DomainName,
				RegionalDomainName:             getOutput.RegionalDomainName,
				RegionalHostedZoneId:           getOutput.RegionalHostedZoneId,
				RegionalCertificateArn:         getOutput.RegionalCertificateArn,
				DomainNameStatus:               getOutput.DomainNameStatus,
				DomainNameStatusMessage:        getOutput.DomainNameStatusMessage,
			}
		} else {
			return nil, fmt.Errorf("failed to create domain: %w", err)
		}
	}

	// Create base path mapping
	mappingInput := &apigateway.CreateBasePathMappingInput{
		DomainName: aws.String(domainName),
		RestApiId:  aws.String(s.apiId),
		Stage:      aws.String(s.stage),
	}

	if _, err := s.apiGateway.CreateBasePathMapping(ctx, mappingInput); err != nil {
		// Mapping might already exist, log but don't fail
		fmt.Printf("Warning: Failed to create base path mapping: %v\n", err)
	}

	result := &CustomDomainResult{
		DomainName:           aws.ToString(createOutput.DomainName),
		RegionalDomainName:   aws.ToString(createOutput.RegionalDomainName),
		RegionalHostedZoneId: aws.ToString(createOutput.RegionalHostedZoneId),
		Status:               string(createOutput.DomainNameStatus),
		StatusMessage:        aws.ToString(createOutput.DomainNameStatusMessage),
		DNSTarget:            aws.ToString(createOutput.RegionalDomainName),
	}

	return result, nil
}

// RemoveCustomDomain removes a custom domain from API Gateway
func (s *APIGatewayDomainService) RemoveCustomDomain(ctx context.Context, domainName string) error {
	// First remove base path mapping
	mappings, err := s.apiGateway.GetBasePathMappings(ctx, &apigateway.GetBasePathMappingsInput{
		DomainName: aws.String(domainName),
	})
	if err == nil && len(mappings.Items) > 0 {
		for _, mapping := range mappings.Items {
			if _, err := s.apiGateway.DeleteBasePathMapping(ctx, &apigateway.DeleteBasePathMappingInput{
				DomainName: aws.String(domainName),
				BasePath:   mapping.BasePath,
			}); err != nil {
				fmt.Printf("Warning: Failed to delete base path mapping: %v\n", err)
			}
		}
	}

	// Delete the domain
	_, err = s.apiGateway.DeleteDomainName(ctx, &apigateway.DeleteDomainNameInput{
		DomainName: aws.String(domainName),
	})

	return err
}

// RequestCertificate requests an ACM certificate for a domain
func (s *APIGatewayDomainService) RequestCertificate(ctx context.Context, domainName string) (string, error) {
	input := &acm.RequestCertificateInput{
		DomainName:       aws.String(domainName),
		ValidationMethod: "DNS",
		SubjectAlternativeNames: []string{
			domainName,
			fmt.Sprintf("*.%s", domainName), // Include wildcard
		},
		Tags: []acmTypes.Tag{
			{
				Key:   aws.String("Service"),
				Value: aws.String("listbackup"),
			},
			{
				Key:   aws.String("Domain"),
				Value: aws.String(domainName),
			},
		},
		Options: &acmTypes.CertificateOptions{
			CertificateTransparencyLoggingPreference: acmTypes.CertificateTransparencyLoggingPreferenceEnabled,
		},
	}

	output, err := s.acm.RequestCertificate(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to request certificate: %w", err)
	}

	return aws.ToString(output.CertificateArn), nil
}

// CreateDNSValidationRecords creates Route53 records for ACM certificate validation
func (s *APIGatewayDomainService) CreateDNSValidationRecords(ctx context.Context, certificateArn string) error {
	// Get certificate details
	cert, err := s.acm.DescribeCertificate(ctx, &acm.DescribeCertificateInput{
		CertificateArn: aws.String(certificateArn),
	})
	if err != nil {
		return fmt.Errorf("failed to describe certificate: %w", err)
	}

	// Create validation records
	for _, validation := range cert.Certificate.DomainValidationOptions {
		if validation.ResourceRecord != nil {
			changeInput := &route53.ChangeResourceRecordSetsInput{
				HostedZoneId: aws.String(s.hostedZoneId),
				ChangeBatch: &route53Types.ChangeBatch{
					Changes: []route53Types.Change{
						{
							Action: route53Types.ChangeActionCreate,
							ResourceRecordSet: &route53Types.ResourceRecordSet{
								Name: validation.ResourceRecord.Name,
								Type: route53Types.RRType(validation.ResourceRecord.Type),
								TTL:  aws.Int64(300),
								ResourceRecords: []route53Types.ResourceRecord{
									{
										Value: validation.ResourceRecord.Value,
									},
								},
							},
						},
					},
					Comment: aws.String(fmt.Sprintf("ACM validation for %s", aws.ToString(validation.DomainName))),
				},
			}

			if _, err := s.route53.ChangeResourceRecordSets(ctx, changeInput); err != nil {
				// Record might already exist
				fmt.Printf("Warning: Failed to create validation record: %v\n", err)
			}
		}
	}

	// Wait for certificate validation
	waiter := acm.NewCertificateValidatedWaiter(s.acm)
	if err := waiter.Wait(ctx, &acm.DescribeCertificateInput{
		CertificateArn: aws.String(certificateArn),
	}, 5*time.Minute); err != nil {
		return fmt.Errorf("certificate validation timeout: %w", err)
	}

	return nil
}

// GetDomainStatus gets the status of a custom domain
func (s *APIGatewayDomainService) GetDomainStatus(ctx context.Context, domainName string) (*CustomDomainResult, error) {
	output, err := s.apiGateway.GetDomainName(ctx, &apigateway.GetDomainNameInput{
		DomainName: aws.String(domainName),
	})
	if err != nil {
		return nil, err
	}

	return &CustomDomainResult{
		DomainName:           aws.ToString(output.DomainName),
		RegionalDomainName:   aws.ToString(output.RegionalDomainName),
		RegionalHostedZoneId: aws.ToString(output.RegionalHostedZoneId),
		Status:               string(output.DomainNameStatus),
		StatusMessage:        aws.ToString(output.DomainNameStatusMessage),
		DNSTarget:            aws.ToString(output.RegionalDomainName),
		CertificateArn:       aws.ToString(output.RegionalCertificateArn),
	}, nil
}

type CustomDomainResult struct {
	DomainName           string `json:"domainName"`
	RegionalDomainName   string `json:"regionalDomainName"`
	RegionalHostedZoneId string `json:"regionalHostedZoneId"`
	Status               string `json:"status"`
	StatusMessage        string `json:"statusMessage"`
	DNSTarget            string `json:"dnsTarget"`
	CertificateArn       string `json:"certificateArn,omitempty"`
}