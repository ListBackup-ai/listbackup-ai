package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type SearchUsersResponse struct {
	Users []UserSearchResult `json:"users"`
	Count int                `json:"count"`
}

type UserSearchResult struct {
	UserID           string `json:"userId" dynamodbav:"userId"`
	Email            string `json:"email" dynamodbav:"email"`
	Name             string `json:"name" dynamodbav:"name"`
	Status           string `json:"status" dynamodbav:"status"`
	CurrentAccountID string `json:"currentAccountId,omitempty" dynamodbav:"currentAccountId"`
	CreatedAt        string `json:"createdAt" dynamodbav:"createdAt"`
}

type UserAccount struct {
	UserID      string      `dynamodbav:"userId"`
	AccountID   string      `dynamodbav:"accountId"`
	Role        string      `dynamodbav:"role"`
	Permissions Permissions `dynamodbav:"permissions"`
}

type Permissions struct {
	ManageUsers bool `dynamodbav:"manageUsers"`
}

var (
	usersTable        = os.Getenv("USERS_TABLE")
	userAccountsTable = os.Getenv("USER_ACCOUNTS_TABLE")
)

func Handle(ctx context.Context, event events.APIGatewayV2HTTPRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Search users called with method: %s", event.RequestContext.HTTP.Method)

	// Handle OPTIONS request for CORS
	if event.RequestContext.HTTP.Method == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	// Extract user ID from authorizer context
	userID := extractUserID(event)
	if userID == "" {
		return createErrorResponse(401, "Unauthorized"), nil
	}

	// Check admin permissions
	hasPermission, err := checkAdminPermission(userID)
	if err != nil {
		log.Printf("Error checking permissions: %v", err)
		return createErrorResponse(500, "Failed to check permissions"), nil
	}
	if !hasPermission {
		return createErrorResponse(403, "Forbidden: Admin access required"), nil
	}

	// Get search query
	query := event.QueryStringParameters["q"]
	if query == "" {
		return createErrorResponse(400, "Search query is required"), nil
	}

	// Parse optional parameters
	limit := 50
	if limitStr := event.QueryStringParameters["limit"]; limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	searchType := event.QueryStringParameters["type"] // email, name, or all (default)
	if searchType == "" {
		searchType = "all"
	}

	// Perform search
	users, err := searchUsers(query, searchType, limit)
	if err != nil {
		log.Printf("Error searching users: %v", err)
		return createErrorResponse(500, "Failed to search users"), nil
	}

	response := Response{
		Success: true,
		Data: SearchUsersResponse{
			Users: users,
			Count: len(users),
		},
	}

	return createSuccessResponse(response), nil
}

func extractUserID(event events.APIGatewayV2HTTPRequest) string {
	if event.RequestContext.Authorizer != nil {
		if jwt := event.RequestContext.Authorizer.JWT; jwt != nil {
			if sub, ok := jwt.Claims["sub"]; ok {
				return fmt.Sprintf("user:%s", sub)
			}
		}
		if lambda := event.RequestContext.Authorizer.Lambda; lambda != nil {
			if userID, ok := lambda["userId"].(string); ok {
				return userID
			}
		}
	}
	return ""
}

func checkAdminPermission(userID string) (bool, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	// Query user's accounts to check for admin role
	expr, err := expression.NewBuilder().
		WithKeyCondition(expression.Key("userId").Equal(expression.Value(userID))).
		Build()
	if err != nil {
		return false, err
	}

	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(userAccountsTable),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return false, err
	}

	for _, item := range result.Items {
		var userAccount UserAccount
		if err := dynamodbattribute.UnmarshalMap(item, &userAccount); err != nil {
			continue
		}
		if userAccount.Role == "admin" || userAccount.Role == "owner" || userAccount.Permissions.ManageUsers {
			return true, nil
		}
	}

	return false, nil
}

func searchUsers(query, searchType string, limit int) ([]UserSearchResult, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	queryLower := strings.ToLower(query)
	var users []UserSearchResult

	// If searching by email specifically, use the EmailIndex GSI
	if searchType == "email" {
		expr, err := expression.NewBuilder().
			WithKeyCondition(expression.Key("email").Equal(expression.Value(queryLower))).
			Build()
		if err != nil {
			return nil, err
		}

		result, err := svc.Query(&dynamodb.QueryInput{
			TableName:                 aws.String(usersTable),
			IndexName:                 aws.String("EmailIndex"),
			KeyConditionExpression:    expr.KeyCondition(),
			ExpressionAttributeNames:  expr.Names(),
			ExpressionAttributeValues: expr.Values(),
			Limit:                     aws.Int64(int64(limit)),
		})
		if err != nil {
			return nil, err
		}

		for _, item := range result.Items {
			var user UserSearchResult
			if err := dynamodbattribute.UnmarshalMap(item, &user); err != nil {
				continue
			}
			users = append(users, user)
		}
	} else {
		// For name or all searches, we need to scan with filter
		var filterExpr expression.ConditionBuilder

		switch searchType {
		case "name":
			filterExpr = expression.Contains(expression.Name("name"), queryLower)
		case "all":
			filterExpr = expression.Or(
				expression.Contains(expression.Name("email"), queryLower),
				expression.Contains(expression.Name("name"), queryLower),
			)
		default:
			filterExpr = expression.Or(
				expression.Contains(expression.Name("email"), queryLower),
				expression.Contains(expression.Name("name"), queryLower),
			)
		}

		expr, err := expression.NewBuilder().WithFilter(filterExpr).Build()
		if err != nil {
			return nil, err
		}

		// Scan with filter (less efficient but necessary for name searches)
		input := &dynamodb.ScanInput{
			TableName:                 aws.String(usersTable),
			FilterExpression:          expr.Filter(),
			ExpressionAttributeNames:  expr.Names(),
			ExpressionAttributeValues: expr.Values(),
			Limit:                     aws.Int64(int64(limit * 2)), // Scan more to account for filtering
		}

		result, err := svc.Scan(input)
		if err != nil {
			return nil, err
		}

		count := 0
		for _, item := range result.Items {
			if count >= limit {
				break
			}
			var user UserSearchResult
			if err := dynamodbattribute.UnmarshalMap(item, &user); err != nil {
				continue
			}
			users = append(users, user)
			count++
		}
	}

	return users, nil
}

func createSuccessResponse(data interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(data)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func createErrorResponse(statusCode int, message string) events.APIGatewayProxyResponse {
	response := Response{
		Success: false,
		Error:   message,
	}
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(body),
	}
}

func main() {
	lambda.Start(Handle)
}