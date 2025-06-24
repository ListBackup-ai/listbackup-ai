package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/internal/services"
	internalutils "github.com/listbackup/api/internal/utils"
	"github.com/listbackup/api/pkg/response"
)

type CRUDTestHandler struct {
	accountService *services.AccountService
}

func NewCRUDTestHandler(ctx context.Context) (*CRUDTestHandler, error) {
	accountService, err := services.NewAccountService(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create account service: %v", err)
	}

	return &CRUDTestHandler{accountService: accountService}, nil
}

func (h *CRUDTestHandler) Handle(ctx context.Context, event interface{}) (events.APIGatewayProxyResponse, error) {
	log.Printf("Event type: %T", event)
	log.Printf("Raw event: %+v", event)
	
	// Try to handle as both v1 and v2 events
	var method, body string
	
	switch e := event.(type) {
	case events.APIGatewayProxyRequest:
		method = e.HTTPMethod
		body = e.Body
		log.Printf("Using APIGatewayProxyRequest: method=%s", method)
	case events.APIGatewayV2HTTPRequest:
		method = e.RequestContext.HTTP.Method
		body = e.Body
		log.Printf("Using APIGatewayV2HTTPRequest: method=%s", method)
	case map[string]interface{}:
		// Handle raw HTTP API v2 event
		if requestContext, exists := e["requestContext"].(map[string]interface{}); exists {
			if httpData, exists := requestContext["http"].(map[string]interface{}); exists {
				if httpMethod, exists := httpData["method"].(string); exists {
					method = httpMethod
				}
			}
		}
		if bodyData, exists := e["body"].(string); exists {
			body = bodyData
		}
		log.Printf("Using raw HTTP API v2 event: method=%s", method)
	default:
		log.Printf("Unknown event type: %T", event)
		return response.BadRequest("Unknown event type"), nil
	}

	log.Printf("CRUD Test request: %s", method)

	// Use test user for all operations
	testUserID := "user:test-123"
	testAccountID := "account:test-123"

	switch method {
	case "GET":
		return h.handleRead(ctx, testUserID, testAccountID)
	case "POST":
		return h.handleCreate(ctx, body, testUserID, testAccountID)
	case "PUT":
		return h.handleUpdate(ctx, body, testUserID, testAccountID)
	case "DELETE":
		return h.handleDelete(ctx, body, testUserID, testAccountID)
	default:
		log.Printf("Unsupported method: '%s'", method)
		return response.BadRequest("Unsupported method: " + method), nil
	}
}

func (h *CRUDTestHandler) handleRead(ctx context.Context, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	log.Println("🔍 Testing READ Operations")

	results := make(map[string]interface{})

	// Test 1: Get User Accounts
	userAccounts, err := h.accountService.GetUserAccounts(ctx, userID)
	if err != nil {
		results["getUserAccounts"] = map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	} else {
		// Strip prefixes for response
		cleanAccounts := make([]map[string]interface{}, len(userAccounts))
		for i, ua := range userAccounts {
			cleanAccounts[i] = map[string]interface{}{
				"accountId": strings.TrimPrefix(ua.AccountID, "account:"),
				"role":      ua.Role,
				"status":    ua.Status,
				"permissions": ua.Permissions,
			}
		}
		results["getUserAccounts"] = map[string]interface{}{
			"success":  true,
			"accounts": cleanAccounts,
			"total":    len(cleanAccounts),
		}
	}

	// Test 2: Get Account Details
	account, err := h.accountService.GetAccountByID(ctx, accountID)
	if err != nil {
		results["getAccountDetails"] = map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	} else {
		results["getAccountDetails"] = map[string]interface{}{
			"success": true,
			"account": map[string]interface{}{
				"accountId": strings.TrimPrefix(account.AccountID, "account:"),
				"name":      account.Name,
				"company":   account.Company,
				"level":     account.Level,
				"plan":      account.Plan,
				"status":    account.Status,
			},
		}
	}

	// Test 3: Validate Account Access
	userAccount, err := h.accountService.ValidateAccountAccess(ctx, userID, accountID)
	if err != nil {
		results["validateAccess"] = map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	} else {
		results["validateAccess"] = map[string]interface{}{
			"success":     true,
			"role":        userAccount.Role,
			"status":      userAccount.Status,
			"permissions": userAccount.Permissions,
		}
	}

	// Test 4: Switch Account Context
	authContext, err := h.accountService.SwitchAccountContext(ctx, userID, accountID)
	if err != nil {
		results["switchContext"] = map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	} else {
		// Clean up available accounts for response
		cleanAvailable := make([]map[string]interface{}, len(authContext.AvailableAccounts))
		for i, aa := range authContext.AvailableAccounts {
			cleanAvailable[i] = map[string]interface{}{
				"accountId":   aa.AccountID,
				"accountName": aa.AccountName,
				"role":        aa.Role,
				"isCurrent":   aa.IsCurrent,
			}
		}

		results["switchContext"] = map[string]interface{}{
			"success":           true,
			"currentAccount":    authContext.AccountID,
			"currentRole":       authContext.Role,
			"availableAccounts": cleanAvailable,
		}
	}

	return response.Success(map[string]interface{}{
		"operation": "READ",
		"results":   results,
	}), nil
}

func (h *CRUDTestHandler) handleCreate(ctx context.Context, body, userID, parentAccountID string) (events.APIGatewayProxyResponse, error) {
	log.Println("🔨 Testing CREATE Operations")

	type CreateRequest struct {
		Type            string `json:"type"`        // "sub-account" or "root-account"
		Name            string `json:"name"`
		Company         string `json:"company,omitempty"`
		OwnerUserID     string `json:"ownerUserId,omitempty"`
		ParentAccountID string `json:"parentAccountId,omitempty"`
	}

	var req CreateRequest
	if err := internalutils.ParseJSON(body, &req); err != nil {
		return response.BadRequest("Invalid JSON: " + err.Error()), nil
	}

	results := make(map[string]interface{})

	switch req.Type {
	case "sub-account":
		// Test creating a sub-account
		if req.Name == "" {
			return response.BadRequest("Sub-account name is required"), nil
		}

		ownerUserID := req.OwnerUserID
		if ownerUserID == "" {
			ownerUserID = userID
		}

		// Allow custom parent account ID or use default
		customParentAccountID := req.ParentAccountID
		if customParentAccountID == "" {
			customParentAccountID = parentAccountID
		}
		// Add prefix if needed
		if !strings.HasPrefix(customParentAccountID, "account:") {
			customParentAccountID = "account:" + customParentAccountID
		}

		subAccount, err := h.accountService.CreateSubAccount(ctx, customParentAccountID, ownerUserID, req.Name)
		if err != nil {
			results["createSubAccount"] = map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			}
		} else {
			results["createSubAccount"] = map[string]interface{}{
				"success": true,
				"account": map[string]interface{}{
					"accountId":       strings.TrimPrefix(subAccount.AccountID, "account:"),
					"name":            subAccount.Name,
					"level":           subAccount.Level,
					"parentAccountId": strings.TrimPrefix(*subAccount.ParentAccountID, "account:"),
					"accountPath":     subAccount.AccountPath,
				},
			}
		}

	case "root-account":
		// Test creating a root account
		if req.Name == "" || req.Company == "" {
			return response.BadRequest("Root account name and company are required"), nil
		}

		newUserID := "user:test-new-" + fmt.Sprintf("%d", len(req.Name))
		rootAccount, err := h.accountService.CreateRootAccount(ctx, newUserID, req.Name, req.Company)
		if err != nil {
			results["createRootAccount"] = map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			}
		} else {
			results["createRootAccount"] = map[string]interface{}{
				"success": true,
				"account": map[string]interface{}{
					"accountId":   strings.TrimPrefix(rootAccount.AccountID, "account:"),
					"name":        rootAccount.Name,
					"company":     rootAccount.Company,
					"level":       rootAccount.Level,
					"accountPath": rootAccount.AccountPath,
				},
			}
		}

	default:
		return response.BadRequest("Invalid type. Use 'sub-account' or 'root-account'"), nil
	}

	return response.Success(map[string]interface{}{
		"operation": "CREATE",
		"results":   results,
	}), nil
}

func (h *CRUDTestHandler) handleUpdate(ctx context.Context, body, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	log.Println("🔄 Testing UPDATE Operations")

	type UpdateRequest struct {
		Operation   string `json:"operation"`   // "switch-context", "validate-permission"
		TargetAccountID string `json:"targetAccountId,omitempty"`
	}

	var req UpdateRequest
	if err := internalutils.ParseJSON(body, &req); err != nil {
		return response.BadRequest("Invalid JSON: " + err.Error()), nil
	}

	results := make(map[string]interface{})

	switch req.Operation {
	case "switch-context":
		targetAccountID := req.TargetAccountID
		if targetAccountID == "" {
			return response.BadRequest("Target account ID is required"), nil
		}

		// Add prefix if needed
		if !strings.HasPrefix(targetAccountID, "account:") {
			targetAccountID = "account:" + targetAccountID
		}

		// Test switching to different account
		authContext, err := h.accountService.SwitchAccountContext(ctx, userID, targetAccountID)
		if err != nil {
			results["switchContext"] = map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			}
		} else {
			results["switchContext"] = map[string]interface{}{
				"success":        true,
				"newAccount":     authContext.AccountID,
				"newRole":        authContext.Role,
				"totalAccounts":  len(authContext.AvailableAccounts),
			}
		}

	case "validate-permission":
		// Test permission validation
		userAccount, err := h.accountService.ValidateAccountAccess(ctx, userID, accountID)
		if err != nil {
			results["validatePermission"] = map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			}
		} else {
			results["validatePermission"] = map[string]interface{}{
				"success":     true,
				"role":        userAccount.Role,
				"permissions": userAccount.Permissions,
			}
		}

	default:
		return response.BadRequest("Invalid operation. Use 'switch-context' or 'validate-permission'"), nil
	}

	return response.Success(map[string]interface{}{
		"operation": "UPDATE",
		"results":   results,
	}), nil
}

func (h *CRUDTestHandler) handleDelete(ctx context.Context, body, userID, accountID string) (events.APIGatewayProxyResponse, error) {
	log.Println("🗑️ Testing DELETE Operations")

	// For safety, we'll only simulate DELETE operations and report what would happen
	// Real DELETE operations would require careful implementation with cascading deletes

	type DeleteRequest struct {
		Operation   string `json:"operation"`   // "simulate-delete-account", "remove-user-access"
		TargetID    string `json:"targetId,omitempty"`
	}

	var req DeleteRequest
	if err := internalutils.ParseJSON(body, &req); err != nil {
		return response.BadRequest("Invalid JSON: " + err.Error()), nil
	}

	results := make(map[string]interface{})

	switch req.Operation {
	case "simulate-delete-account":
		// Simulate what would happen if we deleted an account
		targetAccountID := req.TargetID
		if targetAccountID == "" {
			return response.BadRequest("Target account ID is required"), nil
		}

		if !strings.HasPrefix(targetAccountID, "account:") {
			targetAccountID = "account:" + targetAccountID
		}

		// Check if account exists and get details
		account, err := h.accountService.GetAccountByID(ctx, targetAccountID)
		if err != nil {
			results["simulateDelete"] = map[string]interface{}{
				"success": false,
				"error":   "Account not found: " + err.Error(),
			}
		} else {
			// Check user access
			_, err := h.accountService.ValidateAccountAccess(ctx, userID, targetAccountID)
			if err != nil {
				results["simulateDelete"] = map[string]interface{}{
					"success": false,
					"error":   "Access denied: " + err.Error(),
				}
			} else {
				results["simulateDelete"] = map[string]interface{}{
					"success": true,
					"message": "DELETE would succeed",
					"account": map[string]interface{}{
						"name":    account.Name,
						"level":   account.Level,
						"hasParent": account.ParentAccountID != nil,
					},
					"actions": []string{
						"Would delete account record",
						"Would remove user-account relationships", 
						"Would clean up associated data (sources, jobs, etc.)",
						"Would update child accounts if any",
					},
				}
			}
		}

	case "remove-user-access":
		// Simulate removing user access to an account
		results["removeUserAccess"] = map[string]interface{}{
			"success": true,
			"message": "User access removal would succeed",
			"actions": []string{
				"Would remove user-account relationship",
				"Would revoke all permissions",
				"Would preserve account for other users",
			},
		}

	default:
		return response.BadRequest("Invalid operation. Use 'simulate-delete-account' or 'remove-user-access'"), nil
	}

	return response.Success(map[string]interface{}{
		"operation": "DELETE (SIMULATED)",
		"results":   results,
	}), nil
}

func main() {
	handler, err := NewCRUDTestHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create CRUD test handler: %v", err)
	}

	lambda.Start(handler.Handle)
}