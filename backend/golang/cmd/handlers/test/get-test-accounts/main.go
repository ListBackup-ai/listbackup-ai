package main

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/listbackup/api/internal/services"
	"github.com/listbackup/api/pkg/response"
)

type TestGetAccountsHandler struct {
	accountService *services.AccountService
}

func NewTestGetAccountsHandler(ctx context.Context) (*TestGetAccountsHandler, error) {
	accountService, err := services.NewAccountService(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create account service: %v", err)
	}

	return &TestGetAccountsHandler{accountService: accountService}, nil
}

func (h *TestGetAccountsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Test get accounts request")

	// Test with our manually created test user
	testUserID := "user:test-123"

	// Get user accounts using hierarchical account service
	userAccounts, err := h.accountService.GetUserAccounts(ctx, testUserID)
	if err != nil {
		log.Printf("Failed to get user accounts: %v", err)
		return response.InternalServerError("Failed to get user accounts"), nil
	}

	// Test account context switching
	if len(userAccounts) > 0 {
		testAccountID := userAccounts[0].AccountID
		authContext, err := h.accountService.SwitchAccountContext(ctx, testUserID, testAccountID)
		if err != nil {
			log.Printf("Failed to switch account context: %v", err)
		} else {
			log.Printf("Successfully switched to account context: %+v", authContext)
		}
	}

	return response.Success(map[string]interface{}{
		"message":      "Hierarchical account system test",
		"testUserId":   testUserID,
		"userAccounts": userAccounts,
		"total":        len(userAccounts),
	}), nil
}

func main() {
	handler, err := NewTestGetAccountsHandler(context.Background())
	if err != nil {
		log.Fatalf("Failed to create test handler: %v", err)
	}

	lambda.Start(handler.Handle)
}