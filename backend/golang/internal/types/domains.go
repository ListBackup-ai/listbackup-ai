package types

import "time"

// Domain represents a custom domain configuration
type Domain struct {
	DomainID        string            `json:"domainId" dynamodbav:"domainId"`
	AccountID       string            `json:"accountId" dynamodbav:"accountId"`
	DomainName      string            `json:"domainName" dynamodbav:"domainName"`
	DomainType      string            `json:"domainType" dynamodbav:"domainType"` // site, api, mail
	ParentDomainID  string            `json:"parentDomainId,omitempty" dynamodbav:"parentDomainId,omitempty"`
	BrandingID      string            `json:"brandingId,omitempty" dynamodbav:"brandingId,omitempty"`
	Status          string            `json:"status" dynamodbav:"status"`                   // pending, verifying, verified, active, failed
	VerificationStatus string         `json:"verificationStatus" dynamodbav:"verificationStatus"` // pending, verified, failed
	SSLStatus       string            `json:"sslStatus" dynamodbav:"sslStatus"`             // pending, issued, failed
	CertificateARN  string            `json:"certificateArn,omitempty" dynamodbav:"certificateArn,omitempty"`
	HostedZoneID    string            `json:"hostedZoneId,omitempty" dynamodbav:"hostedZoneId,omitempty"`
	CloudFrontID    string            `json:"cloudfrontId,omitempty" dynamodbav:"cloudfrontId,omitempty"`
	DNSRecords      []DNSRecord       `json:"dnsRecords,omitempty" dynamodbav:"dnsRecords,omitempty"`
	Configuration   DomainConfig      `json:"configuration" dynamodbav:"configuration"`
	CreatedAt       time.Time         `json:"createdAt" dynamodbav:"createdAt"`
	CreatedBy       string            `json:"createdBy" dynamodbav:"createdBy"`
	UpdatedAt       time.Time         `json:"updatedAt" dynamodbav:"updatedAt"`
	UpdatedBy       string            `json:"updatedBy" dynamodbav:"updatedBy"`
	ActivatedAt     *time.Time        `json:"activatedAt,omitempty" dynamodbav:"activatedAt,omitempty"`
	Metadata        map[string]string `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
}

// DomainConfig holds domain-specific configuration
type DomainConfig struct {
	UseWWW          bool              `json:"useWww" dynamodbav:"useWww"`
	ForceHTTPS      bool              `json:"forceHttps" dynamodbav:"forceHttps"`
	EnableHSTS      bool              `json:"enableHsts" dynamodbav:"enableHsts"`
	CustomHeaders   map[string]string `json:"customHeaders,omitempty" dynamodbav:"customHeaders,omitempty"`
	Redirects       []RedirectRule    `json:"redirects,omitempty" dynamodbav:"redirects,omitempty"`
	APIPrefix       string            `json:"apiPrefix,omitempty" dynamodbav:"apiPrefix,omitempty"` // for API domains (e.g., "api")
	MailSettings    *MailSettings     `json:"mailSettings,omitempty" dynamodbav:"mailSettings,omitempty"`
}

// RedirectRule defines URL redirect rules
type RedirectRule struct {
	From       string `json:"from" dynamodbav:"from"`
	To         string `json:"to" dynamodbav:"to"`
	StatusCode int    `json:"statusCode" dynamodbav:"statusCode"` // 301, 302, etc.
}

// MailSettings for mail domains
type MailSettings struct {
	MXRecords      []MXRecord `json:"mxRecords" dynamodbav:"mxRecords"`
	SPFRecord      string     `json:"spfRecord" dynamodbav:"spfRecord"`
	DKIMKey        string     `json:"dkimKey,omitempty" dynamodbav:"dkimKey,omitempty"`
	DMARCPolicy    string     `json:"dmarcPolicy,omitempty" dynamodbav:"dmarcPolicy,omitempty"`
	CatchAllEmail  string     `json:"catchAllEmail,omitempty" dynamodbav:"catchAllEmail,omitempty"`
}

// MXRecord represents a mail exchange record
type MXRecord struct {
	Priority int    `json:"priority" dynamodbav:"priority"`
	Value    string `json:"value" dynamodbav:"value"`
}

// DNSRecord represents a DNS record
type DNSRecord struct {
	Type   string   `json:"type" dynamodbav:"type"`     // A, AAAA, CNAME, TXT, MX
	Name   string   `json:"name" dynamodbav:"name"`     // subdomain or @ for root
	Values []string `json:"values" dynamodbav:"values"` // IP addresses or values
	TTL    int      `json:"ttl" dynamodbav:"ttl"`       // Time to live in seconds
}

// DomainVerification tracks domain ownership verification
type DomainVerification struct {
	DomainID           string    `json:"domainId" dynamodbav:"domainId"`
	VerificationToken  string    `json:"verificationToken" dynamodbav:"verificationToken"`
	VerificationMethod string    `json:"verificationMethod" dynamodbav:"verificationMethod"` // dns-txt, dns-cname, http-file
	VerificationRecord DNSRecord `json:"verificationRecord" dynamodbav:"verificationRecord"`
	Status             string    `json:"status" dynamodbav:"status"` // pending, verified, failed
	CreatedAt          time.Time `json:"createdAt" dynamodbav:"createdAt"`
	VerifiedAt         *time.Time `json:"verifiedAt,omitempty" dynamodbav:"verifiedAt,omitempty"`
	ExpiresAt          time.Time `json:"expiresAt" dynamodbav:"expiresAt"`
	Attempts           int       `json:"attempts" dynamodbav:"attempts"`
	LastCheckAt        *time.Time `json:"lastCheckAt,omitempty" dynamodbav:"lastCheckAt,omitempty"`
}

// Branding represents custom branding configuration
type Branding struct {
	BrandingID    string            `json:"brandingId" dynamodbav:"brandingId"`
	AccountID     string            `json:"accountId" dynamodbav:"accountId"`
	Name          string            `json:"name" dynamodbav:"name"`
	Description   string            `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Logos         BrandLogos        `json:"logos" dynamodbav:"logos"`
	FaviconURL    string            `json:"faviconUrl,omitempty" dynamodbav:"faviconUrl,omitempty"` // Base64 data URI
	Colors        BrandColors       `json:"colors" dynamodbav:"colors"`
	Fonts         BrandFonts        `json:"fonts" dynamodbav:"fonts"`
	CustomCSS     string            `json:"customCss,omitempty" dynamodbav:"customCss,omitempty"`
	EmailSettings EmailBranding     `json:"emailSettings" dynamodbav:"emailSettings"`
	SocialLinks   map[string]string `json:"socialLinks,omitempty" dynamodbav:"socialLinks,omitempty"`
	Settings      BrandingSettings  `json:"settings" dynamodbav:"settings"`
	CreatedAt     time.Time         `json:"createdAt" dynamodbav:"createdAt"`
	CreatedBy     string            `json:"createdBy" dynamodbav:"createdBy"`
	UpdatedAt     time.Time         `json:"updatedAt" dynamodbav:"updatedAt"`
	UpdatedBy     string            `json:"updatedBy" dynamodbav:"updatedBy"`
	IsDefault     bool              `json:"isDefault" dynamodbav:"isDefault"`
}

// BrandLogos defines logo variations
type BrandLogos struct {
	Light        LogoVariants `json:"light" dynamodbav:"light"`
	Dark         LogoVariants `json:"dark" dynamodbav:"dark"`
}

// LogoVariants for different sizes
type LogoVariants struct {
	Full         string `json:"full,omitempty" dynamodbav:"full,omitempty"` // Full logo for expanded sidebar
	Compact      string `json:"compact,omitempty" dynamodbav:"compact,omitempty"` // Small logo for collapsed sidebar
	Square       string `json:"square,omitempty" dynamodbav:"square,omitempty"` // Square logo for various uses
}

// BrandingSettings defines display preferences
type BrandingSettings struct {
	LogoPlacement    string `json:"logoPlacement" dynamodbav:"logoPlacement"` // center, left, right
	LoginLogoSize    string `json:"loginLogoSize" dynamodbav:"loginLogoSize"` // small, medium, large
	ShowCompanyName  bool   `json:"showCompanyName" dynamodbav:"showCompanyName"`
	CompanyNamePosition string `json:"companyNamePosition" dynamodbav:"companyNamePosition"` // below, beside
}

// BrandColors defines the color scheme
type BrandColors struct {
	Primary      string `json:"primary" dynamodbav:"primary"`
	Secondary    string `json:"secondary" dynamodbav:"secondary"`
	Accent       string `json:"accent" dynamodbav:"accent"`
	Background   string `json:"background" dynamodbav:"background"`
	Text         string `json:"text" dynamodbav:"text"`
	TextMuted    string `json:"textMuted" dynamodbav:"textMuted"`
	Success      string `json:"success" dynamodbav:"success"`
	Warning      string `json:"warning" dynamodbav:"warning"`
	Error        string `json:"error" dynamodbav:"error"`
	Info         string `json:"info" dynamodbav:"info"`
}

// BrandFonts defines the typography
type BrandFonts struct {
	Heading    string `json:"heading" dynamodbav:"heading"`
	Body       string `json:"body" dynamodbav:"body"`
	Monospace  string `json:"monospace" dynamodbav:"monospace"`
	Size       string `json:"size" dynamodbav:"size"` // small, medium, large
}

// EmailBranding for email templates
type EmailBranding struct {
	FromName       string `json:"fromName" dynamodbav:"fromName"`
	FromEmail      string `json:"fromEmail" dynamodbav:"fromEmail"`
	ReplyToEmail   string `json:"replyToEmail,omitempty" dynamodbav:"replyToEmail,omitempty"`
	FooterText     string `json:"footerText" dynamodbav:"footerText"`
	UnsubscribeURL string `json:"unsubscribeUrl,omitempty" dynamodbav:"unsubscribeUrl,omitempty"`
}

// Request/Response types

type AddDomainRequest struct {
	DomainName     string       `json:"domainName"`
	DomainType     string       `json:"domainType"` // site, api, mail
	ParentDomainID string       `json:"parentDomainId,omitempty"`
	BrandingID     string       `json:"brandingId,omitempty"`
	Configuration  DomainConfig `json:"configuration"`
}

type UpdateDomainRequest struct {
	BrandingID    string       `json:"brandingId,omitempty"`
	Configuration DomainConfig `json:"configuration,omitempty"`
	Status        string       `json:"status,omitempty"`
}

type CreateDNSRecordsRequest struct {
	Records []DNSRecord `json:"records"`
}

type AddBrandingRequest struct {
	Name          string            `json:"name"`
	Description   string            `json:"description,omitempty"`
	Colors        BrandColors       `json:"colors"`
	Fonts         BrandFonts        `json:"fonts"`
	CustomCSS     string            `json:"customCss,omitempty"`
	EmailSettings EmailBranding     `json:"emailSettings"`
	SocialLinks   map[string]string `json:"socialLinks,omitempty"`
	Settings      BrandingSettings  `json:"settings"`
	IsDefault     bool              `json:"isDefault"`
}

type UpdateBrandingRequest struct {
	Name          string            `json:"name,omitempty"`
	Description   string            `json:"description,omitempty"`
	Colors        *BrandColors      `json:"colors,omitempty"`
	Fonts         *BrandFonts       `json:"fonts,omitempty"`
	CustomCSS     string            `json:"customCss,omitempty"`
	EmailSettings *EmailBranding    `json:"emailSettings,omitempty"`
	SocialLinks   map[string]string `json:"socialLinks,omitempty"`
	Settings      *BrandingSettings `json:"settings,omitempty"`
}

type UploadLogoRequest struct {
	ImageData   string `json:"imageData"` // base64 encoded image
	ContentType string `json:"contentType"` // image/png, image/jpeg
	LogoType    string `json:"logoType"` // full, compact, square
	Theme       string `json:"theme"` // light, dark
}

type UploadFaviconRequest struct {
	ImageData   string `json:"imageData"` // base64 encoded image
	ContentType string `json:"contentType"` // image/png, image/jpeg
}

type ImageUploadResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

// List responses
type DomainsListResponse struct {
	Domains []Domain `json:"domains"`
}

type BrandingListResponse struct {
	Brandings []Branding `json:"brandings"`
}