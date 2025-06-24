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
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/route53"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/listbackup/api/internal/middleware"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/pkg/response"
)

var (
	domainService *services.DomainService
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("unable to load SDK config: %v", err))
	}

	dbClient := dynamodb.NewFromConfig(cfg)
	acmClient := acm.NewFromConfig(cfg)
	route53Client := route53.NewFromConfig(cfg)
	s3Client := s3.NewFromConfig(cfg)

	domainsTable := os.Getenv("DOMAINS_TABLE")
	brandingTable := os.Getenv("BRANDING_TABLE")
	verificationTable := os.Getenv("DOMAIN_VERIFICATION_TABLE")
	hostedZoneID := os.Getenv("HOSTED_ZONE_ID")

	domainService = services.NewDomainService(
		dbClient,
		acmClient,
		route53Client,
		s3Client,
		domainsTable,
		brandingTable,
		verificationTable,
		hostedZoneID,
	)
}

type MailProvider string

const (
	MailProviderGoogle      MailProvider = "google"
	MailProviderOffice365   MailProvider = "office365"
	MailProviderZoho        MailProvider = "zoho"
	MailProviderFastmail    MailProvider = "fastmail"
	MailProviderCustom      MailProvider = "custom"
	MailProviderListBackup  MailProvider = "listbackup"
)

type ConfigureMailRequest struct {
	Provider      MailProvider          `json:"provider"`
	CustomMX      []types.MXRecord      `json:"customMx,omitempty"`
	EnableSPF     bool                  `json:"enableSpf"`
	EnableDKIM    bool                  `json:"enableDkim"`
	EnableDMARC   bool                  `json:"enableDmarc"`
	CatchAllEmail string                `json:"catchAllEmail,omitempty"`
}

type MailConfigurationResponse struct {
	Domain       *types.Domain            `json:"domain"`
	DNSRecords   []DNSRecord              `json:"dnsRecords"`
	Instructions ProviderInstructions     `json:"instructions"`
}

type DNSRecord struct {
	Type     string   `json:"type"`
	Name     string   `json:"name"`
	Value    string   `json:"value"`
	Priority int      `json:"priority,omitempty"`
	TTL      int      `json:"ttl"`
	Status   string   `json:"status"` // pending, active, error
	Purpose  string   `json:"purpose"`
}

type ProviderInstructions struct {
	Provider     string   `json:"provider"`
	Steps        []string `json:"steps"`
	WarningNotes []string `json:"warningNotes,omitempty"`
	HelpURL      string   `json:"helpUrl,omitempty"`
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
	var req ConfigureMailRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return response.Error(400, "Invalid request body", err)
	}

	// Get domain
	domain, err := domainService.GetDomain(ctx, domainID, authContext.AccountID)
	if err != nil {
		return response.Error(404, "Domain not found", err)
	}

	// Update mail settings based on provider
	mailSettings := &types.MailSettings{
		CatchAllEmail: req.CatchAllEmail,
	}

	// Configure MX records based on provider
	switch req.Provider {
	case MailProviderGoogle:
		mailSettings.MXRecords = []types.MXRecord{
			{Priority: 1, Value: "aspmx.l.google.com"},
			{Priority: 5, Value: "alt1.aspmx.l.google.com"},
			{Priority: 5, Value: "alt2.aspmx.l.google.com"},
			{Priority: 10, Value: "alt3.aspmx.l.google.com"},
			{Priority: 10, Value: "alt4.aspmx.l.google.com"},
		}
		mailSettings.SPFRecord = "v=spf1 include:_spf.google.com ~all"
		
	case MailProviderOffice365:
		mailSettings.MXRecords = []types.MXRecord{
			{Priority: 0, Value: fmt.Sprintf("%s.mail.protection.outlook.com", domain.DomainName)},
		}
		mailSettings.SPFRecord = "v=spf1 include:spf.protection.outlook.com -all"
		
	case MailProviderZoho:
		mailSettings.MXRecords = []types.MXRecord{
			{Priority: 10, Value: "mx.zoho.com"},
			{Priority: 20, Value: "mx2.zoho.com"},
			{Priority: 50, Value: "mx3.zoho.com"},
		}
		mailSettings.SPFRecord = "v=spf1 include:zoho.com ~all"
		
	case MailProviderFastmail:
		mailSettings.MXRecords = []types.MXRecord{
			{Priority: 10, Value: "in1-smtp.messagingengine.com"},
			{Priority: 20, Value: "in2-smtp.messagingengine.com"},
		}
		mailSettings.SPFRecord = "v=spf1 include:spf.messagingengine.com ~all"
		
	case MailProviderListBackup:
		mailSettings.MXRecords = []types.MXRecord{
			{Priority: 10, Value: "mx1.listbackup.ai"},
			{Priority: 20, Value: "mx2.listbackup.ai"},
		}
		mailSettings.SPFRecord = "v=spf1 include:_spf.listbackup.ai ~all"
		
	case MailProviderCustom:
		if len(req.CustomMX) == 0 {
			return response.Error(400, "Custom MX records are required", nil)
		}
		mailSettings.MXRecords = req.CustomMX
		mailSettings.SPFRecord = "v=spf1 a mx ~all" // Basic SPF
	}

	// Set DKIM if enabled (provider-specific)
	if req.EnableDKIM {
		switch req.Provider {
		case MailProviderGoogle:
			mailSettings.DKIMKey = "Get from Google Admin Console"
		case MailProviderListBackup:
			// Generate DKIM key for ListBackup
			mailSettings.DKIMKey = generateDKIMPublicKey(domain.DomainName)
		}
	}

	// Set DMARC if enabled
	if req.EnableDMARC {
		mailSettings.DMARCPolicy = "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@listbackup.ai; pct=100"
	}

	// Update domain configuration
	domain.Configuration.MailSettings = mailSettings
	domain.DomainType = "mail" // Ensure it's marked as mail domain

	// Save updated domain
	updateReq := types.UpdateDomainRequest{
		Configuration: domain.Configuration,
	}
	
	updatedDomain, err := domainService.UpdateDomain(ctx, domainID, authContext.AccountID, authContext.UserID, updateReq)
	if err != nil {
		return response.Error(500, "Failed to update domain", err)
	}

	// Build DNS records for response
	dnsRecords := []DNSRecord{}
	
	// MX Records
	for _, mx := range mailSettings.MXRecords {
		dnsRecords = append(dnsRecords, DNSRecord{
			Type:     "MX",
			Name:     domain.DomainName,
			Value:    mx.Value,
			Priority: mx.Priority,
			TTL:      3600,
			Status:   "pending",
			Purpose:  fmt.Sprintf("Mail server (priority %d)", mx.Priority),
		})
	}

	// SPF Record
	if mailSettings.SPFRecord != "" {
		dnsRecords = append(dnsRecords, DNSRecord{
			Type:    "TXT",
			Name:    domain.DomainName,
			Value:   mailSettings.SPFRecord,
			TTL:     3600,
			Status:  "pending",
			Purpose: "SPF - Authorizes mail servers",
		})
	}

	// DKIM Record
	if mailSettings.DKIMKey != "" && req.Provider == MailProviderListBackup {
		dnsRecords = append(dnsRecords, DNSRecord{
			Type:    "TXT",
			Name:    fmt.Sprintf("listbackup._domainkey.%s", domain.DomainName),
			Value:   mailSettings.DKIMKey,
			TTL:     3600,
			Status:  "pending",
			Purpose: "DKIM - Email authentication",
		})
	}

	// DMARC Record
	if mailSettings.DMARCPolicy != "" {
		dnsRecords = append(dnsRecords, DNSRecord{
			Type:    "TXT",
			Name:    fmt.Sprintf("_dmarc.%s", domain.DomainName),
			Value:   mailSettings.DMARCPolicy,
			TTL:     3600,
			Status:  "pending",
			Purpose: "DMARC - Email policy enforcement",
		})
	}

	// Build provider-specific instructions
	instructions := getProviderInstructions(req.Provider, domain.DomainName)

	resp := MailConfigurationResponse{
		Domain:       updatedDomain,
		DNSRecords:   dnsRecords,
		Instructions: instructions,
	}

	return response.Success(resp)
}

func getProviderInstructions(provider MailProvider, domainName string) ProviderInstructions {
	switch provider {
	case MailProviderGoogle:
		return ProviderInstructions{
			Provider: "Google Workspace",
			Steps: []string{
				"Add the MX records shown above to your DNS",
				"Verify domain ownership in Google Admin Console",
				"Enable DKIM in Google Admin: Apps > Google Workspace > Gmail > Authenticate email",
				"Copy the DKIM key from Google and add it as a TXT record",
				"Wait 24-48 hours for full propagation",
			},
			WarningNotes: []string{
				"Existing email may be disrupted during the switch",
				"Update SPF record if you have other mail services",
			},
			HelpURL: "https://support.google.com/a/answer/140034",
		}
		
	case MailProviderOffice365:
		return ProviderInstructions{
			Provider: "Microsoft 365",
			Steps: []string{
				"Add your domain in Microsoft 365 admin center",
				"Add the MX record shown above",
				"Add required CNAME records for autodiscover",
				"Enable DKIM in Security & Compliance Center",
				"Configure SPF and DMARC records",
			},
			WarningNotes: []string{
				"The MX record value is specific to your domain",
				"Additional CNAME records required for full functionality",
			},
			HelpURL: "https://docs.microsoft.com/en-us/microsoft-365/admin/setup/add-domain",
		}
		
	case MailProviderListBackup:
		return ProviderInstructions{
			Provider: "ListBackup Mail",
			Steps: []string{
				"Add all DNS records shown above",
				"Verify domain ownership",
				"Configure mailboxes in ListBackup dashboard",
				"Set up email forwarding rules if needed",
				"Test email delivery",
			},
			WarningNotes: []string{
				"Email will be hosted on ListBackup servers",
				"Unlimited aliases included",
			},
			HelpURL: "https://docs.listbackup.ai/email-setup",
		}
		
	default:
		return ProviderInstructions{
			Provider: string(provider),
			Steps: []string{
				"Add the MX records to your DNS provider",
				"Configure SPF record for sender authentication",
				"Set up DKIM with your mail provider",
				"Add DMARC for policy enforcement",
				"Test email delivery",
			},
		}
	}
}

func generateDKIMPublicKey(domain string) string {
	// In production, this would generate a proper DKIM key pair
	// and store the private key securely
	return fmt.Sprintf("v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...")
}

func main() {
	lambda.Start(handler)
}