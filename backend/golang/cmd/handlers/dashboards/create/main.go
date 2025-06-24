package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
)

type CreateDashboardHandler struct {
	db *dynamodb.DynamoDB
}

type Dashboard struct {
	DashboardID string                 `json:"dashboardId" dynamodbav:"dashboardId"`
	AccountID   string                 `json:"accountId" dynamodbav:"accountId"`
	UserID      string                 `json:"userId" dynamodbav:"userId"`
	Name        string                 `json:"name" dynamodbav:"name"`
	Description string                 `json:"description,omitempty" dynamodbav:"description,omitempty"`
	IsDefault   bool                   `json:"isDefault" dynamodbav:"isDefault"`
	IsShared    bool                   `json:"isShared" dynamodbav:"isShared"`
	Layout      DashboardLayout        `json:"layout" dynamodbav:"layout"`
	Widgets     []DashboardWidget      `json:"widgets" dynamodbav:"widgets"`
	Settings    DashboardSettings      `json:"settings" dynamodbav:"settings"`
	Permissions []DashboardPermission  `json:"permissions,omitempty" dynamodbav:"permissions,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	CreatedAt   time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type DashboardLayout struct {
	Type         string                 `json:"type" dynamodbav:"type"` // "grid", "freeform", "tabs"
	Columns      int                    `json:"columns" dynamodbav:"columns"`
	RowHeight    int                    `json:"rowHeight" dynamodbav:"rowHeight"`
	Margin       [2]int                 `json:"margin" dynamodbav:"margin"`
	Padding      [2]int                 `json:"padding" dynamodbav:"padding"`
	Responsive   bool                   `json:"responsive" dynamodbav:"responsive"`
	Breakpoints  map[string]interface{} `json:"breakpoints,omitempty" dynamodbav:"breakpoints,omitempty"`
}

type DashboardWidget struct {
	WidgetID     string                 `json:"widgetId" dynamodbav:"widgetId"`
	Type         string                 `json:"type" dynamodbav:"type"` // "chart", "metric", "table", "list", "custom"
	Title        string                 `json:"title" dynamodbav:"title"`
	Position     WidgetPosition         `json:"position" dynamodbav:"position"`
	Size         WidgetSize             `json:"size" dynamodbav:"size"`
	DataSource   WidgetDataSource       `json:"dataSource" dynamodbav:"dataSource"`
	Config       map[string]interface{} `json:"config" dynamodbav:"config"`
	Filters      []WidgetFilter         `json:"filters,omitempty" dynamodbav:"filters,omitempty"`
	Refresh      WidgetRefresh          `json:"refresh" dynamodbav:"refresh"`
	Visibility   WidgetVisibility       `json:"visibility" dynamodbav:"visibility"`
	CreatedAt    time.Time              `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt" dynamodbav:"updatedAt"`
}

type WidgetPosition struct {
	X int `json:"x" dynamodbav:"x"`
	Y int `json:"y" dynamodbav:"y"`
	Z int `json:"z" dynamodbav:"z"` // Layer/z-index
}

type WidgetSize struct {
	Width  int `json:"width" dynamodbav:"width"`
	Height int `json:"height" dynamodbav:"height"`
	MinW   int `json:"minW,omitempty" dynamodbav:"minW,omitempty"`
	MinH   int `json:"minH,omitempty" dynamodbav:"minH,omitempty"`
	MaxW   int `json:"maxW,omitempty" dynamodbav:"maxW,omitempty"`
	MaxH   int `json:"maxH,omitempty" dynamodbav:"maxH,omitempty"`
}

type WidgetDataSource struct {
	Type       string                 `json:"type" dynamodbav:"type"` // "api", "static", "computed"
	Endpoint   string                 `json:"endpoint,omitempty" dynamodbav:"endpoint,omitempty"`
	Method     string                 `json:"method,omitempty" dynamodbav:"method,omitempty"`
	Parameters map[string]interface{} `json:"parameters,omitempty" dynamodbav:"parameters,omitempty"`
	Transform  string                 `json:"transform,omitempty" dynamodbav:"transform,omitempty"`
	Cache      DataSourceCache        `json:"cache" dynamodbav:"cache"`
}

type DataSourceCache struct {
	Enabled bool  `json:"enabled" dynamodbav:"enabled"`
	TTL     int   `json:"ttl" dynamodbav:"ttl"` // seconds
}

type WidgetFilter struct {
	Field    string      `json:"field" dynamodbav:"field"`
	Operator string      `json:"operator" dynamodbav:"operator"` // "eq", "ne", "gt", "lt", "contains", "in"
	Value    interface{} `json:"value" dynamodbav:"value"`
	Label    string      `json:"label,omitempty" dynamodbav:"label,omitempty"`
}

type WidgetRefresh struct {
	AutoRefresh bool `json:"autoRefresh" dynamodbav:"autoRefresh"`
	Interval    int  `json:"interval" dynamodbav:"interval"` // seconds
	OnMount     bool `json:"onMount" dynamodbav:"onMount"`
}

type WidgetVisibility struct {
	Roles       []string `json:"roles,omitempty" dynamodbav:"roles,omitempty"`
	Teams       []string `json:"teams,omitempty" dynamodbav:"teams,omitempty"`
	Accounts    []string `json:"accounts,omitempty" dynamodbav:"accounts,omitempty"`
	Responsive  bool     `json:"responsive" dynamodbav:"responsive"`
	Breakpoints []string `json:"breakpoints,omitempty" dynamodbav:"breakpoints,omitempty"`
}

type DashboardSettings struct {
	Theme           string                 `json:"theme" dynamodbav:"theme"` // "light", "dark", "auto"
	AutoRefresh     bool                   `json:"autoRefresh" dynamodbav:"autoRefresh"`
	RefreshInterval int                    `json:"refreshInterval" dynamodbav:"refreshInterval"` // seconds
	Timezone        string                 `json:"timezone" dynamodbav:"timezone"`
	DateFormat      string                 `json:"dateFormat" dynamodbav:"dateFormat"`
	ShowToolbar     bool                   `json:"showToolbar" dynamodbav:"showToolbar"`
	ShowFilters     bool                   `json:"showFilters" dynamodbav:"showFilters"`
	ShowExport      bool                   `json:"showExport" dynamodbav:"showExport"`
	CustomCSS       string                 `json:"customCSS,omitempty" dynamodbav:"customCSS,omitempty"`
	GlobalFilters   []WidgetFilter         `json:"globalFilters,omitempty" dynamodbav:"globalFilters,omitempty"`
	Variables       map[string]interface{} `json:"variables,omitempty" dynamodbav:"variables,omitempty"`
}

type DashboardPermission struct {
	UserID     string   `json:"userId,omitempty" dynamodbav:"userId,omitempty"`
	TeamID     string   `json:"teamId,omitempty" dynamodbav:"teamId,omitempty"`
	Role       string   `json:"role" dynamodbav:"role"` // "view", "edit", "admin"
	Actions    []string `json:"actions" dynamodbav:"actions"`
	GrantedBy  string   `json:"grantedBy" dynamodbav:"grantedBy"`
	GrantedAt  time.Time `json:"grantedAt" dynamodbav:"grantedAt"`
	ExpiresAt  *time.Time `json:"expiresAt,omitempty" dynamodbav:"expiresAt,omitempty"`
}

type CreateDashboardRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description,omitempty"`
	IsDefault   bool                   `json:"isDefault,omitempty"`
	IsShared    bool                   `json:"isShared,omitempty"`
	Layout      *DashboardLayout       `json:"layout,omitempty"`
	Widgets     []DashboardWidget      `json:"widgets,omitempty"`
	Settings    *DashboardSettings     `json:"settings,omitempty"`
	Permissions []DashboardPermission  `json:"permissions,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type CreateDashboardResponse struct {
	Success bool       `json:"success"`
	Message string     `json:"message,omitempty"`
	Data    *Dashboard `json:"data,omitempty"`
	Error   string     `json:"error,omitempty"`
}

func NewCreateDashboardHandler() (*CreateDashboardHandler, error) {
	// Get region from environment or default to us-west-2
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}

	return &CreateDashboardHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *CreateDashboardHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("CreateDashboard request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
		}, nil
	}

	// Extract user context from authorizer
	var userID, accountID string
	if event.RequestContext.Authorizer != nil {
		if authLambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
			if uid, ok := authLambda["userId"].(string); ok {
				userID = uid
			}
			if aid, ok := authLambda["accountId"].(string); ok {
				accountID = aid
			}
		} else {
			if uid, ok := event.RequestContext.Authorizer["userId"].(string); ok {
				userID = uid
			}
			if aid, ok := event.RequestContext.Authorizer["accountId"].(string); ok {
				accountID = aid
			}
		}
	}

	if userID == "" || accountID == "" {
		return createErrorResponse(401, "User not authenticated"), nil
	}

	// Parse request body
	var req CreateDashboardRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.Name == "" {
		return createErrorResponse(400, "Dashboard name is required"), nil
	}

	// Set defaults
	now := time.Now()
	dashboardID := uuid.New().String()

	// Default layout
	if req.Layout == nil {
		req.Layout = &DashboardLayout{
			Type:       "grid",
			Columns:    12,
			RowHeight:  150,
			Margin:     [2]int{10, 10},
			Padding:    [2]int{10, 10},
			Responsive: true,
		}
	}

	// Default settings
	if req.Settings == nil {
		req.Settings = &DashboardSettings{
			Theme:           "light",
			AutoRefresh:     false,
			RefreshInterval: 300,
			Timezone:        "UTC",
			DateFormat:      "YYYY-MM-DD HH:mm:ss",
			ShowToolbar:     true,
			ShowFilters:     true,
			ShowExport:      true,
		}
	}

	// Process widgets
	var widgets []DashboardWidget
	for _, widget := range req.Widgets {
		if widget.WidgetID == "" {
			widget.WidgetID = uuid.New().String()
		}
		widget.CreatedAt = now
		widget.UpdatedAt = now
		
		// Set default refresh settings
		if widget.Refresh.Interval == 0 {
			widget.Refresh.Interval = 300
		}
		widget.Refresh.OnMount = true
		
		widgets = append(widgets, widget)
	}

	// If this is set as default, unset any existing default dashboard
	if req.IsDefault {
		err := h.unsetDefaultDashboard(accountID, userID)
		if err != nil {
			log.Printf("ERROR: Failed to unset existing default dashboard: %v", err)
			// Continue anyway - not critical
		}
	}

	// Create dashboard
	dashboard := &Dashboard{
		DashboardID: dashboardID,
		AccountID:   accountID,
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		IsDefault:   req.IsDefault,
		IsShared:    req.IsShared,
		Layout:      *req.Layout,
		Widgets:     widgets,
		Settings:    *req.Settings,
		Permissions: req.Permissions,
		Metadata:    req.Metadata,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Store in DynamoDB
	item, err := dynamodbattribute.MarshalMap(dashboard)
	if err != nil {
		log.Printf("ERROR: Failed to marshal dashboard: %v", err)
		return createErrorResponse(500, "Failed to create dashboard"), nil
	}

	dashboardsTable := os.Getenv("DASHBOARDS_TABLE")
	if dashboardsTable == "" {
		dashboardsTable = "listbackup-main-dashboards"
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(dashboardsTable),
		Item:      item,
	})
	if err != nil {
		log.Printf("ERROR: Failed to store dashboard: %v", err)
		return createErrorResponse(500, "Failed to create dashboard"), nil
	}

	// Return success response
	response := CreateDashboardResponse{
		Success: true,
		Message: "Dashboard created successfully",
		Data:    dashboard,
	}

	return createSuccessResponse(201, response), nil
}

func (h *CreateDashboardHandler) unsetDefaultDashboard(accountID, userID string) error {
	dashboardsTable := os.Getenv("DASHBOARDS_TABLE")
	if dashboardsTable == "" {
		dashboardsTable = "listbackup-main-dashboards"
	}

	// Find existing default dashboard
	input := &dynamodb.QueryInput{
		TableName:              aws.String(dashboardsTable),
		IndexName:              aws.String("AccountUserIndex"),
		KeyConditionExpression: aws.String("accountId = :accountId AND userId = :userId"),
		FilterExpression:       aws.String("isDefault = :isDefault"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":accountId":  {S: aws.String(accountID)},
			":userId":     {S: aws.String(userID)},
			":isDefault":  {BOOL: aws.Bool(true)},
		},
	}

	result, err := h.db.Query(input)
	if err != nil {
		return err
	}

	// Update each existing default dashboard
	for _, item := range result.Items {
		var dashboard Dashboard
		if err := dynamodbattribute.UnmarshalMap(item, &dashboard); err != nil {
			continue
		}

		// Update to not be default
		_, err = h.db.UpdateItem(&dynamodb.UpdateItemInput{
			TableName: aws.String(dashboardsTable),
			Key: map[string]*dynamodb.AttributeValue{
				"dashboardId": {S: aws.String(dashboard.DashboardID)},
			},
			UpdateExpression: aws.String("SET isDefault = :isDefault, updatedAt = :updatedAt"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":isDefault":  {BOOL: aws.Bool(false)},
				":updatedAt":  {S: aws.String(time.Now().Format(time.RFC3339))},
			},
		})
		if err != nil {
			log.Printf("ERROR: Failed to unset default dashboard %s: %v", dashboard.DashboardID, err)
		}
	}

	return nil
}

func createSuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := CreateDashboardResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewCreateDashboardHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}