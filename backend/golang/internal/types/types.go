package types

import (
	"time"
)

// User represents a user in the system (updated for hierarchical accounts)
type User struct {
	UserID           string                 `json:"userId" dynamodbav:"userId"`
	CognitoUserID    string                 `json:"cognitoUserId" dynamodbav:"cognitoUserId"`
	Email            string                 `json:"email" dynamodbav:"email"`
	Name             string                 `json:"name" dynamodbav:"name"`
	Status           string                 `json:"status" dynamodbav:"status"`
	CurrentAccountID string                 `json:"currentAccountId" dynamodbav:"currentAccountId"` // User's currently selected account
	CreatedAt        time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
	LastLoginAt      *time.Time             `json:"lastLoginAt,omitempty" dynamodbav:"lastLoginAt,omitempty"`
	Preferences      UserPreferences        `json:"preferences" dynamodbav:"preferences"`
}

// UserPreferences represents user preferences
type UserPreferences struct {
	Timezone      string                 `json:"timezone" dynamodbav:"timezone"`
	Notifications NotificationSettings   `json:"notifications" dynamodbav:"notifications"`
	Theme         string                 `json:"theme" dynamodbav:"theme"`
}

// NotificationSettings represents notification preferences
type NotificationSettings struct {
	Email          bool `json:"email" dynamodbav:"email"`
	Slack          bool `json:"slack" dynamodbav:"slack"`
	BackupComplete bool `json:"backupComplete" dynamodbav:"backupComplete"`
	BackupFailed   bool `json:"backupFailed" dynamodbav:"backupFailed"`
	WeeklyReport   bool `json:"weeklyReport" dynamodbav:"weeklyReport"`
}

// Account represents an account in the system (updated for hierarchical structure)
type Account struct {
	AccountID       string          `json:"accountId" dynamodbav:"accountId"`
	ParentAccountID *string         `json:"parentAccountId,omitempty" dynamodbav:"parentAccountId,omitempty"`
	OwnerUserID     string          `json:"ownerUserId" dynamodbav:"ownerUserId"`
	CreatedByUserID string          `json:"createdByUserId" dynamodbav:"createdByUserId"` // User who created this account
	Name            string          `json:"name" dynamodbav:"name"`
	Company         string          `json:"company" dynamodbav:"company"`
	AccountPath     string          `json:"accountPath" dynamodbav:"accountPath"` // "/parent/child/grandchild"
	Level           int             `json:"level" dynamodbav:"level"`             // 0 = root, 1 = child, etc.
	Plan            string          `json:"plan" dynamodbav:"plan"`
	Status          string          `json:"status" dynamodbav:"status"`
	BillingEmail    string          `json:"billingEmail" dynamodbav:"billingEmail"`
	CreatedAt       time.Time       `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt" dynamodbav:"updatedAt"`
	Settings        AccountSettings `json:"settings" dynamodbav:"settings"`
	Usage           AccountUsage    `json:"usage" dynamodbav:"usage"`
}

// AccountSettings represents account settings (updated for hierarchical accounts)
type AccountSettings struct {
	MaxSources         int                    `json:"maxSources" dynamodbav:"maxSources"`
	MaxStorageGB       int                    `json:"maxStorageGB" dynamodbav:"maxStorageGB"`
	MaxBackupJobs      int                    `json:"maxBackupJobs" dynamodbav:"maxBackupJobs"`
	RetentionDays      int                    `json:"retentionDays" dynamodbav:"retentionDays"`
	EncryptionEnabled  bool                   `json:"encryptionEnabled" dynamodbav:"encryptionEnabled"`
	TwoFactorRequired  bool                   `json:"twoFactorRequired" dynamodbav:"twoFactorRequired"`
	AllowSubAccounts   bool                   `json:"allowSubAccounts" dynamodbav:"allowSubAccounts"`
	MaxSubAccounts     int                    `json:"maxSubAccounts" dynamodbav:"maxSubAccounts"`
	WhiteLabel         WhiteLabelSettings     `json:"whiteLabel" dynamodbav:"whiteLabel"`
}

// WhiteLabelSettings represents white label configuration
type WhiteLabelSettings struct {
	Enabled   bool   `json:"enabled" dynamodbav:"enabled"`
	Logo      string `json:"logo" dynamodbav:"logo"`
	BrandName string `json:"brandName" dynamodbav:"brandName"`
}

// AccountUsage represents account usage metrics
type AccountUsage struct {
	Sources              int `json:"sources" dynamodbav:"sources"`
	StorageUsedGB        int `json:"storageUsedGB" dynamodbav:"storageUsedGB"`
	BackupJobs           int `json:"backupJobs" dynamodbav:"backupJobs"`
	MonthlyBackups       int `json:"monthlyBackups" dynamodbav:"monthlyBackups"`
	MonthlyAPIRequests   int `json:"monthlyAPIRequests" dynamodbav:"monthlyAPIRequests"`
}

// UserAccount represents the many-to-many relationship between users and accounts
type UserAccount struct {
	UserID      string          `json:"userId" dynamodbav:"userId"`
	AccountID   string          `json:"accountId" dynamodbav:"accountId"`
	Role        string          `json:"role" dynamodbav:"role"`         // Owner|Manager|Viewer
	Status      string          `json:"status" dynamodbav:"status"`     // Active|Inactive|Invited
	Permissions UserPermissions `json:"permissions" dynamodbav:"permissions"`
	LinkedAt    time.Time       `json:"linkedAt" dynamodbav:"linkedAt"`
	UpdatedAt   time.Time       `json:"updatedAt" dynamodbav:"updatedAt"`
}

// UserPermissions represents granular permissions for a user within an account
type UserPermissions struct {
	CanCreateSubAccounts   bool `json:"canCreateSubAccounts" dynamodbav:"canCreateSubAccounts"`
	CanInviteUsers         bool `json:"canInviteUsers" dynamodbav:"canInviteUsers"`
	CanManageIntegrations  bool `json:"canManageIntegrations" dynamodbav:"canManageIntegrations"`
	CanViewAllData         bool `json:"canViewAllData" dynamodbav:"canViewAllData"`
	CanManageBilling       bool `json:"canManageBilling" dynamodbav:"canManageBilling"`
	CanDeleteAccount       bool `json:"canDeleteAccount" dynamodbav:"canDeleteAccount"`
	CanModifySettings      bool `json:"canModifySettings" dynamodbav:"canModifySettings"`
}

// SourceGroup represents a logical grouping of sources from a platform connection
type SourceGroup struct {
	GroupID      string    `json:"groupId" dynamodbav:"groupId"`               // group:uuid
	AccountID    string    `json:"accountId" dynamodbav:"accountId"`
	UserID       string    `json:"userId" dynamodbav:"userId"`
	ConnectionID string    `json:"connectionId" dynamodbav:"connectionId"`     // References PlatformConnection
	Name         string    `json:"name" dynamodbav:"name"`                     // "My Keap Account"
	Description  string    `json:"description" dynamodbav:"description"`
	Status       string    `json:"status" dynamodbav:"status"`                 // active|paused|error
	SourceCount  int       `json:"sourceCount" dynamodbav:"sourceCount"`       // Number of sources in this group
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

// Source represents a user's backup job created from a platform source template
type Source struct {
	SourceID         string                `json:"sourceId" dynamodbav:"sourceId"`                 // source:uuid
	AccountID        string                `json:"accountId" dynamodbav:"accountId"`
	UserID           string                `json:"userId" dynamodbav:"userId"`
	GroupID          string                `json:"groupId" dynamodbav:"groupId"`                   // References SourceGroup (optional)
	ConnectionID     string                `json:"connectionId" dynamodbav:"connectionId"`         // References PlatformConnection
	PlatformSourceID string                `json:"platformSourceId" dynamodbav:"platformSourceId"` // References PlatformSource template
	Name             string                `json:"name" dynamodbav:"name"`                         // User-defined name: "My Contacts Backup"
	Status           string                `json:"status" dynamodbav:"status"`                     // active|paused|error
	Settings         SourceSettings        `json:"settings" dynamodbav:"settings"`                 // User's customized settings
	CreatedAt        time.Time             `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time             `json:"updatedAt" dynamodbav:"updatedAt"`
	LastSyncAt       *time.Time            `json:"lastSyncAt,omitempty" dynamodbav:"lastSyncAt,omitempty"`
	NextSyncAt       *time.Time            `json:"nextSyncAt,omitempty" dynamodbav:"nextSyncAt,omitempty"`
	LastBackupAt     *time.Time            `json:"lastBackupAt,omitempty" dynamodbav:"lastBackupAt,omitempty"`
	NextBackupAt     *time.Time            `json:"nextBackupAt,omitempty" dynamodbav:"nextBackupAt,omitempty"`
}

// SourceSettings represents user's customized settings for a source (overrides platform source defaults)
type SourceSettings struct {
	Enabled         bool                           `json:"enabled" dynamodbav:"enabled"`
	Priority        string                         `json:"priority" dynamodbav:"priority"`         // high|medium|low
	Frequency       string                         `json:"frequency" dynamodbav:"frequency"`       // daily|weekly|monthly
	Schedule        string                         `json:"schedule" dynamodbav:"schedule"`         // Cron expression
	RetentionDays   int                           `json:"retentionDays" dynamodbav:"retentionDays"`
	IncrementalSync bool                          `json:"incrementalSync" dynamodbav:"incrementalSync"`
	Notifications   BackupNotificationSettings    `json:"notifications" dynamodbav:"notifications"`
	CustomParams    map[string]string             `json:"customParams" dynamodbav:"customParams"` // User's custom API parameters
}


// BackupNotificationSettings represents notification preferences for backups
type BackupNotificationSettings struct {
	OnSuccess bool `json:"onSuccess" dynamodbav:"onSuccess"`
	OnFailure bool `json:"onFailure" dynamodbav:"onFailure"`
	OnSizeLimit bool `json:"onSizeLimit" dynamodbav:"onSizeLimit"`
}

// Activity represents system activity
type Activity struct {
	EventID   string `json:"eventId" dynamodbav:"eventId"`
	AccountID string `json:"accountId" dynamodbav:"accountId"`
	UserID    string `json:"userId" dynamodbav:"userId"`
	Type      string `json:"type" dynamodbav:"type"`
	Action    string `json:"action" dynamodbav:"action"`
	Status    string `json:"status" dynamodbav:"status"`
	Message   string `json:"message" dynamodbav:"message"`
	Timestamp int64  `json:"timestamp" dynamodbav:"timestamp"`
	TTL       int64  `json:"ttl" dynamodbav:"ttl"`
}

// Job represents a backup job
type Job struct {
	JobID       string     `json:"jobId" dynamodbav:"jobId"`
	AccountID   string     `json:"accountId" dynamodbav:"accountId"`
	UserID      string     `json:"userId" dynamodbav:"userId"`
	SourceID    string     `json:"sourceId" dynamodbav:"sourceId"`     // Single source per job
	Name        string     `json:"name" dynamodbav:"name"`
	Type        string     `json:"type" dynamodbav:"type"`             // sync|backup|export|analytics|maintenance|alert
	SubType     string     `json:"subType" dynamodbav:"subType"`       // endpoint name for granular tracking
	Priority    string     `json:"priority" dynamodbav:"priority"`     // high|medium|low
	Schedule    string     `json:"schedule" dynamodbav:"schedule"`     // Cron expression
	Status      string     `json:"status" dynamodbav:"status"`         // pending|running|completed|failed
	Enabled     bool       `json:"enabled" dynamodbav:"enabled"`
	Config      JobConfig  `json:"config" dynamodbav:"config"`         // Job-specific configuration
	Progress    JobProgress `json:"progress" dynamodbav:"progress"`     // Execution progress
	CreatedAt   time.Time  `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt" dynamodbav:"updatedAt"`
	StartedAt   *time.Time `json:"startedAt,omitempty" dynamodbav:"startedAt,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty" dynamodbav:"completedAt,omitempty"`
	LastRunAt   *time.Time `json:"lastRunAt,omitempty" dynamodbav:"lastRunAt,omitempty"`
	NextRunAt   *time.Time `json:"nextRunAt,omitempty" dynamodbav:"nextRunAt,omitempty"`
}

// JobConfig represents job-specific configuration
type JobConfig struct {
	Endpoints       []string               `json:"endpoints" dynamodbav:"endpoints"`             // Endpoints to process
	RetentionDays   int                    `json:"retentionDays" dynamodbav:"retentionDays"`     // Data retention
	IncrementalSync bool                   `json:"incrementalSync" dynamodbav:"incrementalSync"` // Incremental vs full backup
	MaxRetries      int                    `json:"maxRetries" dynamodbav:"maxRetries"`           // Retry attempts
	Timeout         int                    `json:"timeout" dynamodbav:"timeout"`                 // Timeout in seconds
	Metadata        map[string]interface{} `json:"metadata" dynamodbav:"metadata"`               // Additional job metadata
}

// JobProgress represents job execution progress
type JobProgress struct {
	TotalSteps      int     `json:"totalSteps" dynamodbav:"totalSteps"`
	CompletedSteps  int     `json:"completedSteps" dynamodbav:"completedSteps"`
	FailedSteps     int     `json:"failedSteps" dynamodbav:"failedSteps"`
	PercentComplete float64 `json:"percentComplete" dynamodbav:"percentComplete"`
	CurrentStep     string  `json:"currentStep" dynamodbav:"currentStep"`
	RecordsProcessed int64  `json:"recordsProcessed" dynamodbav:"recordsProcessed"`
	DataSizeBytes   int64   `json:"dataSizeBytes" dynamodbav:"dataSizeBytes"`
	ErrorMessage    string  `json:"errorMessage,omitempty" dynamodbav:"errorMessage,omitempty"`
}

// File represents a backed up file
type File struct {
	FileID      string    `json:"fileId" dynamodbav:"fileId"`
	AccountID   string    `json:"accountId" dynamodbav:"accountId"`
	SourceID    string    `json:"sourceId" dynamodbav:"sourceId"`
	JobID       string    `json:"jobId" dynamodbav:"jobId"`
	Path        string    `json:"path" dynamodbav:"path"`
	Size        int64     `json:"size" dynamodbav:"size"`
	ContentType string    `json:"contentType" dynamodbav:"contentType"`
	S3Key       string    `json:"s3Key" dynamodbav:"s3Key"`
	CreatedAt   time.Time `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt   *time.Time `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// LoginRequest represents login request payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	MFACode  string `json:"mfaCode,omitempty"`
}

// LoginResponse represents login response payload
type LoginResponse struct {
	AccessToken  string    `json:"accessToken"`
	IDToken      string    `json:"idToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresIn    int       `json:"expiresIn"`
	TokenType    string    `json:"tokenType"`
	User         UserInfo  `json:"user"`
}

// UserInfo represents user information
type UserInfo struct {
	UserID        string           `json:"userId"`
	Email         string           `json:"email"`
	Name          string           `json:"name"`
	Accounts      []AccountAccess  `json:"accounts"`
	MFAEnabled    bool             `json:"mfaEnabled"`
	EmailVerified bool             `json:"emailVerified"`
}

// AuthContext represents authentication context (updated for hierarchical accounts)
type AuthContext struct {
	UserID             string          `json:"userId"`
	AccountID          string          `json:"accountId"`          // Current active account
	Email              string          `json:"email"`
	Role               string          `json:"role"`               // Role in current account
	Permissions        UserPermissions `json:"permissions"`        // Permissions in current account
	AvailableAccounts  []AccountAccess `json:"availableAccounts"`  // All accounts user has access to
}

// AccountAccess represents an account the user has access to
type AccountAccess struct {
	AccountID   string          `json:"accountId"`
	AccountName string          `json:"accountName"`
	Role        string          `json:"role"`
	Permissions UserPermissions `json:"permissions"`
	IsCurrent   bool            `json:"isCurrent"`
}

// Platform represents a service provider (Keap, Stripe, HubSpot, etc.)
type Platform struct {
	PlatformID       string              `json:"platformId" dynamodbav:"platformId"`           // platform:keap
	Name             string              `json:"name" dynamodbav:"name"`                       // "Keap"
	Type             string              `json:"type" dynamodbav:"type"`                       // keap, stripe, hubspot, etc.
	Category         string              `json:"category" dynamodbav:"category"`               // CRM, Email, Payment, etc.
	Description      string              `json:"description" dynamodbav:"description"`
	Status           string              `json:"status" dynamodbav:"status"`                   // active|deprecated|beta
	Version          string              `json:"version" dynamodbav:"version"`
	LogoURL          string              `json:"logoUrl" dynamodbav:"logoUrl"`
	DocumentationURL string              `json:"documentationUrl" dynamodbav:"documentationUrl"`
	OAuth            *OAuthConfiguration `json:"oauth,omitempty" dynamodbav:"oauth,omitempty"`
	APIConfig        APIConfiguration    `json:"apiConfig" dynamodbav:"apiConfig"`
	CreatedAt        time.Time           `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time           `json:"updatedAt" dynamodbav:"updatedAt"`
}

// PlatformSource represents a predefined backup template for a platform
type PlatformSource struct {
	PlatformSourceID string                          `json:"platformSourceId" dynamodbav:"platformSourceId"` // platform-source:keap-contacts
	PlatformID       string                          `json:"platformId" dynamodbav:"platformId"`             // References Platform
	Name             string                          `json:"name" dynamodbav:"name"`                         // "Keap Contacts"
	Description      string                          `json:"description" dynamodbav:"description"`           // "Backup all contact records and custom fields"
	DataType         string                          `json:"dataType" dynamodbav:"dataType"`                 // contacts, orders, campaigns
	Icon             string                          `json:"icon" dynamodbav:"icon"`                         // Icon name for UI
	Category         string                          `json:"category" dynamodbav:"category"`                 // Core, Marketing, Sales, etc.
	Popularity       int                             `json:"popularity" dynamodbav:"popularity"`             // For sorting/recommendations
	Status           string                          `json:"status" dynamodbav:"status"`                     // active|deprecated|beta
	DefaultSettings  PlatformSourceDefaults          `json:"defaultSettings" dynamodbav:"defaultSettings"`   // Default backup configuration
	Endpoints        map[string]PlatformEndpoint     `json:"endpoints" dynamodbav:"endpoints"`               // API endpoints this source uses
	Dependencies     []string                        `json:"dependencies" dynamodbav:"dependencies"`         // Other platform sources needed
	CreatedAt        time.Time                       `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time                       `json:"updatedAt" dynamodbav:"updatedAt"`
}

// PlatformSourceDefaults represents default settings for a platform source template
type PlatformSourceDefaults struct {
	Enabled         bool                           `json:"enabled" dynamodbav:"enabled"`
	Priority        string                         `json:"priority" dynamodbav:"priority"`         // high|medium|low
	Frequency       string                         `json:"frequency" dynamodbav:"frequency"`       // daily|weekly|monthly
	RetentionDays   int                           `json:"retentionDays" dynamodbav:"retentionDays"`
	IncrementalSync bool                          `json:"incrementalSync" dynamodbav:"incrementalSync"`
	Notifications   BackupNotificationSettings    `json:"notifications" dynamodbav:"notifications"`
	CustomParams    map[string]string             `json:"customParams" dynamodbav:"customParams"` // Default API parameters
}

// PlatformConnection represents a user's authenticated connection to a platform
type PlatformConnection struct {
	ConnectionID    string                 `json:"connectionId" dynamodbav:"connectionId"`       // connection:uuid
	AccountID       string                 `json:"accountId" dynamodbav:"accountId"`
	UserID          string                 `json:"userId" dynamodbav:"userId"`
	PlatformID      string                 `json:"platformId" dynamodbav:"platformId"`           // References Platform
	Name            string                 `json:"name" dynamodbav:"name"`                       // User-defined name
	Status          string                 `json:"status" dynamodbav:"status"`                   // active|expired|error
	AuthType        string                 `json:"authType" dynamodbav:"authType"`               // oauth|apikey|basic
	Credentials     map[string]interface{} `json:"credentials" dynamodbav:"credentials"`         // Encrypted auth data
	LastConnected   *time.Time             `json:"lastConnected,omitempty" dynamodbav:"lastConnected,omitempty"`
	CreatedAt       time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
	ExpiresAt       *time.Time             `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"` // For OAuth tokens
}

// DefaultSourceType represents a common source configuration for a platform
type DefaultSourceType struct {
	Name        string   `json:"name" dynamodbav:"name"`               // "Contacts", "Orders", "Campaigns"
	Description string   `json:"description" dynamodbav:"description"`
	DataType    string   `json:"dataType" dynamodbav:"dataType"`       // contacts, orders, campaigns
	Endpoints   []string `json:"endpoints" dynamodbav:"endpoints"`     // Which platform endpoints this uses
	Enabled     bool     `json:"enabled" dynamodbav:"enabled"`         // Enabled by default?
	Priority    string   `json:"priority" dynamodbav:"priority"`       // high|medium|low
	Frequency   string   `json:"frequency" dynamodbav:"frequency"`     // daily|weekly|monthly
}

// OAuthConfiguration represents OAuth settings for an integration
type OAuthConfiguration struct {
	AuthURL      string   `json:"authUrl" dynamodbav:"authUrl"`
	TokenURL     string   `json:"tokenUrl" dynamodbav:"tokenUrl"`
	UserInfoURL  string   `json:"userInfoUrl" dynamodbav:"userInfoUrl"`
	Scopes       []string `json:"scopes" dynamodbav:"scopes"`
	ResponseType string   `json:"responseType" dynamodbav:"responseType"`
}

// APIConfiguration represents API configuration for an integration
type APIConfiguration struct {
	BaseURL         string            `json:"baseUrl" dynamodbav:"baseUrl"`
	AuthType        string            `json:"authType" dynamodbav:"authType"`         // oauth|apikey|bearer
	TestEndpoint    string            `json:"testEndpoint" dynamodbav:"testEndpoint"` // Health check endpoint
	RateLimits      RateLimitConfig   `json:"rateLimits" dynamodbav:"rateLimits"`
	RequiredHeaders map[string]string `json:"requiredHeaders" dynamodbav:"requiredHeaders"`
	Version         string            `json:"version" dynamodbav:"version"`
}

// RateLimitConfig represents rate limiting configuration
type RateLimitConfig struct {
	RequestsPerSecond int `json:"requestsPerSecond" dynamodbav:"requestsPerSecond"`
	RequestsPerMinute int `json:"requestsPerMinute" dynamodbav:"requestsPerMinute"`
	RequestsPerHour   int `json:"requestsPerHour" dynamodbav:"requestsPerHour"`
	BurstLimit        int `json:"burstLimit" dynamodbav:"burstLimit"`
}

// PlatformEndpoint represents an endpoint available on a platform (template/capability)
type PlatformEndpoint struct {
	Name            string               `json:"name" dynamodbav:"name"`
	Description     string               `json:"description" dynamodbav:"description"`
	Path            string               `json:"path" dynamodbav:"path"`               // API endpoint path template
	Method          string               `json:"method" dynamodbav:"method"`           // GET, POST, etc.
	DataType        string               `json:"dataType" dynamodbav:"dataType"`       // contacts, orders, files, etc.
	DefaultEnabled  bool                 `json:"defaultEnabled" dynamodbav:"defaultEnabled"`
	DefaultPriority string               `json:"defaultPriority" dynamodbav:"defaultPriority"` // high|medium|low
	DefaultFrequency string              `json:"defaultFrequency" dynamodbav:"defaultFrequency"` // hourly|daily|weekly
	SupportsIncremental bool             `json:"supportsIncremental" dynamodbav:"supportsIncremental"`
	Dependencies    []string             `json:"dependencies" dynamodbav:"dependencies"`     // Other endpoints this depends on
	Parameters      []APIParameter       `json:"parameters" dynamodbav:"parameters"`         // Available query parameters
	ResponseMapping ResponseMapping      `json:"responseMapping" dynamodbav:"responseMapping"` // How to map response data
}

// APIParameter represents a parameter for an API endpoint
type APIParameter struct {
	Name        string `json:"name" dynamodbav:"name"`
	Type        string `json:"type" dynamodbav:"type"`               // string|integer|boolean|datetime
	Required    bool   `json:"required" dynamodbav:"required"`
	Default     string `json:"default" dynamodbav:"default"`
	Description string `json:"description" dynamodbav:"description"`
}

// ResponseMapping represents how to map API response data
type ResponseMapping struct {
	DataPath      string            `json:"dataPath" dynamodbav:"dataPath"`           // JSONPath to data array
	IDField       string            `json:"idField" dynamodbav:"idField"`             // Field containing unique ID
	TimestampField string           `json:"timestampField" dynamodbav:"timestampField"` // Field for incremental sync
	PaginationKey string            `json:"paginationKey" dynamodbav:"paginationKey"` // Pagination parameter
	FieldMappings map[string]string `json:"fieldMappings" dynamodbav:"fieldMappings"` // Custom field mappings
}

// Team represents a team in the system
type Team struct {
	TeamID      string    `json:"teamId" dynamodbav:"teamId"`
	AccountID   string    `json:"accountId" dynamodbav:"accountId"`
	OwnerID     string    `json:"ownerId" dynamodbav:"ownerId"`
	Name        string    `json:"name" dynamodbav:"name"`
	Description string    `json:"description" dynamodbav:"description"`
	Status      string    `json:"status" dynamodbav:"status"` // active|inactive
	CreatedAt   time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

// TeamMember represents the many-to-many relationship between users and teams
type TeamMember struct {
	TeamID      string              `json:"teamId" dynamodbav:"teamId"`
	UserID      string              `json:"userId" dynamodbav:"userId"`
	Role        string              `json:"role" dynamodbav:"role"`               // admin|member|viewer
	Status      string              `json:"status" dynamodbav:"status"`           // active|inactive|invited
	Permissions TeamUserPermissions `json:"permissions" dynamodbav:"permissions"`
	JoinedAt    time.Time           `json:"joinedAt" dynamodbav:"joinedAt"`
	UpdatedAt   time.Time           `json:"updatedAt" dynamodbav:"updatedAt"`
}

// TeamUserPermissions represents permissions for a user within a team
type TeamUserPermissions struct {
	CanManageTeam     bool `json:"canManageTeam" dynamodbav:"canManageTeam"`
	CanInviteMembers  bool `json:"canInviteMembers" dynamodbav:"canInviteMembers"`
	CanRemoveMembers  bool `json:"canRemoveMembers" dynamodbav:"canRemoveMembers"`
	CanManageAccounts bool `json:"canManageAccounts" dynamodbav:"canManageAccounts"`
	CanViewReports    bool `json:"canViewReports" dynamodbav:"canViewReports"`
}

// TeamAccount represents the many-to-many relationship between teams and accounts
type TeamAccount struct {
	TeamID      string              `json:"teamId" dynamodbav:"teamId"`
	AccountID   string              `json:"accountId" dynamodbav:"accountId"`
	Permissions TeamAccountPermissions `json:"permissions" dynamodbav:"permissions"`
	GrantedAt   time.Time           `json:"grantedAt" dynamodbav:"grantedAt"`
	UpdatedAt   time.Time           `json:"updatedAt" dynamodbav:"updatedAt"`
}

// TeamAccountPermissions represents permissions a team has on an account
type TeamAccountPermissions struct {
	CanViewData       bool `json:"canViewData" dynamodbav:"canViewData"`
	CanManageSources  bool `json:"canManageSources" dynamodbav:"canManageSources"`
	CanRunBackups     bool `json:"canRunBackups" dynamodbav:"canRunBackups"`
	CanViewReports    bool `json:"canViewReports" dynamodbav:"canViewReports"`
	CanManageSettings bool `json:"canManageSettings" dynamodbav:"canManageSettings"`
}

// TeamInvitation represents team invitations
type TeamInvitation struct {
	InviteCode  string    `json:"inviteCode" dynamodbav:"inviteCode"`
	TeamID      string    `json:"teamId" dynamodbav:"teamId"`
	Email       string    `json:"email" dynamodbav:"email"`
	Role        string    `json:"role" dynamodbav:"role"`
	InvitedBy   string    `json:"invitedBy" dynamodbav:"invitedBy"`
	Status      string    `json:"status" dynamodbav:"status"` // pending|accepted|expired|cancelled
	CreatedAt   time.Time `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt   time.Time `json:"expiresAt" dynamodbav:"expiresAt"`
}

// Client represents a client in the system (external users accessing via API)
type Client struct {
	ClientID    string                 `json:"clientId" dynamodbav:"clientId"`
	Name        string                 `json:"name" dynamodbav:"name"`
	Email       string                 `json:"email" dynamodbav:"email"`
	Company     string                 `json:"company" dynamodbav:"company"`
	Type        string                 `json:"type" dynamodbav:"type"`        // individual|business|enterprise
	Status      string                 `json:"status" dynamodbav:"status"`    // active|inactive|pending
	Description string                 `json:"description" dynamodbav:"description"`
	Metadata    map[string]interface{} `json:"metadata" dynamodbav:"metadata"`
	CreatedBy   string                 `json:"createdBy" dynamodbav:"createdBy"`
	CreatedAt   int64                  `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   int64                  `json:"updatedAt" dynamodbav:"updatedAt"`
}

// ClientAccount represents the many-to-many relationship between clients and accounts
type ClientAccount struct {
	ClientID    string                   `json:"clientId" dynamodbav:"clientId"`
	AccountID   string                   `json:"accountId" dynamodbav:"accountId"`
	Role        string                   `json:"role" dynamodbav:"role"`        // read|write|admin
	Permissions ClientAccountPermissions `json:"permissions" dynamodbav:"permissions"`
	GrantedBy   string                   `json:"grantedBy" dynamodbav:"grantedBy"`
	GrantedAt   int64                    `json:"grantedAt" dynamodbav:"grantedAt"`
	UpdatedAt   int64                    `json:"updatedAt" dynamodbav:"updatedAt"`
}

// ClientAccountPermissions represents permissions a client has on an account
type ClientAccountPermissions struct {
	CanViewData       bool `json:"canViewData" dynamodbav:"canViewData"`
	CanManageSources  bool `json:"canManageSources" dynamodbav:"canManageSources"`
	CanRunBackups     bool `json:"canRunBackups" dynamodbav:"canRunBackups"`
	CanViewReports    bool `json:"canViewReports" dynamodbav:"canViewReports"`
	CanExportData     bool `json:"canExportData" dynamodbav:"canExportData"`
}

// ClientTeam represents the many-to-many relationship between clients and teams
type ClientTeam struct {
	ClientID    string                 `json:"clientId" dynamodbav:"clientId"`
	TeamID      string                 `json:"teamId" dynamodbav:"teamId"`
	Role        string                 `json:"role" dynamodbav:"role"`        // read|write|admin
	Permissions ClientTeamPermissions  `json:"permissions" dynamodbav:"permissions"`
	GrantedBy   string                 `json:"grantedBy" dynamodbav:"grantedBy"`
	GrantedAt   int64                  `json:"grantedAt" dynamodbav:"grantedAt"`
	UpdatedAt   int64                  `json:"updatedAt" dynamodbav:"updatedAt"`
}

// ClientTeamPermissions represents permissions a client has on a team
type ClientTeamPermissions struct {
	CanViewTeamData   bool `json:"canViewTeamData" dynamodbav:"canViewTeamData"`
	CanViewMembers    bool `json:"canViewMembers" dynamodbav:"canViewMembers"`
	CanViewReports    bool `json:"canViewReports" dynamodbav:"canViewReports"`
}

// ClientPermission represents granular permissions for a client
type ClientPermission struct {
	ClientID   string `json:"clientId" dynamodbav:"clientId"`
	Resource   string `json:"resource" dynamodbav:"resource"`   // account:{id}, team:{id}, global
	Action     string `json:"action" dynamodbav:"action"`       // read, write, delete, admin
	Granted    bool   `json:"granted" dynamodbav:"granted"`
	GrantedBy  string `json:"grantedBy" dynamodbav:"grantedBy"`
	GrantedAt  int64  `json:"grantedAt" dynamodbav:"grantedAt"`
	UpdatedAt  int64  `json:"updatedAt" dynamodbav:"updatedAt"`
}

// ClientInvitation represents client invitations
type ClientInvitation struct {
	InviteCode  string                 `json:"inviteCode" dynamodbav:"inviteCode"`
	Email       string                 `json:"email" dynamodbav:"email"`
	Name        string                 `json:"name" dynamodbav:"name"`
	Company     string                 `json:"company" dynamodbav:"company"`
	Type        string                 `json:"type" dynamodbav:"type"`        // individual|business|enterprise
	Permissions map[string]interface{} `json:"permissions" dynamodbav:"permissions"`
	Message     string                 `json:"message" dynamodbav:"message"`
	InvitedBy   string                 `json:"invitedBy" dynamodbav:"invitedBy"`
	Status      string                 `json:"status" dynamodbav:"status"`    // pending|accepted|expired|cancelled
	CreatedAt   int64                  `json:"createdAt" dynamodbav:"createdAt"`
	ExpiresAt   int64                  `json:"expiresAt" dynamodbav:"expiresAt"`
}

// ========== BILLING & SUBSCRIPTION TYPES ==========

// Subscription represents a billing subscription
type Subscription struct {
	SubscriptionID   string                 `json:"subscriptionId" dynamodbav:"subscriptionId"`
	AccountID        string                 `json:"accountId" dynamodbav:"accountId"`
	StripeCustomerID string                 `json:"stripeCustomerId" dynamodbav:"stripeCustomerId"`
	StripeSubID      string                 `json:"stripeSubId" dynamodbav:"stripeSubId"`
	PlanID           string                 `json:"planId" dynamodbav:"planId"`
	Status           string                 `json:"status" dynamodbav:"status"`           // active|past_due|canceled|unpaid|incomplete
	BillingCycle     string                 `json:"billingCycle" dynamodbav:"billingCycle"` // monthly|yearly
	CurrentPeriodStart time.Time            `json:"currentPeriodStart" dynamodbav:"currentPeriodStart"`
	CurrentPeriodEnd   time.Time            `json:"currentPeriodEnd" dynamodbav:"currentPeriodEnd"`
	TrialStart         *time.Time           `json:"trialStart,omitempty" dynamodbav:"trialStart,omitempty"`
	TrialEnd           *time.Time           `json:"trialEnd,omitempty" dynamodbav:"trialEnd,omitempty"`
	CanceledAt         *time.Time           `json:"canceledAt,omitempty" dynamodbav:"canceledAt,omitempty"`
	CancelAtPeriodEnd  bool                 `json:"cancelAtPeriodEnd" dynamodbav:"cancelAtPeriodEnd"`
	Metadata           map[string]string    `json:"metadata" dynamodbav:"metadata"`
	CreatedAt          time.Time            `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt          time.Time            `json:"updatedAt" dynamodbav:"updatedAt"`
}

// BillingPlan represents a subscription plan
type BillingPlan struct {
	PlanID          string            `json:"planId" dynamodbav:"planId"`
	StripePriceID   string            `json:"stripePriceId" dynamodbav:"stripePriceId"`
	Name            string            `json:"name" dynamodbav:"name"`
	Description     string            `json:"description" dynamodbav:"description"`
	Amount          int64             `json:"amount" dynamodbav:"amount"`             // Amount in cents
	Currency        string            `json:"currency" dynamodbav:"currency"`
	Interval        string            `json:"interval" dynamodbav:"interval"`         // month|year
	IntervalCount   int               `json:"intervalCount" dynamodbav:"intervalCount"` // 1 for monthly, 12 for yearly
	Features        PlanFeatures      `json:"features" dynamodbav:"features"`
	Limits          PlanLimits        `json:"limits" dynamodbav:"limits"`
	TrialDays       int               `json:"trialDays" dynamodbav:"trialDays"`
	Popular         bool              `json:"popular" dynamodbav:"popular"`
	Status          string            `json:"status" dynamodbav:"status"`             // active|inactive|deprecated
	Metadata        map[string]string `json:"metadata" dynamodbav:"metadata"`
	CreatedAt       time.Time         `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt       time.Time         `json:"updatedAt" dynamodbav:"updatedAt"`
}

// PlanFeatures represents features included in a plan
type PlanFeatures struct {
	BasicBackups         bool `json:"basicBackups" dynamodbav:"basicBackups"`
	AdvancedBackups      bool `json:"advancedBackups" dynamodbav:"advancedBackups"`
	DataSync             bool `json:"dataSync" dynamodbav:"dataSync"`
	DataMigration        bool `json:"dataMigration" dynamodbav:"dataMigration"`
	CustomRetention      bool `json:"customRetention" dynamodbav:"customRetention"`
	HierarchicalAccounts bool `json:"hierarchicalAccounts" dynamodbav:"hierarchicalAccounts"`
	WhiteLabel           bool `json:"whiteLabel" dynamodbav:"whiteLabel"`
	PrioritySupport      bool `json:"prioritySupport" dynamodbav:"prioritySupport"`
	APIAccess            bool `json:"apiAccess" dynamodbav:"apiAccess"`
	TeamManagement       bool `json:"teamManagement" dynamodbav:"teamManagement"`
	CustomDomains        bool `json:"customDomains" dynamodbav:"customDomains"`
	AdvancedReporting    bool `json:"advancedReporting" dynamodbav:"advancedReporting"`
	ExternalStorage      bool `json:"externalStorage" dynamodbav:"externalStorage"`
	ComplianceReports    bool `json:"complianceReports" dynamodbav:"complianceReports"`
	AuditTrails          bool `json:"auditTrails" dynamodbav:"auditTrails"`
}

// PlanLimits represents limits for a plan
type PlanLimits struct {
	MaxSources           int `json:"maxSources" dynamodbav:"maxSources"`
	MaxAccounts          int `json:"maxAccounts" dynamodbav:"maxAccounts"`
	MaxTeamMembers       int `json:"maxTeamMembers" dynamodbav:"maxTeamMembers"`
	MaxStorageGB         int `json:"maxStorageGB" dynamodbav:"maxStorageGB"`
	MaxAPICallsPerMonth  int `json:"maxAPICallsPerMonth" dynamodbav:"maxAPICallsPerMonth"`
	MaxBackupsPerMonth   int `json:"maxBackupsPerMonth" dynamodbav:"maxBackupsPerMonth"`
	MaxRetentionDays     int `json:"maxRetentionDays" dynamodbav:"maxRetentionDays"`
	MaxSyncFrequency     int `json:"maxSyncFrequency" dynamodbav:"maxSyncFrequency"` // minutes
}

// Invoice represents a billing invoice
type Invoice struct {
	InvoiceID        string              `json:"invoiceId" dynamodbav:"invoiceId"`
	StripeInvoiceID  string              `json:"stripeInvoiceId" dynamodbav:"stripeInvoiceId"`
	AccountID        string              `json:"accountId" dynamodbav:"accountId"`
	SubscriptionID   string              `json:"subscriptionId" dynamodbav:"subscriptionId"`
	Number           string              `json:"number" dynamodbav:"number"`
	Status           string              `json:"status" dynamodbav:"status"`         // draft|open|paid|void|uncollectible
	AmountDue        int64               `json:"amountDue" dynamodbav:"amountDue"`   // Amount in cents
	AmountPaid       int64               `json:"amountPaid" dynamodbav:"amountPaid"` // Amount in cents
	Currency         string              `json:"currency" dynamodbav:"currency"`
	DueDate          *time.Time          `json:"dueDate,omitempty" dynamodbav:"dueDate,omitempty"`
	PaidAt           *time.Time          `json:"paidAt,omitempty" dynamodbav:"paidAt,omitempty"`
	PeriodStart      time.Time           `json:"periodStart" dynamodbav:"periodStart"`
	PeriodEnd        time.Time           `json:"periodEnd" dynamodbav:"periodEnd"`
	LineItems        []InvoiceLineItem   `json:"lineItems" dynamodbav:"lineItems"`
	TaxAmount        int64               `json:"taxAmount" dynamodbav:"taxAmount"`
	DiscountAmount   int64               `json:"discountAmount" dynamodbav:"discountAmount"`
	InvoicePDF       string              `json:"invoicePdf" dynamodbav:"invoicePdf"`
	CreatedAt        time.Time           `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time           `json:"updatedAt" dynamodbav:"updatedAt"`
}

// InvoiceLineItem represents a line item on an invoice
type InvoiceLineItem struct {
	Description   string `json:"description" dynamodbav:"description"`
	Amount        int64  `json:"amount" dynamodbav:"amount"` // Amount in cents
	Quantity      int    `json:"quantity" dynamodbav:"quantity"`
	PeriodStart   time.Time `json:"periodStart" dynamodbav:"periodStart"`
	PeriodEnd     time.Time `json:"periodEnd" dynamodbav:"periodEnd"`
	Type          string `json:"type" dynamodbav:"type"` // subscription|usage|one_time
}

// PaymentMethod represents a stored payment method
type PaymentMethod struct {
	PaymentMethodID     string    `json:"paymentMethodId" dynamodbav:"paymentMethodId"`
	StripePaymentMethodID string  `json:"stripePaymentMethodId" dynamodbav:"stripePaymentMethodId"`
	AccountID           string    `json:"accountId" dynamodbav:"accountId"`
	Type                string    `json:"type" dynamodbav:"type"`     // card|bank_account|sepa_debit
	IsDefault           bool      `json:"isDefault" dynamodbav:"isDefault"`
	Card                *CardInfo `json:"card,omitempty" dynamodbav:"card,omitempty"`
	Status              string    `json:"status" dynamodbav:"status"` // active|expired|failed
	CreatedAt           time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

// CardInfo represents card information
type CardInfo struct {
	Brand    string `json:"brand" dynamodbav:"brand"`       // visa|mastercard|amex|discover
	Last4    string `json:"last4" dynamodbav:"last4"`
	ExpMonth int    `json:"expMonth" dynamodbav:"expMonth"`
	ExpYear  int    `json:"expYear" dynamodbav:"expYear"`
	Country  string `json:"country" dynamodbav:"country"`
}

// UsageRecord represents usage tracking for billing
type UsageRecord struct {
	RecordID       string    `json:"recordId" dynamodbav:"recordId"`
	AccountID      string    `json:"accountId" dynamodbav:"accountId"`
	SubscriptionID string    `json:"subscriptionId" dynamodbav:"subscriptionId"`
	MetricType     string    `json:"metricType" dynamodbav:"metricType"`     // api_calls|storage_gb|backups|sources
	Quantity       int64     `json:"quantity" dynamodbav:"quantity"`
	Timestamp      time.Time `json:"timestamp" dynamodbav:"timestamp"`
	BillingPeriod  string    `json:"billingPeriod" dynamodbav:"billingPeriod"` // 2024-01 format
	CreatedAt      time.Time `json:"createdAt" dynamodbav:"createdAt"`
}

// BillingCustomer represents a Stripe customer
type BillingCustomer struct {
	CustomerID       string            `json:"customerId" dynamodbav:"customerId"`
	StripeCustomerID string            `json:"stripeCustomerId" dynamodbav:"stripeCustomerId"`
	AccountID        string            `json:"accountId" dynamodbav:"accountId"`
	Email            string            `json:"email" dynamodbav:"email"`
	Name             string            `json:"name" dynamodbav:"name"`
	Company          string            `json:"company" dynamodbav:"company"`
	Address          *BillingAddress   `json:"address,omitempty" dynamodbav:"address,omitempty"`
	TaxInfo          *TaxInfo          `json:"taxInfo,omitempty" dynamodbav:"taxInfo,omitempty"`
	Metadata         map[string]string `json:"metadata" dynamodbav:"metadata"`
	CreatedAt        time.Time         `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        time.Time         `json:"updatedAt" dynamodbav:"updatedAt"`
}

// BillingAddress represents a billing address
type BillingAddress struct {
	Line1      string `json:"line1" dynamodbav:"line1"`
	Line2      string `json:"line2" dynamodbav:"line2"`
	City       string `json:"city" dynamodbav:"city"`
	State      string `json:"state" dynamodbav:"state"`
	PostalCode string `json:"postalCode" dynamodbav:"postalCode"`
	Country    string `json:"country" dynamodbav:"country"`
}

// TaxInfo represents tax information
type TaxInfo struct {
	VATNumber    string `json:"vatNumber" dynamodbav:"vatNumber"`
	TaxExempt    bool   `json:"taxExempt" dynamodbav:"taxExempt"`
	TaxPercent   float64 `json:"taxPercent" dynamodbav:"taxPercent"`
	BusinessType string `json:"businessType" dynamodbav:"businessType"` // individual|business|non_profit
}

// CognitoGroup represents AWS Cognito user groups for plan management
type CognitoGroup struct {
	GroupName   string    `json:"groupName" dynamodbav:"groupName"`     // free_plan|pro_plan|enterprise_plan
	Description string    `json:"description" dynamodbav:"description"`
	PlanID      string    `json:"planId" dynamodbav:"planId"`
	Precedence  int       `json:"precedence" dynamodbav:"precedence"`   // Lower number = higher precedence
	CreatedAt   time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

// UserGroup represents user's group membership
type UserGroup struct {
	UserID    string    `json:"userId" dynamodbav:"userId"`
	GroupName string    `json:"groupName" dynamodbav:"groupName"`
	AddedAt   time.Time `json:"addedAt" dynamodbav:"addedAt"`
}

// BillingEvent represents billing-related events
type BillingEvent struct {
	EventID        string                 `json:"eventId" dynamodbav:"eventId"`
	AccountID      string                 `json:"accountId" dynamodbav:"accountId"`
	EventType      string                 `json:"eventType" dynamodbav:"eventType"`     // subscription_created|payment_succeeded|payment_failed
	StripeEventID  string                 `json:"stripeEventId" dynamodbav:"stripeEventId"`
	Data           map[string]interface{} `json:"data" dynamodbav:"data"`
	Processed      bool                   `json:"processed" dynamodbav:"processed"`
	ProcessedAt    *time.Time             `json:"processedAt,omitempty" dynamodbav:"processedAt,omitempty"`
	ErrorMessage   string                 `json:"errorMessage,omitempty" dynamodbav:"errorMessage,omitempty"`
	CreatedAt      time.Time              `json:"createdAt" dynamodbav:"createdAt"`
}

// BillingSettings represents billing configuration
type BillingSettings struct {
	SettingID         string    `json:"settingId" dynamodbav:"settingId"`
	AutoPayEnabled    bool      `json:"autoPayEnabled" dynamodbav:"autoPayEnabled"`
	PaymentRetryCount int       `json:"paymentRetryCount" dynamodbav:"paymentRetryCount"`
	GracePeriodDays   int       `json:"gracePeriodDays" dynamodbav:"gracePeriodDays"`
	TaxRates          []TaxRate `json:"taxRates" dynamodbav:"taxRates"`
	CreatedAt         time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

// TaxRate represents tax rate configuration
type TaxRate struct {
	Country     string  `json:"country" dynamodbav:"country"`
	State       string  `json:"state" dynamodbav:"state"`
	TaxType     string  `json:"taxType" dynamodbav:"taxType"` // sales_tax|vat|gst
	Rate        float64 `json:"rate" dynamodbav:"rate"`       // 0.08 for 8%
	Description string  `json:"description" dynamodbav:"description"`
}

