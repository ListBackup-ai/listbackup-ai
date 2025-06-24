package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/internal/types"
	"github.com/listbackup/api/internal/util"
)

type EnterpriseRequest struct {
	Type         string                 `json:"type"` // "custom_plan", "quote_request", "net_terms_setup"
	CompanyInfo  CompanyInfo            `json:"companyInfo"`
	Requirements EnterpriseRequirements `json:"requirements"`
	ContactInfo  ContactInfo            `json:"contactInfo"`
}

type CompanyInfo struct {
	Name          string `json:"name"`
	Industry      string `json:"industry"`
	Size          string `json:"size"`          // "1-10", "11-50", "51-200", "201-1000", "1000+"
	Revenue       string `json:"revenue"`       // Revenue range
	Country       string `json:"country"`
	ComplianceNeeds []string `json:"complianceNeeds"` // SOC2, GDPR, HIPAA, etc.
}

type EnterpriseRequirements struct {
	EstimatedUsers        int      `json:"estimatedUsers"`
	EstimatedSources      int      `json:"estimatedSources"`
	EstimatedStorageGB    int      `json:"estimatedStorageGb"`
	EstimatedAPICallsPerMonth int  `json:"estimatedApiCallsPerMonth"`
	RequiredFeatures      []string `json:"requiredFeatures"`
	PreferredBillingCycle string   `json:"preferredBillingCycle"` // monthly, quarterly, yearly
	BudgetRange           string   `json:"budgetRange"`
	SpecialRequirements   []string `json:"specialRequirements"`
	IntegrationNeeds      []string `json:"integrationNeeds"`
}

type ContactInfo struct {
	Name            string `json:"name"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	Title           string `json:"title"`
	PreferredContact string `json:"preferredContact"` // email, phone, video_call
	Timezone        string `json:"timezone"`
	Urgency         string `json:"urgency"` // low, medium, high, urgent
}

type EnterpriseResponse struct {
	RequestID       string                `json:"requestId"`
	Status          string                `json:"status"`
	EstimatedQuote  *EnterpriseQuote      `json:"estimatedQuote,omitempty"`
	NextSteps       []NextStep            `json:"nextSteps"`
	ContactExpectation string             `json:"contactExpectation"`
}

type EnterpriseQuote struct {
	BasePrice           float64            `json:"basePrice"`
	CustomizationFee    float64            `json:"customizationFee"`
	SetupFee            float64            `json:"setupFee"`
	MonthlyTotal        float64            `json:"monthlyTotal"`
	YearlyTotal         float64            `json:"yearlyTotal"`
	Discounts           []Discount         `json:"discounts"`
	IncludedFeatures    []string           `json:"includedFeatures"`
	CustomLimits        map[string]int     `json:"customLimits"`
	PaymentTerms        PaymentTerms       `json:"paymentTerms"`
	ValidUntil          time.Time          `json:"validUntil"`
}

type Discount struct {
	Type        string  `json:"type"`        // volume, yearly, multi_year, pilot
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`      // Dollar amount
	Percentage  float64 `json:"percentage"`  // Percentage discount
}

type PaymentTerms struct {
	NetTerms        int    `json:"netTerms"`        // 30, 60, 90 days
	PaymentMethods  []string `json:"paymentMethods"` // wire, ach, check, credit_card
	RequiresPO      bool   `json:"requiresPo"`      // Purchase order required
	InvoiceSchedule string `json:"invoiceSchedule"` // monthly, quarterly, yearly
}

type NextStep struct {
	Step        string `json:"step"`
	Description string `json:"description"`
	Timeline    string `json:"timeline"`
	Owner       string `json:"owner"` // customer, sales, engineering
}

var (
	billingService *services.BillingService
	tableName      string
)

func init() {
	tableName = os.Getenv("DYNAMODB_TABLE")
	
	if tableName == "" {
		log.Fatal("DYNAMODB_TABLE environment variable is required")
	}

	// Initialize AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}

	// Initialize services
	dynamoClient := dynamodb.NewFromConfig(cfg)
	billingService = services.NewBillingService(dynamoClient, tableName)
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Enterprise billing request: %+v", event)

	// Extract auth context
	userID, accountID := extractAuthContext(event)
	if userID == "" || accountID == "" {
		return util.CreateErrorResponse(401, "Unauthorized")
	}

	// Parse request body
	var req EnterpriseRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return util.CreateErrorResponse(400, "Invalid request body")
	}

	// Validate required fields
	if err := validateEnterpriseRequest(req); err != nil {
		return util.CreateErrorResponse(400, err.Error())
	}

	// Process request based on type
	var response EnterpriseResponse
	var err error

	switch req.Type {
	case "custom_plan":
		response, err = handleCustomPlanRequest(ctx, req, accountID)
	case "quote_request":
		response, err = handleQuoteRequest(ctx, req, accountID)
	case "net_terms_setup":
		response, err = handleNetTermsSetup(ctx, req, accountID)
	default:
		return util.CreateErrorResponse(400, "Invalid request type")
	}

	if err != nil {
		log.Printf("Failed to process enterprise request: %v", err)
		return util.CreateErrorResponse(500, "Failed to process request")
	}

	// Store the enterprise request for follow-up
	err = storeEnterpriseRequest(ctx, req, response.RequestID, accountID, userID)
	if err != nil {
		log.Printf("Failed to store enterprise request: %v", err)
		// Don't fail the response for this
	}

	responseBody, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Methods": "POST,OPTIONS",
		},
		Body: string(responseBody),
	}, nil
}

func extractAuthContext(event events.APIGatewayProxyRequest) (string, string) {
	var userID, accountID string

	// Try lambda authorizer context first
	if event.RequestContext.Authorizer.Lambda != nil {
		if lambdaContext, ok := event.RequestContext.Authorizer.Lambda.(map[string]interface{}); ok {
			if uid, exists := lambdaContext["userId"]; exists {
				if uidStr, ok := uid.(string); ok {
					userID = uidStr
				}
			}
			if aid, exists := lambdaContext["accountId"]; exists {
				if aidStr, ok := aid.(string); ok {
					accountID = aidStr
				}
			}
		}
	}

	// Fallback to direct authorizer context
	if userID == "" {
		if uid, exists := event.RequestContext.Authorizer["userId"]; exists {
			if uidStr, ok := uid.(string); ok {
				userID = uidStr
			}
		}
	}
	if accountID == "" {
		if aid, exists := event.RequestContext.Authorizer["accountId"]; exists {
			if aidStr, ok := aid.(string); ok {
				accountID = aidStr
			}
		}
	}

	return userID, accountID
}

func validateEnterpriseRequest(req EnterpriseRequest) error {
	if req.Type == "" {
		return fmt.Errorf("request type is required")
	}
	if req.CompanyInfo.Name == "" {
		return fmt.Errorf("company name is required")
	}
	if req.ContactInfo.Name == "" {
		return fmt.Errorf("contact name is required")
	}
	if req.ContactInfo.Email == "" {
		return fmt.Errorf("contact email is required")
	}
	return nil
}

func handleCustomPlanRequest(ctx context.Context, req EnterpriseRequest, accountID string) (EnterpriseResponse, error) {
	requestID := generateRequestID("custom_plan")
	
	// Generate estimated quote based on requirements
	quote := generateCustomQuote(req.Requirements)
	
	nextSteps := []NextStep{
		{
			Step:        "Requirements Review",
			Description: "Our solutions engineer will review your requirements and prepare a detailed proposal",
			Timeline:    "1-2 business days",
			Owner:       "sales",
		},
		{
			Step:        "Technical Discussion",
			Description: "Schedule a technical call to discuss implementation details",
			Timeline:    "3-5 business days",
			Owner:       "engineering",
		},
		{
			Step:        "Custom Plan Creation",
			Description: "Create and deploy your custom plan configuration",
			Timeline:    "1-2 weeks",
			Owner:       "engineering",
		},
	}

	return EnterpriseResponse{
		RequestID:          requestID,
		Status:             "received",
		EstimatedQuote:     &quote,
		NextSteps:          nextSteps,
		ContactExpectation: "Our enterprise team will contact you within 24 hours to discuss your requirements.",
	}, nil
}

func handleQuoteRequest(ctx context.Context, req EnterpriseRequest, accountID string) (EnterpriseResponse, error) {
	requestID := generateRequestID("quote")
	
	nextSteps := []NextStep{
		{
			Step:        "Discovery Call",
			Description: "Schedule a call to understand your specific needs and use cases",
			Timeline:    "1-2 business days",
			Owner:       "sales",
		},
		{
			Step:        "Quote Preparation",
			Description: "Prepare a detailed quote based on your requirements",
			Timeline:    "2-3 business days",
			Owner:       "sales",
		},
		{
			Step:        "Quote Review",
			Description: "Present and review the quote with your team",
			Timeline:    "1 week",
			Owner:       "customer",
		},
	}

	return EnterpriseResponse{
		RequestID:          requestID,
		Status:             "received",
		NextSteps:          nextSteps,
		ContactExpectation: "Our sales team will reach out within 24 hours to schedule a discovery call.",
	}, nil
}

func handleNetTermsSetup(ctx context.Context, req EnterpriseRequest, accountID string) (EnterpriseResponse, error) {
	requestID := generateRequestID("net_terms")
	
	nextSteps := []NextStep{
		{
			Step:        "Credit Application",
			Description: "Complete credit application and provide required documentation",
			Timeline:    "1-2 business days",
			Owner:       "customer",
		},
		{
			Step:        "Credit Review",
			Description: "Review credit application and company financials",
			Timeline:    "3-5 business days",
			Owner:       "sales",
		},
		{
			Step:        "NET Terms Approval",
			Description: "Approval and setup of NET terms billing",
			Timeline:    "1-2 business days",
			Owner:       "sales",
		},
	}

	return EnterpriseResponse{
		RequestID:          requestID,
		Status:             "received",
		NextSteps:          nextSteps,
		ContactExpectation: "Our billing team will send you the credit application within 24 hours.",
	}, nil
}

func generateCustomQuote(requirements EnterpriseRequirements) EnterpriseQuote {
	// Base pricing calculation
	basePrice := 199.0 // Enterprise base price
	
	// Volume-based pricing adjustments
	if requirements.EstimatedUsers > 100 {
		basePrice = 299.0
	}
	if requirements.EstimatedUsers > 500 {
		basePrice = 499.0
	}
	
	// Custom limits calculation
	customLimits := map[string]int{
		"maxSources":           requirements.EstimatedSources,
		"maxStorageGB":        requirements.EstimatedStorageGB,
		"maxAPICallsPerMonth": requirements.EstimatedAPICallsPerMonth,
		"maxTeamMembers":      requirements.EstimatedUsers,
		"maxRetentionDays":    365,
	}
	
	// Setup and customization fees
	setupFee := 2500.0
	customizationFee := 0.0
	
	// Calculate customization fee based on special requirements
	for _, requirement := range requirements.SpecialRequirements {
		switch requirement {
		case "custom_integration":
			customizationFee += 5000.0
		case "custom_reporting":
			customizationFee += 2500.0
		case "sso_integration":
			customizationFee += 1500.0
		case "custom_domain_setup":
			customizationFee += 1000.0
		}
	}
	
	// Discounts
	discounts := []Discount{}
	
	// Multi-year discount
	if requirements.PreferredBillingCycle == "yearly" {
		discounts = append(discounts, Discount{
			Type:        "yearly",
			Description: "Annual billing discount",
			Percentage:  20.0,
			Amount:      basePrice * 12 * 0.2,
		})
	}
	
	// Volume discount for large teams
	if requirements.EstimatedUsers > 200 {
		discounts = append(discounts, Discount{
			Type:        "volume",
			Description: "Volume discount for large team",
			Percentage:  15.0,
			Amount:      basePrice * 0.15,
		})
	}
	
	// Calculate totals
	discountAmount := 0.0
	for _, discount := range discounts {
		discountAmount += discount.Amount
	}
	
	monthlyTotal := basePrice - (discountAmount / 12)
	yearlyTotal := monthlyTotal * 12
	
	// Payment terms
	paymentTerms := PaymentTerms{
		NetTerms:        30,
		PaymentMethods:  []string{"wire", "ach", "check"},
		RequiresPO:      true,
		InvoiceSchedule: "monthly",
	}
	
	if requirements.PreferredBillingCycle == "quarterly" {
		paymentTerms.InvoiceSchedule = "quarterly"
	} else if requirements.PreferredBillingCycle == "yearly" {
		paymentTerms.InvoiceSchedule = "yearly"
	}
	
	// Included features
	includedFeatures := []string{
		"All Enterprise features",
		"Unlimited sources and storage",
		"24/7 priority support",
		"Dedicated customer success manager",
		"Custom integrations",
		"Advanced compliance reporting",
		"SSO integration",
		"Custom branding",
		"API access with higher rate limits",
		"Multi-region deployment options",
	}
	
	return EnterpriseQuote{
		BasePrice:        basePrice,
		CustomizationFee: customizationFee,
		SetupFee:         setupFee,
		MonthlyTotal:     monthlyTotal,
		YearlyTotal:      yearlyTotal,
		Discounts:        discounts,
		IncludedFeatures: includedFeatures,
		CustomLimits:     customLimits,
		PaymentTerms:     paymentTerms,
		ValidUntil:       time.Now().AddDate(0, 0, 30), // Valid for 30 days
	}
}

func generateRequestID(requestType string) string {
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%s_%d", requestType, timestamp)
}

func storeEnterpriseRequest(ctx context.Context, req EnterpriseRequest, requestID, accountID, userID string) error {
	// Create enterprise request record
	enterpriseRecord := map[string]interface{}{
		"requestId":    requestID,
		"accountId":    accountID,
		"userId":       userID,
		"type":         req.Type,
		"companyInfo":  req.CompanyInfo,
		"requirements": req.Requirements,
		"contactInfo":  req.ContactInfo,
		"status":       "received",
		"createdAt":    time.Now(),
		"followUpBy":   time.Now().AddDate(0, 0, 1), // Follow up in 1 day
	}
	
	// Store in DynamoDB (would use proper table structure in production)
	log.Printf("Storing enterprise request: %s for account: %s", requestID, accountID)
	
	// In production, this would actually store to DynamoDB
	// For now, just log the details
	recordJSON, _ := json.Marshal(enterpriseRecord)
	log.Printf("Enterprise request data: %s", string(recordJSON))
	
	return nil
}

func main() {
	lambda.Start(handler)
}