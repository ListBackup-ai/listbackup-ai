package main

import (
	"context"
	"encoding/base64"
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

type ListUsersResponse struct {
	Users     []User `json:"users"`
	NextToken string `json:"nextToken,omitempty"`
	Count     int    `json:"count"`
	Total     int    `json:"total,omitempty"`
}

type User struct {
	UserID           string `json:"userId" dynamodbav:"userId"`
	Email            string `json:"email" dynamodbav:"email"`
	Name             string `json:"name" dynamodbav:"name"`
	Status           string `json:"status" dynamodbav:"status"`
	CurrentAccountID string `json:"currentAccountId,omitempty" dynamodbav:"currentAccountId"`
	CreatedAt        string `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        string `json:"updatedAt" dynamodbav:"updatedAt"`
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
	log.Printf("List users called with method: %s", event.RequestContext.HTTP.Method)

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

	// Parse query parameters
	limit := 20
	if limitStr := event.QueryStringParameters["limit"]; limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	status := event.QueryStringParameters["status"]
	search := event.QueryStringParameters["search"]
	nextToken := event.QueryStringParameters["nextToken"]

	// List users
	users, newNextToken, err := listUsers(limit, status, search, nextToken)
	if err != nil {
		log.Printf("Error listing users: %v", err)
		return createErrorResponse(500, "Failed to list users"), nil
	}

	response := Response{
		Success: true,
		Data: ListUsersResponse{
			Users:     users,
			NextToken: newNextToken,
			Count:     len(users),
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

func listUsers(limit int, status, search, nextToken string) ([]User, string, error) {
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	input := &dynamodb.ScanInput{
		TableName: aws.String(usersTable),
		Limit:     aws.Int64(int64(limit)),
	}

	// Add filter expression if status or search is provided
	var filterConditions []expression.ConditionBuilder
	
	if status != "" {
		filterConditions = append(filterConditions, expression.Name("status").Equal(expression.Value(status)))
	}
	
	if search != "" {
		searchLower := strings.ToLower(search)
		filterConditions = append(filterConditions, expression.Or(
			expression.Contains(expression.Name("email"), searchLower),
			expression.Contains(expression.Name("name"), searchLower),
		))
	}

	if len(filterConditions) > 0 {
		var filterExpr expression.ConditionBuilder
		if len(filterConditions) == 1 {
			filterExpr = filterConditions[0]
		} else {
			filterExpr = expression.And(filterConditions[0], filterConditions[1])
		}
		
		expr, err := expression.NewBuilder().WithFilter(filterExpr).Build()
		if err != nil {
			return nil, "", err
		}
		
		input.FilterExpression = expr.Filter()
		input.ExpressionAttributeNames = expr.Names()
		input.ExpressionAttributeValues = expr.Values()
	}

	// Handle pagination
	if nextToken != "" {
		decodedToken, err := base64.StdEncoding.DecodeString(nextToken)
		if err == nil {
			var lastKey map[string]*dynamodb.AttributeValue
			if err := json.Unmarshal(decodedToken, &lastKey); err == nil {
				input.ExclusiveStartKey = lastKey
			}
		}
	}

	result, err := svc.Scan(input)
	if err != nil {
		return nil, "", err
	}

	var users []User
	for _, item := range result.Items {
		var user User
		if err := dynamodbattribute.UnmarshalMap(item, &user); err != nil {
			log.Printf("Error unmarshaling user: %v", err)
			continue
		}
		users = append(users, user)
	}

	// Generate next token if there are more results
	var newNextToken string
	if result.LastEvaluatedKey != nil {
		tokenBytes, err := json.Marshal(result.LastEvaluatedKey)
		if err == nil {
			newNextToken = base64.StdEncoding.EncodeToString(tokenBytes)
		}
	}

	return users, newNextToken, nil
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