package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/listbackup/api/internal/types"
)

type BillingService struct {
	dynamoClient *dynamodb.Client
	tableName    string
}

func NewBillingService(dynamoClient *dynamodb.Client, tableName string) *BillingService {
	return &BillingService{
		dynamoClient: dynamoClient,
		tableName:    tableName,
	}
}

// ============ SUBSCRIPTION MANAGEMENT ============

// CreateSubscription creates a new subscription
func (s *BillingService) CreateSubscription(ctx context.Context, accountID, planID, stripeCustomerID, stripeSubID string) (*types.Subscription, error) {
	subscription := &types.Subscription{
		SubscriptionID:     fmt.Sprintf("sub_%s", uuid.New().String()),
		AccountID:          accountID,
		StripeCustomerID:   stripeCustomerID,
		StripeSubID:        stripeSubID,
		PlanID:             planID,
		Status:             "active",
		BillingCycle:       "monthly",
		CurrentPeriodStart: time.Now(),
		CurrentPeriodEnd:   time.Now().AddDate(0, 1, 0),
		CancelAtPeriodEnd:  false,
		Metadata:           make(map[string]string),
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	item, err := attributevalue.MarshalMap(subscription)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal subscription: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	return subscription, nil
}

// GetSubscription retrieves a subscription by ID
func (s *BillingService) GetSubscription(ctx context.Context, subscriptionID string) (*types.Subscription, error) {
	result, err := s.dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]types.AttributeValue{
			"subscriptionId": &types.AttributeValueMemberS{Value: subscriptionID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("subscription not found")
	}

	var subscription types.Subscription
	err = attributevalue.UnmarshalMap(result.Item, &subscription)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal subscription: %w", err)
	}

	return &subscription, nil
}

// GetSubscriptionByAccount retrieves a subscription by account ID
func (s *BillingService) GetSubscriptionByAccount(ctx context.Context, accountID string) (*types.Subscription, error) {
	result, err := s.dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		IndexName:              aws.String("AccountIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":accountId": &types.AttributeValueMemberS{Value: accountID},
		},
		Limit: aws.Int32(1),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query subscription by account: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, fmt.Errorf("subscription not found for account")
	}

	var subscription types.Subscription
	err = attributevalue.UnmarshalMap(result.Items[0], &subscription)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal subscription: %w", err)
	}

	return &subscription, nil
}

// UpdateSubscription updates an existing subscription
func (s *BillingService) UpdateSubscription(ctx context.Context, subscriptionID string, updates map[string]interface{}) error {
	updateExpression := "SET updatedAt = :updatedAt"
	expressionAttributeValues := map[string]types.AttributeValue{
		":updatedAt": &types.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
	}

	for key, value := range updates {
		updateExpression += fmt.Sprintf(", %s = :%s", key, key)
		av, err := attributevalue.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal update value for %s: %w", key, err)
		}
		expressionAttributeValues[fmt.Sprintf(":%s", key)] = av
	}

	_, err := s.dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]types.AttributeValue{
			"subscriptionId": &types.AttributeValueMemberS{Value: subscriptionID},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
	})
	if err != nil {
		return fmt.Errorf("failed to update subscription: %w", err)
	}

	return nil
}

// CancelSubscription cancels a subscription
func (s *BillingService) CancelSubscription(ctx context.Context, subscriptionID string, cancelAtPeriodEnd bool) error {
	updates := map[string]interface{}{
		"status":            "canceled",
		"cancelAtPeriodEnd": cancelAtPeriodEnd,
		"canceledAt":        time.Now().Format(time.RFC3339),
	}

	return s.UpdateSubscription(ctx, subscriptionID, updates)
}

// ============ BILLING PLAN MANAGEMENT ============

// CreateBillingPlan creates a new billing plan
func (s *BillingService) CreateBillingPlan(ctx context.Context, plan *types.BillingPlan) error {
	if plan.PlanID == "" {
		plan.PlanID = fmt.Sprintf("plan_%s", uuid.New().String())
	}
	plan.CreatedAt = time.Now()
	plan.UpdatedAt = time.Now()

	item, err := attributevalue.MarshalMap(plan)
	if err != nil {
		return fmt.Errorf("failed to marshal billing plan: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to create billing plan: %w", err)
	}

	return nil
}

// GetBillingPlan retrieves a billing plan by ID
func (s *BillingService) GetBillingPlan(ctx context.Context, planID string) (*types.BillingPlan, error) {
	result, err := s.dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]types.AttributeValue{
			"planId": &types.AttributeValueMemberS{Value: planID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get billing plan: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("billing plan not found")
	}

	var plan types.BillingPlan
	err = attributevalue.UnmarshalMap(result.Item, &plan)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal billing plan: %w", err)
	}

	return &plan, nil
}

// ListBillingPlans retrieves all active billing plans
func (s *BillingService) ListBillingPlans(ctx context.Context) ([]types.BillingPlan, error) {
	result, err := s.dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		IndexName:              aws.String("StatusIndex"),
		KeyConditionExpression: aws.String("#status = :status"),
		ExpressionAttributeNames: map[string]string{
			"#status": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":status": &types.AttributeValueMemberS{Value: "active"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list billing plans: %w", err)
	}

	var plans []types.BillingPlan
	for _, item := range result.Items {
		var plan types.BillingPlan
		err = attributevalue.UnmarshalMap(item, &plan)
		if err != nil {
			log.Printf("Failed to unmarshal billing plan: %v", err)
			continue
		}
		plans = append(plans, plan)
	}

	return plans, nil
}

// ============ USAGE TRACKING ============

// RecordUsage records usage for billing
func (s *BillingService) RecordUsage(ctx context.Context, accountID, subscriptionID, metricType string, quantity int64) error {
	now := time.Now()
	usageRecord := &types.UsageRecord{
		RecordID:       fmt.Sprintf("usage_%s", uuid.New().String()),
		AccountID:      accountID,
		SubscriptionID: subscriptionID,
		MetricType:     metricType,
		Quantity:       quantity,
		Timestamp:      now,
		BillingPeriod:  now.Format("2006-01"),
		CreatedAt:      now,
	}

	item, err := attributevalue.MarshalMap(usageRecord)
	if err != nil {
		return fmt.Errorf("failed to marshal usage record: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to record usage: %w", err)
	}

	return nil
}

// GetUsageForPeriod retrieves usage records for a billing period
func (s *BillingService) GetUsageForPeriod(ctx context.Context, accountID, billingPeriod string) ([]types.UsageRecord, error) {
	result, err := s.dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		IndexName:              aws.String("AccountBillingPeriodIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId AND billingPeriod = :billingPeriod"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":accountId":      &types.AttributeValueMemberS{Value: accountID},
			":billingPeriod": &types.AttributeValueMemberS{Value: billingPeriod},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get usage for period: %w", err)
	}

	var usageRecords []types.UsageRecord
	for _, item := range result.Items {
		var record types.UsageRecord
		err = attributevalue.UnmarshalMap(item, &record)
		if err != nil {
			log.Printf("Failed to unmarshal usage record: %v", err)
			continue
		}
		usageRecords = append(usageRecords, record)
	}

	return usageRecords, nil
}

// ============ INVOICE MANAGEMENT ============

// CreateInvoice creates a new invoice
func (s *BillingService) CreateInvoice(ctx context.Context, invoice *types.Invoice) error {
	if invoice.InvoiceID == "" {
		invoice.InvoiceID = fmt.Sprintf("inv_%s", uuid.New().String())
	}
	invoice.CreatedAt = time.Now()
	invoice.UpdatedAt = time.Now()

	item, err := attributevalue.MarshalMap(invoice)
	if err != nil {
		return fmt.Errorf("failed to marshal invoice: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to create invoice: %w", err)
	}

	return nil
}

// GetInvoice retrieves an invoice by ID
func (s *BillingService) GetInvoice(ctx context.Context, invoiceID string) (*types.Invoice, error) {
	result, err := s.dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]types.AttributeValue{
			"invoiceId": &types.AttributeValueMemberS{Value: invoiceID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("invoice not found")
	}

	var invoice types.Invoice
	err = attributevalue.UnmarshalMap(result.Item, &invoice)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal invoice: %w", err)
	}

	return &invoice, nil
}

// ListInvoices retrieves invoices for an account
func (s *BillingService) ListInvoices(ctx context.Context, accountID string) ([]types.Invoice, error) {
	result, err := s.dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		IndexName:              aws.String("AccountIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":accountId": &types.AttributeValueMemberS{Value: accountID},
		},
		ScanIndexForward: aws.Bool(false), // Most recent first
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list invoices: %w", err)
	}

	var invoices []types.Invoice
	for _, item := range result.Items {
		var invoice types.Invoice
		err = attributevalue.UnmarshalMap(item, &invoice)
		if err != nil {
			log.Printf("Failed to unmarshal invoice: %v", err)
			continue
		}
		invoices = append(invoices, invoice)
	}

	return invoices, nil
}

// ============ PAYMENT METHOD MANAGEMENT ============

// CreatePaymentMethod creates a new payment method
func (s *BillingService) CreatePaymentMethod(ctx context.Context, paymentMethod *types.PaymentMethod) error {
	if paymentMethod.PaymentMethodID == "" {
		paymentMethod.PaymentMethodID = fmt.Sprintf("pm_%s", uuid.New().String())
	}
	paymentMethod.CreatedAt = time.Now()
	paymentMethod.UpdatedAt = time.Now()

	item, err := attributevalue.MarshalMap(paymentMethod)
	if err != nil {
		return fmt.Errorf("failed to marshal payment method: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to create payment method: %w", err)
	}

	return nil
}

// GetPaymentMethod retrieves a payment method by ID
func (s *BillingService) GetPaymentMethod(ctx context.Context, paymentMethodID string) (*types.PaymentMethod, error) {
	result, err := s.dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]types.AttributeValue{
			"paymentMethodId": &types.AttributeValueMemberS{Value: paymentMethodID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get payment method: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("payment method not found")
	}

	var paymentMethod types.PaymentMethod
	err = attributevalue.UnmarshalMap(result.Item, &paymentMethod)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal payment method: %w", err)
	}

	return &paymentMethod, nil
}

// ListPaymentMethods retrieves payment methods for an account
func (s *BillingService) ListPaymentMethods(ctx context.Context, accountID string) ([]types.PaymentMethod, error) {
	result, err := s.dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		IndexName:              aws.String("AccountIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":accountId": &types.AttributeValueMemberS{Value: accountID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list payment methods: %w", err)
	}

	var paymentMethods []types.PaymentMethod
	for _, item := range result.Items {
		var pm types.PaymentMethod
		err = attributevalue.UnmarshalMap(item, &pm)
		if err != nil {
			log.Printf("Failed to unmarshal payment method: %v", err)
			continue
		}
		paymentMethods = append(paymentMethods, pm)
	}

	return paymentMethods, nil
}

// ============ BILLING EVENTS ============

// RecordBillingEvent records a billing event
func (s *BillingService) RecordBillingEvent(ctx context.Context, event *types.BillingEvent) error {
	if event.EventID == "" {
		event.EventID = fmt.Sprintf("evt_%s", uuid.New().String())
	}
	event.CreatedAt = time.Now()

	item, err := attributevalue.MarshalMap(event)
	if err != nil {
		return fmt.Errorf("failed to marshal billing event: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to record billing event: %w", err)
	}

	return nil
}

// ============ CUSTOMER MANAGEMENT ============

// CreateBillingCustomer creates a new billing customer
func (s *BillingService) CreateBillingCustomer(ctx context.Context, customer *types.BillingCustomer) error {
	if customer.CustomerID == "" {
		customer.CustomerID = fmt.Sprintf("cus_%s", uuid.New().String())
	}
	customer.CreatedAt = time.Now()
	customer.UpdatedAt = time.Now()

	item, err := attributevalue.MarshalMap(customer)
	if err != nil {
		return fmt.Errorf("failed to marshal billing customer: %w", err)
	}

	_, err = s.dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("failed to create billing customer: %w", err)
	}

	return nil
}

// GetBillingCustomer retrieves a billing customer by account ID
func (s *BillingService) GetBillingCustomer(ctx context.Context, accountID string) (*types.BillingCustomer, error) {
	result, err := s.dynamoClient.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		IndexName:              aws.String("AccountIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":accountId": &types.AttributeValueMemberS{Value: accountID},
		},
		Limit: aws.Int32(1),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get billing customer: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, fmt.Errorf("billing customer not found for account")
	}

	var customer types.BillingCustomer
	err = attributevalue.UnmarshalMap(result.Items[0], &customer)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal billing customer: %w", err)
	}

	return &customer, nil
}

// ============ UTILITY FUNCTIONS ============

// CheckPlanLimits checks if an account has exceeded plan limits
func (s *BillingService) CheckPlanLimits(ctx context.Context, accountID string) (*types.PlanLimits, error) {
	subscription, err := s.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

	plan, err := s.GetBillingPlan(ctx, subscription.PlanID)
	if err != nil {
		return nil, fmt.Errorf("failed to get billing plan: %w", err)
	}

	return &plan.Limits, nil
}

// IsFeatureAvailable checks if a feature is available for an account
func (s *BillingService) IsFeatureAvailable(ctx context.Context, accountID, feature string) (bool, error) {
	subscription, err := s.GetSubscriptionByAccount(ctx, accountID)
	if err != nil {
		return false, fmt.Errorf("failed to get subscription: %w", err)
	}

	plan, err := s.GetBillingPlan(ctx, subscription.PlanID)
	if err != nil {
		return false, fmt.Errorf("failed to get billing plan: %w", err)
	}

	// Use reflection or switch to check feature availability
	switch feature {
	case "basicBackups":
		return plan.Features.BasicBackups, nil
	case "advancedBackups":
		return plan.Features.AdvancedBackups, nil
	case "dataSync":
		return plan.Features.DataSync, nil
	case "dataMigration":
		return plan.Features.DataMigration, nil
	case "hierarchicalAccounts":
		return plan.Features.HierarchicalAccounts, nil
	case "whiteLabel":
		return plan.Features.WhiteLabel, nil
	case "apiAccess":
		return plan.Features.APIAccess, nil
	case "teamManagement":
		return plan.Features.TeamManagement, nil
	case "customDomains":
		return plan.Features.CustomDomains, nil
	case "advancedReporting":
		return plan.Features.AdvancedReporting, nil
	case "externalStorage":
		return plan.Features.ExternalStorage, nil
	case "complianceReports":
		return plan.Features.ComplianceReports, nil
	case "auditTrails":
		return plan.Features.AuditTrails, nil
	default:
		return false, fmt.Errorf("unknown feature: %s", feature)
	}
}