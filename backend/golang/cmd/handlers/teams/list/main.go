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

type ListTeamsHandler struct {
	db *dynamodb.DynamoDB
}

type Team struct {
	TeamID      string    `json:"teamId" dynamodbav:"teamId"`
	AccountID   string    `json:"accountId" dynamodbav:"accountId"`
	OwnerID     string    `json:"ownerId" dynamodbav:"ownerId"`
	Name        string    `json:"name" dynamodbav:"name"`
	Description string    `json:"description" dynamodbav:"description"`
	Status      string    `json:"status" dynamodbav:"status"`
	CreatedAt   time.Time `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt" dynamodbav:"updatedAt"`
}

type TeamMember struct {
	TeamID      string              `json:"teamId" dynamodbav:"teamId"`
	UserID      string              `json:"userId" dynamodbav:"userId"`
	Role        string              `json:"role" dynamodbav:"role"`
	Status      string              `json:"status" dynamodbav:"status"`
	Permissions TeamUserPermissions `json:"permissions" dynamodbav:"permissions"`
	JoinedAt    time.Time           `json:"joinedAt" dynamodbav:"joinedAt"`
	UpdatedAt   time.Time           `json:"updatedAt" dynamodbav:"updatedAt"`
}

type TeamUserPermissions struct {
	CanManageTeam     bool `json:"canManageTeam" dynamodbav:"canManageTeam"`
	CanInviteMembers  bool `json:"canInviteMembers" dynamodbav:"canInviteMembers"`
	CanRemoveMembers  bool `json:"canRemoveMembers" dynamodbav:"canRemoveMembers"`
	CanManageAccounts bool `json:"canManageAccounts" dynamodbav:"canManageAccounts"`
	CanViewReports    bool `json:"canViewReports" dynamodbav:"canViewReports"`
}

func NewListTeamsHandler() (*ListTeamsHandler, error) {
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

	// Create DynamoDB client
	db := dynamodb.New(sess)
	
	return &ListTeamsHandler{db: db}, nil
}

func (h *ListTeamsHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("List teams request started")

	// Handle OPTIONS for CORS
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

	// Extract auth context from lambda authorizer
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
		log.Printf("Auth failed - userID: %s, accountID: %s", userID, accountID)
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

	// Get teams where user is a member via team-members table
	teamMembersTable := os.Getenv("TEAM_MEMBERS_TABLE")
	if teamMembersTable == "" {
		teamMembersTable = "listbackup-main-team-members"
	}

	// Query for teams where user is a member using UserTeamsIndex
	memberResult, err := h.db.Query(&dynamodb.QueryInput{
		TableName:              aws.String(teamMembersTable),
		IndexName:              aws.String("UserTeamsIndex"),
		KeyConditionExpression: aws.String("userId = :userId"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":userId": {
				S: aws.String(userID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to query team memberships: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to get team memberships"}`,
		}, nil
	}

	// Extract team IDs from memberships
	var teamIDs []string
	for _, item := range memberResult.Items {
		var member TeamMember
		err := dynamodbattribute.UnmarshalMap(item, &member)
		if err != nil {
			log.Printf("Failed to unmarshal team member: %v", err)
			continue
		}
		teamIDs = append(teamIDs, member.TeamID)
	}

	// If no team memberships, return empty list
	if len(teamIDs) == 0 {
		responseData := map[string]interface{}{
			"success": true,
			"data":    []interface{}{},
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

	// Get team details for each team ID
	teamsTable := os.Getenv("TEAMS_TABLE")
	if teamsTable == "" {
		teamsTable = "listbackup-main-teams"
	}

	var teams []map[string]interface{}
	for _, teamID := range teamIDs {
		result, err := h.db.GetItem(&dynamodb.GetItemInput{
			TableName: aws.String(teamsTable),
			Key: map[string]*dynamodb.AttributeValue{
				"teamId": {
					S: aws.String(teamID),
				},
			},
		})
		if err != nil {
			log.Printf("Failed to get team %s: %v", teamID, err)
			continue
		}

		if result.Item == nil {
			log.Printf("Team %s not found", teamID)
			continue
		}

		var team Team
		err = dynamodbattribute.UnmarshalMap(result.Item, &team)
		if err != nil {
			log.Printf("Failed to unmarshal team %s: %v", teamID, err)
			continue
		}

		// Only include teams from the current account
		if team.AccountID == accountID {
			teamResponse := map[string]interface{}{
				"teamId":      strings.TrimPrefix(team.TeamID, "team:"),
				"accountId":   team.AccountID,
				"ownerId":     team.OwnerID,
				"name":        team.Name,
				"description": team.Description,
				"status":      team.Status,
				"createdAt":   team.CreatedAt,
				"updatedAt":   team.UpdatedAt,
			}
			teams = append(teams, teamResponse)
		}
	}

	responseData := map[string]interface{}{
		"success": true,
		"data":    teams,
	}

	responseBody, err := json.Marshal(responseData)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create response"}`,
		}, nil
	}

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
	handler, err := NewListTeamsHandler()
	if err != nil {
		log.Fatalf("Failed to create list teams handler: %v", err)
	}

	lambda.Start(handler.Handle)
}