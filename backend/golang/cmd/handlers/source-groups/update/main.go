package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type UpdateSourceGroupHandler struct {
	db *dynamodb.DynamoDB
}

type UpdateSourceGroupRequest struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Status      string `json:"status,omitempty"`
}

type SourceGroup struct {
	GroupID      string    `json:"groupId" dynamodbav:"groupId"`
	AccountID    string    `json:"accountId" dynamodbav:"accountId"`
	UserID       string    `json:"userId" dynamodbav:"userId"`
	ConnectionID string    `json:"connectionId" dynamodbav:"connectionId"`
	Name         string    `json:"name" dynamodbav:"name"`
	Description  string    `json:"description" dynamodbav:"description"`
	Status       string    `json:"status" dynamodbav:"status"`
	SourceCount  int       `json:"sourceCount" dynamodbav:"sourceCount"`
	CreatedAt    time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

func NewUpdateSourceGroupHandler() (*UpdateSourceGroupHandler, error) {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}

	db := dynamodb.New(sess)
	return &UpdateSourceGroupHandler{db: db}, nil
}

func (h *UpdateSourceGroupHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Update source group request started")

	if event.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
			Body: "",
		}, nil
	}

	groupId := event.PathParameters["groupId"]
	if groupId == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Group ID is required"}`,
		}, nil
	}

	if !strings.HasPrefix(groupId, "group:") {
		groupId = "group:" + groupId
	}

	// Extract auth context
	var userID, accountID string
	if authLambda, ok := event.RequestContext.Authorizer["lambda"].(map[string]interface{}); ok {
		if uid, exists := authLambda["userId"].(string); exists {
			userID = uid
		}
		if aid, exists := authLambda["accountId"].(string); exists {
			accountID = aid
		}
	} else {
		if uid, exists := event.RequestContext.Authorizer["userId"].(string); exists {
			userID = uid
		}
		if aid, exists := event.RequestContext.Authorizer["accountId"].(string); exists {
			accountID = aid
		}
	}

	if userID == "" || accountID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "User not authenticated"}`,
		}, nil
	}

	// Parse request body
	var req UpdateSourceGroupRequest
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Invalid request body"}`,
		}, nil
	}

	// Get table name
	sourceGroupsTable := os.Getenv("SOURCE_GROUPS_TABLE")
	if sourceGroupsTable == "" {
		sourceGroupsTable = "listbackup-main-source-groups"
	}

	// Update the source group
	updateExpr := "SET updatedAt = :updatedAt"
	exprValues := map[string]*dynamodb.AttributeValue{
		":updatedAt": {S: aws.String(time.Now().Format(time.RFC3339))},
	}

	if req.Name != "" {
		updateExpr += ", #name = :name"
		exprValues[":name"] = &dynamodb.AttributeValue{S: aws.String(req.Name)}
	}
	if req.Description != "" {
		updateExpr += ", description = :description"
		exprValues[":description"] = &dynamodb.AttributeValue{S: aws.String(req.Description)}
	}
	if req.Status != "" {
		updateExpr += ", #status = :status"
		exprValues[":status"] = &dynamodb.AttributeValue{S: aws.String(req.Status)}
	}

	exprNames := map[string]*string{}
	if req.Name != "" {
		exprNames["#name"] = aws.String("name")
	}
	if req.Status != "" {
		exprNames["#status"] = aws.String("status")
	}

	input := &dynamodb.UpdateItemInput{
		TableName:                 aws.String(sourceGroupsTable),
		Key:                       map[string]*dynamodb.AttributeValue{"groupId": {S: aws.String(groupId)}},
		UpdateExpression:          aws.String(updateExpr),
		ExpressionAttributeValues: exprValues,
		ConditionExpression:       aws.String("userId = :userId AND accountId = :accountId"),
		ReturnValues:              aws.String("ALL_NEW"),
	}

	input.ExpressionAttributeValues[":userId"] = &dynamodb.AttributeValue{S: aws.String(userID)}
	input.ExpressionAttributeValues[":accountId"] = &dynamodb.AttributeValue{S: aws.String(accountID)}

	if len(exprNames) > 0 {
		input.ExpressionAttributeNames = exprNames
	}

	result, err := h.db.UpdateItem(input)
	if err != nil {
		log.Printf("Failed to update source group: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to update source group"}`,
		}, nil
	}

	var updatedGroup SourceGroup
	err = dynamodbattribute.UnmarshalMap(result.Attributes, &updatedGroup)
	if err != nil {
		log.Printf("Failed to unmarshal updated group: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process updated source group"}`,
		}, nil
	}

	responseGroup := map[string]interface{}{
		"groupId":      strings.TrimPrefix(updatedGroup.GroupID, "group:"),
		"accountId":    updatedGroup.AccountID,
		"userId":       updatedGroup.UserID,
		"connectionId": strings.TrimPrefix(updatedGroup.ConnectionID, "connection:"),
		"name":         updatedGroup.Name,
		"description":  updatedGroup.Description,
		"status":       updatedGroup.Status,
		"sourceCount":  updatedGroup.SourceCount,
		"createdAt":    updatedGroup.CreatedAt,
		"updatedAt":    updatedGroup.UpdatedAt,
	}

	responseData := map[string]interface{}{
		"success": true,
		"data":    responseGroup,
		"message": "Source group updated successfully",
	}

	responseBody, _ := json.Marshal(responseData)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Content-Type":                 "application/json",
		},
		Body: string(responseBody),
	}, nil
}

func main() {
	handler, err := NewUpdateSourceGroupHandler()
	if err != nil {
		log.Fatalf("Failed to create update source group handler: %v", err)
	}

	lambda.Start(handler.Handle)
}