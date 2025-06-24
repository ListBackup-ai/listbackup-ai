package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/acm"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/route53"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/google/uuid"
	
	"github.com/listbackup/api/internal/types"
)

type DomainService struct {
	db           *dynamodb.DynamoDB
	acm          *acm.ACM
	route53      *route53.Route53
	s3           *s3.S3
	domainsTable string
	brandingTable string
	verificationTable string
	hostedZoneID string
}

func NewDomainService(db *dynamodb.DynamoDB, acm *acm.ACM, route53 *route53.Route53, s3 *s3.S3, domainsTable, brandingTable, verificationTable, hostedZoneID string) *DomainService {
	return &DomainService{
		db:           db,
		acm:          acm,
		route53:      route53,
		s3:           s3,
		domainsTable: domainsTable,
		brandingTable: brandingTable,
		verificationTable: verificationTable,
		hostedZoneID: hostedZoneID,
	}
}

// AddDomain adds a new custom domain
func (s *DomainService) AddDomain(ctx context.Context, accountID, userID string, req types.AddDomainRequest) (*types.Domain, error) {
	// Sanitize domain name first
	req.DomainName = SanitizeDomain(req.DomainName)
	
	// Validate domain name (includes protection checks)
	if err := s.validateDomainName(req.DomainName); err != nil {
		return nil, err
	}

	// Check if domain already exists
	existing, err := s.GetDomainByName(ctx, req.DomainName)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("domain already exists")
	}

	// Generate domain ID
	domainID := uuid.New().String()

	// Create domain object
	domain := types.Domain{
		DomainID:        domainID,
		AccountID:       accountID,
		DomainName:      strings.ToLower(req.DomainName),
		DomainType:      req.DomainType,
		ParentDomainID:  req.ParentDomainID,
		BrandingID:      req.BrandingID,
		Status:          "pending",
		VerificationStatus: "pending",
		SSLStatus:       "pending",
		Configuration:   req.Configuration,
		CreatedAt:       time.Now(),
		CreatedBy:       userID,
		UpdatedAt:       time.Now(),
		UpdatedBy:       userID,
		DNSRecords:      []types.DNSRecord{},
	}

	// Set default API prefix if not provided
	if domain.DomainType == "api" && domain.Configuration.APIPrefix == "" {
		domain.Configuration.APIPrefix = "api"
	}

	// Save to DynamoDB
	if err := s.saveDomain(ctx, &domain); err != nil {
		return nil, fmt.Errorf("failed to save domain: %w", err)
	}

	// Create verification record
	if err := s.createVerificationRecord(ctx, &domain); err != nil {
		return nil, fmt.Errorf("failed to create verification record: %w", err)
	}

	return &domain, nil
}

// GetDomain retrieves a domain by ID
func (s *DomainService) GetDomain(ctx context.Context, domainID, accountID string) (*types.Domain, error) {
	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(s.domainsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"domainId": {
				S: aws.String(domainID),
			},
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get domain: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("domain not found")
	}

	var domain types.Domain
	if err := dynamodbattribute.UnmarshalMap(result.Item, &domain); err != nil {
		return nil, fmt.Errorf("failed to unmarshal domain: %w", err)
	}

	// Verify ownership
	if domain.AccountID != accountID {
		return nil, fmt.Errorf("unauthorized")
	}

	return &domain, nil
}

// GetDomainByName retrieves a domain by name
func (s *DomainService) GetDomainByName(ctx context.Context, domainName string) (*types.Domain, error) {
	result, err := s.db.Query(&dynamodb.QueryInput{
		TableName: aws.String(s.domainsTable),
		IndexName: aws.String("domainName-index"),
		KeyConditionExpression: aws.String("domainName = :domainName"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":domainName": {
				S: aws.String(strings.ToLower(domainName)),
			},
		},
		Limit: aws.Int64(1),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to query domain: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, fmt.Errorf("domain not found")
	}

	var domain types.Domain
	if err := dynamodbattribute.UnmarshalMap(result.Items[0], &domain); err != nil {
		return nil, fmt.Errorf("failed to unmarshal domain: %w", err)
	}

	return &domain, nil
}

// ListDomains lists all domains for an account
func (s *DomainService) ListDomains(ctx context.Context, accountID string) ([]types.Domain, error) {
	result, err := s.db.Query(&dynamodb.QueryInput{
		TableName: aws.String(s.domainsTable),
		IndexName: aws.String("accountId-index"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId": {
				S: aws.String(accountID),
			},
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to list domains: %w", err)
	}

	domains := make([]types.Domain, 0, len(result.Items))
	for _, item := range result.Items {
		var domain types.Domain
		if err := dynamodbattribute.UnmarshalMap(item, &domain); err != nil {
			continue
		}
		domains = append(domains, domain)
	}

	return domains, nil
}

// UpdateDomain updates a domain configuration
func (s *DomainService) UpdateDomain(ctx context.Context, domainID, accountID, userID string, req types.UpdateDomainRequest) (*types.Domain, error) {
	// Get existing domain
	domain, err := s.GetDomain(ctx, domainID, accountID)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.BrandingID != "" {
		domain.BrandingID = req.BrandingID
	}
	if req.Status != "" && s.isValidStatus(req.Status) {
		domain.Status = req.Status
	}
	// Update configuration if provided
	// This would need more sophisticated merging logic in production
	domain.UpdatedAt = time.Now()
	domain.UpdatedBy = userID

	// Save updated domain
	if err := s.saveDomain(ctx, domain); err != nil {
		return nil, fmt.Errorf("failed to update domain: %w", err)
	}

	return domain, nil
}

// RemoveDomain removes a domain and its associated resources
func (s *DomainService) RemoveDomain(ctx context.Context, domainID, accountID string) error {
	// Get domain to verify ownership
	domain, err := s.GetDomain(ctx, domainID, accountID)
	if err != nil {
		return err
	}
	
	// Check if domain is protected
	if IsProtectedDomain(domain.DomainName) {
		return fmt.Errorf("domain %s is protected and cannot be removed", domain.DomainName)
	}

	// TODO: Remove Route53 records
	// TODO: Delete SSL certificate
	// TODO: Update CloudFront distribution

	// Delete from DynamoDB
	_, err = s.db.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(s.domainsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"domainId": {
				S: aws.String(domainID),
			},
		},
	})

	if err != nil {
		return fmt.Errorf("failed to delete domain: %w", err)
	}

	// Delete verification record if exists
	s.deleteVerificationRecord(ctx, domainID)

	return nil
}

// VerifyDomain initiates domain verification
func (s *DomainService) VerifyDomain(ctx context.Context, domainID, accountID string) error {
	domain, err := s.GetDomain(ctx, domainID, accountID)
	if err != nil {
		return err
	}

	if domain.VerificationStatus == "verified" {
		return fmt.Errorf("domain already verified")
	}

	// Get verification record
	verification, err := s.getVerificationRecord(ctx, domainID)
	if err != nil {
		return fmt.Errorf("verification record not found")
	}

	// Check DNS record
	verified, err := s.checkDNSVerification(ctx, domain, verification)
	if err != nil {
		return fmt.Errorf("failed to check verification: %w", err)
	}

	if verified {
		// Update verification status
		verification.Status = "verified"
		now := time.Now()
		verification.VerifiedAt = &now
		s.saveVerificationRecord(ctx, verification)

		// Update domain status
		domain.VerificationStatus = "verified"
		s.saveDomain(ctx, domain)

		// Request SSL certificate
		go s.requestSSLCertificate(context.Background(), domain)
	}

	return nil
}

// RequestCertificate requests an SSL certificate for the domain
func (s *DomainService) RequestCertificate(ctx context.Context, domainID, accountID string) error {
	domain, err := s.GetDomain(ctx, domainID, accountID)
	if err != nil {
		return err
	}

	if domain.VerificationStatus != "verified" {
		return fmt.Errorf("domain must be verified first")
	}

	return s.requestSSLCertificate(ctx, domain)
}

// GetVerificationRecord returns the verification record for a domain
func (s *DomainService) GetVerificationRecord(ctx context.Context, domainID string) (*types.DomainVerification, error) {
	return s.getVerificationRecord(ctx, domainID)
}

// CreateDNSRecords creates DNS records for the domain
func (s *DomainService) CreateDNSRecords(ctx context.Context, domainID, accountID string, req types.CreateDNSRecordsRequest) error {
	domain, err := s.GetDomain(ctx, domainID, accountID)
	if err != nil {
		return err
	}

	if domain.VerificationStatus != "verified" {
		return fmt.Errorf("domain must be verified first")
	}

	// Create Route53 records
	changes := make([]*route53.Change, 0)
	for _, record := range req.Records {
		change := &route53.Change{
			Action: aws.String("CREATE"),
			ResourceRecordSet: &route53.ResourceRecordSet{
				Name: aws.String(s.buildRecordName(record.Name, domain.DomainName)),
				Type: aws.String(record.Type),
				TTL:  aws.Int64(int64(record.TTL)),
			},
		}

		// Build resource records
		resourceRecords := make([]*route53.ResourceRecord, len(record.Values))
		for i, value := range record.Values {
			resourceRecords[i] = &route53.ResourceRecord{
				Value: aws.String(value),
			}
		}
		change.ResourceRecordSet.ResourceRecords = resourceRecords

		changes = append(changes, change)
	}

	// Execute changes
	_, err = s.route53.ChangeResourceRecordSets(&route53.ChangeResourceRecordSetsInput{
		HostedZoneId: aws.String(s.hostedZoneID),
		ChangeBatch: &route53.ChangeBatch{
			Changes: changes,
			Comment: aws.String(fmt.Sprintf("DNS records for %s", domain.DomainName)),
		},
	})

	if err != nil {
		return fmt.Errorf("failed to create DNS records: %w", err)
	}

	// Update domain with DNS records
	domain.DNSRecords = append(domain.DNSRecords, req.Records...)
	s.saveDomain(ctx, domain)

	return nil
}

// Helper methods

func (s *DomainService) validateDomainName(domain string) error {
	// Sanitize the domain first
	sanitized := SanitizeDomain(domain)
	
	// Basic domain validation
	if len(sanitized) < 3 || len(sanitized) > 255 {
		return fmt.Errorf("invalid domain length")
	}
	
	// Check if domain is protected
	if IsProtectedDomain(sanitized) {
		return fmt.Errorf("domain %s is protected and cannot be registered", sanitized)
	}
	
	// Check if domain is reserved
	if IsReservedDomain(sanitized) {
		return fmt.Errorf("domain %s is reserved and cannot be registered", sanitized)
	}
	
	// Validate domain format (basic check)
	if !isValidDomainFormat(sanitized) {
		return fmt.Errorf("invalid domain format")
	}
	
	return nil
}

func isValidDomainFormat(domain string) bool {
	// Basic validation for domain format
	// Must contain at least one dot
	if !strings.Contains(domain, ".") {
		return false
	}
	
	// Check each part
	parts := strings.Split(domain, ".")
	for _, part := range parts {
		if len(part) == 0 || len(part) > 63 {
			return false
		}
		// Must start and end with alphanumeric
		if !isAlphaNumeric(part[0]) || !isAlphaNumeric(part[len(part)-1]) {
			return false
		}
	}
	
	return true
}

func isAlphaNumeric(c byte) bool {
	return (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')
}

func (s *DomainService) isValidStatus(status string) bool {
	validStatuses := []string{"pending", "verifying", "verified", "active", "failed"}
	for _, valid := range validStatuses {
		if status == valid {
			return true
		}
	}
	return false
}

func (s *DomainService) createVerificationRecord(ctx context.Context, domain *types.Domain) error {
	// Generate verification token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return err
	}
	token := hex.EncodeToString(tokenBytes)

	// Create verification record
	verification := types.DomainVerification{
		DomainID:          domain.DomainID,
		VerificationToken: token,
		VerificationMethod: "dns-txt",
		VerificationRecord: types.DNSRecord{
			Type:   "TXT",
			Name:   "_listbackup-verification",
			Values: []string{fmt.Sprintf("listbackup-verification=%s", token)},
			TTL:    300,
		},
		Status:    "pending",
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
		Attempts:  0,
	}

	return s.saveVerificationRecord(ctx, &verification)
}

func (s *DomainService) getVerificationRecord(ctx context.Context, domainID string) (*types.DomainVerification, error) {
	result, err := s.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(s.verificationTable),
		Key: map[string]*dynamodb.AttributeValue{
			"domainId": {
				S: aws.String(domainID),
			},
		},
	})

	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, fmt.Errorf("verification record not found")
	}

	var verification types.DomainVerification
	if err := dynamodbattribute.UnmarshalMap(result.Item, &verification); err != nil {
		return nil, err
	}

	return &verification, nil
}

func (s *DomainService) saveVerificationRecord(ctx context.Context, verification *types.DomainVerification) error {
	item, err := dynamodbattribute.MarshalMap(verification)
	if err != nil {
		return err
	}

	_, err = s.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(s.verificationTable),
		Item:      item,
	})

	return err
}

func (s *DomainService) deleteVerificationRecord(ctx context.Context, domainID string) error {
	_, err := s.db.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(s.verificationTable),
		Key: map[string]*dynamodb.AttributeValue{
			"domainId": {
				S: aws.String(domainID),
			},
		},
	})
	return err
}

func (s *DomainService) checkDNSVerification(ctx context.Context, domain *types.Domain, verification *types.DomainVerification) (bool, error) {
	// Query Route53 for the verification record
	recordName := fmt.Sprintf("_listbackup-verification.%s", domain.DomainName)
	
	result, err := s.route53.ListResourceRecordSets(&route53.ListResourceRecordSetsInput{
		HostedZoneId:    aws.String(s.hostedZoneID),
		StartRecordName: aws.String(recordName),
		StartRecordType: aws.String("TXT"),
		MaxItems:        aws.Int64(1),
	})

	if err != nil {
		return false, err
	}

	// Check if record exists and matches
	for _, recordSet := range result.ResourceRecordSets {
		if aws.StringValue(recordSet.Name) == recordName+"." && aws.StringValue(recordSet.Type) == "TXT" {
			for _, record := range recordSet.ResourceRecords {
				value := aws.StringValue(record.Value)
				expectedValue := fmt.Sprintf("\"listbackup-verification=%s\"", verification.VerificationToken)
				if value == expectedValue || value == fmt.Sprintf("listbackup-verification=%s", verification.VerificationToken) {
					return true, nil
				}
			}
		}
	}

	return false, nil
}

func (s *DomainService) requestSSLCertificate(ctx context.Context, domain *types.Domain) error {
	// Request certificate from ACM
	input := &acm.RequestCertificateInput{
		DomainName:              aws.String(domain.DomainName),
		ValidationMethod:        aws.String("DNS"),
		SubjectAlternativeNames: []*string{},
	}

	// Add www subdomain if it's a site domain
	if domain.DomainType == "site" && domain.Configuration.UseWWW {
		input.SubjectAlternativeNames = append(input.SubjectAlternativeNames, aws.String(fmt.Sprintf("www.%s", domain.DomainName)))
	}

	// Add wildcard for API domains
	if domain.DomainType == "api" {
		input.SubjectAlternativeNames = append(input.SubjectAlternativeNames, aws.String(fmt.Sprintf("*.%s", domain.DomainName)))
	}

	result, err := s.acm.RequestCertificate(input)
	if err != nil {
		return fmt.Errorf("failed to request certificate: %w", err)
	}

	// Update domain with certificate ARN
	domain.CertificateARN = aws.StringValue(result.CertificateArn)
	domain.SSLStatus = "pending"
	return s.saveDomain(ctx, domain)
}

func (s *DomainService) saveDomain(ctx context.Context, domain *types.Domain) error {
	item, err := dynamodbattribute.MarshalMap(domain)
	if err != nil {
		return err
	}

	_, err = s.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(s.domainsTable),
		Item:      item,
	})

	return err
}

func (s *DomainService) buildRecordName(name, domainName string) string {
	if name == "@" || name == "" {
		return domainName
	}
	return fmt.Sprintf("%s.%s", name, domainName)
}