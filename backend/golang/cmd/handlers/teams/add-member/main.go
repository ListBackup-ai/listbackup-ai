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

type AddMemberHandler struct {
	db *dynamodb.DynamoDB
}

type AddMemberRequest struct {
	UserID string `json:"userId" validate:"required"`
	Role   string `json:"role,omitempty"`
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

func NewAddMemberHandler() (*AddMemberHandler, error) {
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
	
	return &AddMemberHandler{db: db}, nil
}

func (h *AddMemberHandler) Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Add team member request started")

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

	// Get team ID from path parameters
	teamID := event.PathParameters["teamId"]
	if teamID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Team ID is required"}`,
		}, nil
	}

	// Add team: prefix if not present
	if !strings.HasPrefix(teamID, "team:") {
		teamID = "team:" + teamID
	}

	// Parse request body
	var addReq AddMemberRequest
	if err := json.Unmarshal([]byte(event.Body), &addReq); err != nil {
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
	if addReq.UserID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "User ID is required"}`,
		}, nil
	}

	// Default role if not specified
	if addReq.Role == "" {
		addReq.Role = "member"
	}

	// Validate role
	if addReq.Role != "admin" && addReq.Role != "member" && addReq.Role != "viewer" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Invalid role. Must be admin, member, or viewer"}`,
		}, nil
	}

	// Verify team exists and user has permission to add members
	teamsTable := os.Getenv("TEAMS_TABLE")
	if teamsTable == "" {
		teamsTable = "listbackup-main-teams"
	}

	result, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(teamsTable),
		Key: map[string]*dynamodb.AttributeValue{
			"teamId": {
				S: aws.String(teamID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get team: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to get team"}`,
		}, nil
	}

	if result.Item == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Team not found"}`,
		}, nil
	}

	var team Team
	err = dynamodbattribute.UnmarshalMap(result.Item, &team)
	if err != nil {
		log.Printf("Failed to unmarshal team: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to process team data"}`,
		}, nil
	}

	// Check if team belongs to current account
	if team.AccountID != accountID {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Access denied"}`,
		}, nil
	}

	// Check if user has permission to add members (must be team owner or admin)
	teamMembersTable := os.Getenv("TEAM_MEMBERS_TABLE")
	if teamMembersTable == "" {
		teamMembersTable = "listbackup-main-team-members"
	}

	memberResult, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(teamMembersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"teamId": {
				S: aws.String(teamID),
			},
			"userId": {
				S: aws.String(userID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to get team membership: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to check permissions"}`,
		}, nil
	}

	var requestingMember TeamMember
	if memberResult.Item != nil {
		err = dynamodbattribute.UnmarshalMap(memberResult.Item, &requestingMember)
		if err != nil {
			log.Printf("Failed to unmarshal member: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 500,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
					"Content-Type":                 "application/json",
				},
				Body: `{"success": false, "error": "Failed to process member data"}`,
			}, nil
		}
	}

	// Check permissions
	canAddMember := team.OwnerID == userID || 
		(memberResult.Item != nil && requestingMember.Role == "admin" && requestingMember.Permissions.CanInviteMembers)

	if !canAddMember {
		return events.APIGatewayProxyResponse{
			StatusCode: 403,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Insufficient permissions to add members"}`,
		}, nil
	}

	// Check if user is already a member
	existingMemberResult, err := h.db.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(teamMembersTable),
		Key: map[string]*dynamodb.AttributeValue{
			"teamId": {
				S: aws.String(teamID),
			},
			"userId": {
				S: aws.String(addReq.UserID),
			},
		},
	})
	if err != nil {
		log.Printf("Failed to check existing membership: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "Failed to check existing membership"}`,
		}, nil
	}

	if existingMemberResult.Item != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 409,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Content-Type":                 "application/json",
			},
			Body: `{"success": false, "error": "User is already a member of this team"}`,
		}, nil
	}

	// Create new team member
	now := time.Now()
	var permissions TeamUserPermissions
	
	switch addReq.Role {
	case "admin":
		permissions = TeamUserPermissions{
			CanManageTeam:     true,
			CanInviteMembers:  true,
			CanRemoveMembers:  true,
			CanManageAccounts: true,
			CanViewReports:    true,
		}
	case "member":
		permissions = TeamUserPermissions{
			CanManageTeam:     false,
			CanInviteMembers:  true,
			CanRemoveMembers:  false,
			CanManageAccounts: false,
			CanViewReports:    true,
		}
	case "viewer":
		permissions = TeamUserPermissions{
			CanManageTeam:     false,
			CanInviteMembers:  false,
			CanRemoveMembers:  false,
			CanManageAccounts: false,
			CanViewReports:    true,
		}
	}

	teamMember := TeamMember{
		TeamID:      teamID,
		UserID:      addReq.UserID,
		Role:        addReq.Role,
		Status:      "active",
		Permissions: permissions,
		JoinedAt:    now,
		UpdatedAt:   now,
	}

	// Save team member to database
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
			Body: `{"success": false, "error": "Failed to add team member"}`,
		}, nil
	}

	// Build response
	memberResponse := map[string]interface{}{
		"teamId":      strings.TrimPrefix(teamMember.TeamID, "team:"),
		"userId":      teamMember.UserID,
		"role":        teamMember.Role,
		"status":      teamMember.Status,
		"permissions": teamMember.Permissions,
		"joinedAt":    teamMember.JoinedAt,
		"updatedAt":   teamMember.UpdatedAt,
	}

	responseData := map[string]interface{}{
		"success": true,
		"data":    memberResponse,
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
		StatusCode: 201,
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
	handler, err := NewAddMemberHandler()
	if err != nil {
		log.Fatalf("Failed to create add member handler: %v", err)
	}

	lambda.Start(handler.Handle)
}