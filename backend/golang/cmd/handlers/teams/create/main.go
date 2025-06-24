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
	"github.com/google/uuid"
)

type CreateTeamHandler struct {
	db *dynamodb.DynamoDB
}

type CreateTeamRequest struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description,omitempty"`
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

func NewCreateTeamHandler() (*CreateTeamHandler, error) {
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
	
	return &CreateTeamHandler{db: db}, nil
}

func (h *CreateTeamHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Create team request started")

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

	// Parse request body
	var createReq CreateTeamRequest
	if err := json.Unmarshal([]byte(event.Body), &createReq); err != nil {
		log.Printf("JSON parse error: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", 
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Invalid JSON format in request body"}`,
		}, nil
	}

	// Validate required fields
	if createReq.Name == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Team name is required"}`,
		}, nil
	}

	// Generate new team ID
	teamID := "team:" + uuid.New().String()

	// Create team object
	now := time.Now()
	team := Team{
		TeamID:      teamID,
		AccountID:   accountID,
		OwnerID:     userID,
		Name:        createReq.Name,
		Description: createReq.Description,
		Status:      "active",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Convert team to DynamoDB item
	teamItem, err := dynamodbattribute.MarshalMap(team)
	if err != nil {
		log.Printf("Failed to marshal team: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create team"}`,
		}, nil
	}

	// Save team to database
	teamsTable := os.Getenv("TEAMS_TABLE")
	if teamsTable == "" {
		teamsTable = "listbackup-main-teams"
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(teamsTable),
		Item:      teamItem,
	})
	if err != nil {
		log.Printf("Failed to create team: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create team"}`,
		}, nil
	}

	// Add the creator as admin member
	teamMember := TeamMember{
		TeamID:  teamID,
		UserID:  userID,
		Role:    "admin",
		Status:  "active",
		Permissions: TeamUserPermissions{
			CanManageTeam:     true,
			CanInviteMembers:  true,
			CanRemoveMembers:  true,
			CanManageAccounts: true,
			CanViewReports:    true,
		},
		JoinedAt:  now,
		UpdatedAt: now,
	}

	// Convert team member to DynamoDB item
	memberItem, err := dynamodbattribute.MarshalMap(teamMember)
	if err != nil {
		log.Printf("Failed to marshal team member: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create team member"}`,
		}, nil
	}

	teamMembersTable := os.Getenv("TEAM_MEMBERS_TABLE")
	if teamMembersTable == "" {
		teamMembersTable = "listbackup-main-team-members"
	}

	_, err = h.db.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(teamMembersTable),
		Item:      memberItem,
	})
	if err != nil {
		log.Printf("Failed to add team member: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to create team member"}`,
		}, nil
	}

	// Build response with clean team ID
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

	responseData := map[string]interface{}{
		"success": true,
		"data":    teamResponse,
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
	handler, err := NewCreateTeamHandler()
	if err != nil {
		log.Fatalf("Failed to create team handler: %v", err)
	}

	lambda.Start(handler.Handle)
}