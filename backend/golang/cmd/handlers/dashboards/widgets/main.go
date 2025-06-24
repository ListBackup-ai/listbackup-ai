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

type DashboardWidgetsHandler struct {
	db *dynamodb.DynamoDB
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

type Dashboard struct {
	DashboardID string            `json:"dashboardId" dynamodbav:"dashboardId"`
	AccountID   string            `json:"accountId" dynamodbav:"accountId"`
	UserID      string            `json:"userId" dynamodbav:"userId"`
	Widgets     []DashboardWidget `json:"widgets" dynamodbav:"widgets"`
	UpdatedAt   time.Time         `json:"updatedAt" dynamodbav:"updatedAt"`
}

type AddWidgetRequest struct {
	DashboardID string          `json:"dashboardId"`
	Widget      DashboardWidget `json:"widget"`
}

type UpdateWidgetRequest struct {
	DashboardID string          `json:"dashboardId"`
	WidgetID    string          `json:"widgetId"`
	Widget      DashboardWidget `json:"widget"`
}

type RemoveWidgetRequest struct {
	DashboardID string `json:"dashboardId"`
	WidgetID    string `json:"widgetId"`
}

type WidgetDataRequest struct {
	DashboardID string                 `json:"dashboardId"`
	WidgetID    string                 `json:"widgetId"`
	Parameters  map[string]interface{} `json:"parameters,omitempty"`
	Filters     []WidgetFilter         `json:"filters,omitempty"`
}

type WidgetResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type WidgetDataResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    *WidgetData `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type WidgetData struct {
	WidgetID    string      `json:"widgetId"`
	Data        interface{} `json:"data"`
	Metadata    interface{} `json:"metadata,omitempty"`
	LastUpdated time.Time   `json:"lastUpdated"`
	CacheHit    bool        `json:"cacheHit"`
}

func NewDashboardWidgetsHandler() (*DashboardWidgetsHandler, error) {
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

	return &DashboardWidgetsHandler{
		db: dynamodb.New(sess),
	}, nil
}

func (h *DashboardWidgetsHandler) HandleRequest(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("DashboardWidgets request: %+v", event)

	// Handle OPTIONS request for CORS
	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

	// Route based on HTTP method and path
	switch event.HTTPMethod {
	case "POST":
		if event.QueryStringParameters["action"] == "get-data" {
			return h.handleGetWidgetData(event, userID, accountID)
		}
		return h.handleAddWidget(event, userID, accountID)
	case "PUT":
		return h.handleUpdateWidget(event, userID, accountID)
	case "DELETE":
		return h.handleRemoveWidget(event, userID, accountID)
	default:
		return createErrorResponse(405, "Method not allowed"), nil
	}
}

func (h *DashboardWidgetsHandler) handleAddWidget(event events.APIGatewayProxyRequest, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Parse request body
	var req AddWidgetRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.DashboardID == "" {
		return createErrorResponse(400, "Dashboard ID is required"), nil
	}

	// Get dashboard
	dashboard, err := h.getDashboard(accountID, req.DashboardID)
	if err != nil {
		log.Printf("ERROR: Failed to get dashboard: %v", err)
		return createErrorResponse(500, "Failed to get dashboard"), nil
	}

	if dashboard == nil {
		return createErrorResponse(404, "Dashboard not found"), nil
	}

	// Check permissions
	if dashboard.UserID != userID && !dashboard.IsShared {
		return createErrorResponse(403, "Access denied to dashboard"), nil
	}

	// Generate widget ID if not provided
	if req.Widget.WidgetID == "" {
		req.Widget.WidgetID = uuid.New().String()
	}

	// Set timestamps
	now := time.Now()
	req.Widget.CreatedAt = now
	req.Widget.UpdatedAt = now

	// Set default refresh settings
	if req.Widget.Refresh.Interval == 0 {
		req.Widget.Refresh.Interval = 300
	}
	req.Widget.Refresh.OnMount = true

	// Add widget to dashboard
	dashboard.Widgets = append(dashboard.Widgets, req.Widget)
	dashboard.UpdatedAt = now

	// Update dashboard in DynamoDB
	err = h.updateDashboardWidgets(dashboard.DashboardID, dashboard.Widgets)
	if err != nil {
		log.Printf("ERROR: Failed to update dashboard widgets: %v", err)
		return createErrorResponse(500, "Failed to add widget"), nil
	}

	response := WidgetResponse{
		Success: true,
		Message: "Widget added successfully",
		Data:    req.Widget,
	}

	return createSuccessResponse(200, response), nil
}

func (h *DashboardWidgetsHandler) handleUpdateWidget(event events.APIGatewayProxyRequest, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Parse request body
	var req UpdateWidgetRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.DashboardID == "" || req.WidgetID == "" {
		return createErrorResponse(400, "Dashboard ID and Widget ID are required"), nil
	}

	// Get dashboard
	dashboard, err := h.getDashboard(accountID, req.DashboardID)
	if err != nil {
		log.Printf("ERROR: Failed to get dashboard: %v", err)
		return createErrorResponse(500, "Failed to get dashboard"), nil
	}

	if dashboard == nil {
		return createErrorResponse(404, "Dashboard not found"), nil
	}

	// Check permissions
	if dashboard.UserID != userID && !dashboard.IsShared {
		return createErrorResponse(403, "Access denied to dashboard"), nil
	}

	// Find and update widget
	widgetFound := false
	for i, widget := range dashboard.Widgets {
		if widget.WidgetID == req.WidgetID {
			// Preserve creation time
			req.Widget.WidgetID = req.WidgetID
			req.Widget.CreatedAt = widget.CreatedAt
			req.Widget.UpdatedAt = time.Now()
			
			dashboard.Widgets[i] = req.Widget
			widgetFound = true
			break
		}
	}

	if !widgetFound {
		return createErrorResponse(404, "Widget not found"), nil
	}

	dashboard.UpdatedAt = time.Now()

	// Update dashboard in DynamoDB
	err = h.updateDashboardWidgets(dashboard.DashboardID, dashboard.Widgets)
	if err != nil {
		log.Printf("ERROR: Failed to update dashboard widgets: %v", err)
		return createErrorResponse(500, "Failed to update widget"), nil
	}

	response := WidgetResponse{
		Success: true,
		Message: "Widget updated successfully",
		Data:    req.Widget,
	}

	return createSuccessResponse(200, response), nil
}

func (h *DashboardWidgetsHandler) handleRemoveWidget(event events.APIGatewayProxyRequest, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Parse request body
	var req RemoveWidgetRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.DashboardID == "" || req.WidgetID == "" {
		return createErrorResponse(400, "Dashboard ID and Widget ID are required"), nil
	}

	// Get dashboard
	dashboard, err := h.getDashboard(accountID, req.DashboardID)
	if err != nil {
		log.Printf("ERROR: Failed to get dashboard: %v", err)
		return createErrorResponse(500, "Failed to get dashboard"), nil
	}

	if dashboard == nil {
		return createErrorResponse(404, "Dashboard not found"), nil
	}

	// Check permissions
	if dashboard.UserID != userID && !dashboard.IsShared {
		return createErrorResponse(403, "Access denied to dashboard"), nil
	}

	// Find and remove widget
	widgetFound := false
	var newWidgets []DashboardWidget
	for _, widget := range dashboard.Widgets {
		if widget.WidgetID != req.WidgetID {
			newWidgets = append(newWidgets, widget)
		} else {
			widgetFound = true
		}
	}

	if !widgetFound {
		return createErrorResponse(404, "Widget not found"), nil
	}

	dashboard.Widgets = newWidgets
	dashboard.UpdatedAt = time.Now()

	// Update dashboard in DynamoDB
	err = h.updateDashboardWidgets(dashboard.DashboardID, dashboard.Widgets)
	if err != nil {
		log.Printf("ERROR: Failed to update dashboard widgets: %v", err)
		return createErrorResponse(500, "Failed to remove widget"), nil
	}

	response := WidgetResponse{
		Success: true,
		Message: "Widget removed successfully",
		Data: map[string]interface{}{
			"widgetId": req.WidgetID,
			"removed":  true,
		},
	}

	return createSuccessResponse(200, response), nil
}

func (h *DashboardWidgetsHandler) handleGetWidgetData(event events.APIGatewayProxyRequest, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	// Parse request body
	var req WidgetDataRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		log.Printf("ERROR: Failed to unmarshal request body: %v", err)
		return createErrorResponse(400, "Invalid request body"), nil
	}

	// Validate required fields
	if req.DashboardID == "" || req.WidgetID == "" {
		return createErrorResponse(400, "Dashboard ID and Widget ID are required"), nil
	}

	// Get dashboard and widget
	dashboard, err := h.getDashboard(accountID, req.DashboardID)
	if err != nil {
		log.Printf("ERROR: Failed to get dashboard: %v", err)
		return createErrorResponse(500, "Failed to get dashboard"), nil
	}

	if dashboard == nil {
		return createErrorResponse(404, "Dashboard not found"), nil
	}

	// Check permissions
	if dashboard.UserID != userID && !dashboard.IsShared {
		return createErrorResponse(403, "Access denied to dashboard"), nil
	}

	// Find widget
	var widget *DashboardWidget
	for _, w := range dashboard.Widgets {
		if w.WidgetID == req.WidgetID {
			widget = &w
			break
		}
	}

	if widget == nil {
		return createErrorResponse(404, "Widget not found"), nil
	}

	// Get widget data
	widgetData, err := h.getWidgetData(widget, req.Parameters, req.Filters)
	if err != nil {
		log.Printf("ERROR: Failed to get widget data: %v", err)
		return createErrorResponse(500, "Failed to get widget data"), nil
	}

	response := WidgetDataResponse{
		Success: true,
		Message: "Widget data retrieved successfully",
		Data:    widgetData,
	}

	return createSuccessResponse(200, response), nil
}

func (h *DashboardWidgetsHandler) getDashboard(accountID, dashboardID string) (*Dashboard, error) {
	dashboardsTable := os.Getenv("DASHBOARDS_TABLE")
	if dashboardsTable == "" {
		dashboardsTable = "listbackup-main-dashboards"
	}

	input := &dynamodb.GetItemInput{
		TableName: aws.String(dashboardsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"dashboardId": {S: aws.String(dashboardID)},
		},
	}

	result, err := h.db.GetItem(input)
	if err != nil {
		return nil, err
	}

	if result.Item == nil {
		return nil, nil
	}

	var dashboard Dashboard
	err = dynamodbattribute.UnmarshalMap(result.Item, &dashboard)
	if err != nil {
		return nil, err
	}

	// Verify account access
	if dashboard.AccountID != accountID {
		return nil, nil
	}

	return &dashboard, nil
}

func (h *DashboardWidgetsHandler) updateDashboardWidgets(dashboardID string, widgets []DashboardWidget) error {
	dashboardsTable := os.Getenv("DASHBOARDS_TABLE")
	if dashboardsTable == "" {
		dashboardsTable = "listbackup-main-dashboards"
	}

	// Marshal widgets
	widgetsAttr, err := dynamodbattribute.Marshal(widgets)
	if err != nil {
		return err
	}

	_, err = h.db.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(dashboardsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"dashboardId": {S: aws.String(dashboardID)},
		},
		UpdateExpression: aws.String("SET widgets = :widgets, updatedAt = :updatedAt"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":widgets":   widgetsAttr,
			":updatedAt": {S: aws.String(time.Now().Format(time.RFC3339))},
		},
	})

	return err
}

func (h *DashboardWidgetsHandler) getWidgetData(widget *DashboardWidget, parameters map[string]interface{}, filters []WidgetFilter) (*WidgetData, error) {
	// This is a simplified implementation - in production, you'd implement proper data fetching
	// based on the widget's data source configuration
	
	now := time.Now()
	
	// Generate mock data based on widget type
	var data interface{}
	
	switch widget.Type {
	case "metric":
		data = map[string]interface{}{
			"value":      42,
			"label":      widget.Title,
			"trend":      "+5.2%",
			"comparison": "vs last month",
		}
	case "chart":
		data = map[string]interface{}{
			"labels": []string{"Jan", "Feb", "Mar", "Apr", "May"},
			"datasets": []map[string]interface{}{
				{
					"label": "Sales",
					"data":  []int{10, 20, 15, 25, 30},
				},
			},
		}
	case "table":
		data = map[string]interface{}{
			"headers": []string{"Name", "Value", "Status"},
			"rows": [][]interface{}{
				{"Item 1", 100, "Active"},
				{"Item 2", 200, "Inactive"},
				{"Item 3", 150, "Active"},
			},
		}
	case "list":
		data = []map[string]interface{}{
			{"id": 1, "title": "First Item", "description": "Description 1"},
			{"id": 2, "title": "Second Item", "description": "Description 2"},
			{"id": 3, "title": "Third Item", "description": "Description 3"},
		}
	default:
		data = map[string]interface{}{
			"message": "Widget data not implemented for type: " + widget.Type,
		}
	}

	return &WidgetData{
		WidgetID:    widget.WidgetID,
		Data:        data,
		Metadata:    map[string]interface{}{"generated": true},
		LastUpdated: now,
		CacheHit:    false,
	}, nil
}

func createSuccessResponse(statusCode int, data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := WidgetResponse{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
		Body: string(body),
	}
}

func main() {
	handler, err := NewDashboardWidgetsHandler()
	if err != nil {
		log.Fatalf("Failed to create handler: %v", err)
	}
	lambda.Start(handler.HandleRequest)
}