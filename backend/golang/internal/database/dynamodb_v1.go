package database

import (
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

// Table constants for DynamoDB v1 client
var (
	UsersTable               = os.Getenv("USERS_TABLE")
	AccountsTable            = os.Getenv("ACCOUNTS_TABLE")
	UserAccountsTable        = os.Getenv("USER_ACCOUNTS_TABLE")
	PlatformsTable           = os.Getenv("PLATFORMS_TABLE")
	PlatformSourcesTable     = os.Getenv("PLATFORM_SOURCES_TABLE")
	PlatformConnectionsTable = os.Getenv("PLATFORM_CONNECTIONS_TABLE")
	SourceGroupsTable        = os.Getenv("SOURCE_GROUPS_TABLE")
	SourcesTable             = os.Getenv("SOURCES_TABLE")
	ActivityTable            = os.Getenv("ACTIVITY_TABLE")
	JobsTable                = os.Getenv("JOBS_TABLE")
	FilesTable               = os.Getenv("FILES_TABLE")
	TeamsTable               = os.Getenv("TEAMS_TABLE")
	TeamMembersTable         = os.Getenv("TEAM_MEMBERS_TABLE")
	TeamAccountsTable        = os.Getenv("TEAM_ACCOUNTS_TABLE")
	TeamInvitationsTable     = os.Getenv("TEAM_INVITATIONS_TABLE")
	ClientsTable             = os.Getenv("CLIENTS_TABLE")
	ClientAccountsTable      = os.Getenv("CLIENT_ACCOUNTS_TABLE")
	ClientTeamsTable         = os.Getenv("CLIENT_TEAMS_TABLE")
	ClientInvitationsTable   = os.Getenv("CLIENT_INVITATIONS_TABLE")
	ClientPermissionsTable   = os.Getenv("CLIENT_PERMISSIONS_TABLE")
)

// DynamoDBClientV1 uses AWS SDK v1 for Go 1.16 compatibility
type DynamoDBClientV1 struct {
	client *dynamodb.DynamoDB
}

func NewDynamoDBClientV1() (*DynamoDBClientV1, error) {
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
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	// Create DynamoDB client
	client := dynamodb.New(sess)
	
	return &DynamoDBClientV1{client: client}, nil
}

func (db *DynamoDBClientV1) GetItem(tableName string, key map[string]*dynamodb.AttributeValue, result interface{}) error {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key:       key,
	}

	resp, err := db.client.GetItem(input)
	if err != nil {
		return fmt.Errorf("failed to get item from %s: %v", tableName, err)
	}

	if resp.Item == nil {
		return fmt.Errorf("item not found")
	}

	err = dynamodbattribute.UnmarshalMap(resp.Item, result)
	if err != nil {
		return fmt.Errorf("failed to unmarshal item: %v", err)
	}

	return nil
}

func (db *DynamoDBClientV1) PutItem(tableName string, item interface{}) error {
	av, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return fmt.Errorf("failed to marshal item: %v", err)
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      av,
	}

	_, err = db.client.PutItem(input)
	if err != nil {
		return fmt.Errorf("failed to put item to %s: %v", tableName, err)
	}

	return nil
}

func (db *DynamoDBClientV1) Query(tableName string, keyCondition string, expressionAttributeValues map[string]*dynamodb.AttributeValue, results interface{}) error {
	input := &dynamodb.QueryInput{
		TableName:                 aws.String(tableName),
		KeyConditionExpression:    aws.String(keyCondition),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	resp, err := db.client.Query(input)
	if err != nil {
		return fmt.Errorf("failed to query %s: %v", tableName, err)
	}

	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, results)
	if err != nil {
		return fmt.Errorf("failed to unmarshal query results: %v", err)
	}

	return nil
}

// ScanAll scans an entire table
func (db *DynamoDBClientV1) ScanAll(tableName string, results interface{}) error {
	input := &dynamodb.ScanInput{
		TableName: aws.String(tableName),
	}

	result, err := db.client.Scan(input)
	if err != nil {
		return fmt.Errorf("failed to scan %s: %v", tableName, err)
	}

	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, results)
	if err != nil {
		return fmt.Errorf("failed to unmarshal scan results: %v", err)
	}

	return nil
}

// QueryGSI queries a Global Secondary Index
func (db *DynamoDBClientV1) QueryGSI(tableName string, indexName string, keyCondition string, expressionAttributeValues map[string]*dynamodb.AttributeValue, results interface{}) error {
	input := &dynamodb.QueryInput{
		TableName:                 aws.String(tableName),
		IndexName:                 aws.String(indexName),
		KeyConditionExpression:    aws.String(keyCondition),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	resp, err := db.client.Query(input)
	if err != nil {
		return fmt.Errorf("failed to query GSI %s on %s: %v", indexName, tableName, err)
	}

	err = dynamodbattribute.UnmarshalListOfMaps(resp.Items, results)
	if err != nil {
		return fmt.Errorf("failed to unmarshal GSI query results: %v", err)
	}

	return nil
}

// UpdateItem updates an item in DynamoDB
func (db *DynamoDBClientV1) UpdateItem(tableName string, key map[string]*dynamodb.AttributeValue, updateExpression string, expressionAttributeValues map[string]*dynamodb.AttributeValue) error {
	input := &dynamodb.UpdateItemInput{
		TableName:                 aws.String(tableName),
		Key:                       key,
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	_, err := db.client.UpdateItem(input)
	if err != nil {
		return fmt.Errorf("failed to update item in %s: %v", tableName, err)
	}

	return nil
}

// DeleteItem deletes an item from DynamoDB
func (db *DynamoDBClientV1) DeleteItem(tableName string, key map[string]*dynamodb.AttributeValue) error {
	input := &dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key:       key,
	}

	_, err := db.client.DeleteItem(input)
	if err != nil {
		return fmt.Errorf("failed to delete item from %s: %v", tableName, err)
	}

	return nil
}

// Helper function to create string attribute value
func StringValue(value string) *dynamodb.AttributeValue {
	return &dynamodb.AttributeValue{
		S: aws.String(value),
	}
}