package database

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type DynamoDBClient struct {
	client *dynamodb.Client
}

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

func NewDynamoDBClient(ctx context.Context) (*DynamoDBClient, error) {
	// Get region from environment or default to us-east-1
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}
	
	fmt.Printf("DynamoDB client initializing with region: %s\n", region)

	// Load AWS config with explicit region and retry configuration
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(region),
		config.WithRetryMaxAttempts(3),
		config.WithRetryMode(aws.RetryModeAdaptive),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %v", err)
	}

	// Create DynamoDB client with explicit endpoint resolver and configuration
	client := dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
		o.Region = region
		// Set explicit endpoint resolver to ensure proper connectivity
		o.EndpointResolver = dynamodb.EndpointResolverFunc(func(region string, options dynamodb.EndpointResolverOptions) (aws.Endpoint, error) {
			return aws.Endpoint{
				URL:           fmt.Sprintf("https://dynamodb.%s.amazonaws.com", region),
				SigningRegion: region,
			}, nil
		})
	})
	
	fmt.Printf("DynamoDB client created successfully with endpoint: https://dynamodb.%s.amazonaws.com\n", region)
	return &DynamoDBClient{client: client}, nil
}

func (db *DynamoDBClient) GetItem(ctx context.Context, tableName string, key map[string]types.AttributeValue, result interface{}) error {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key:       key,
	}

	resp, err := db.client.GetItem(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to get item from %s: %v", tableName, err)
	}

	if resp.Item == nil {
		return fmt.Errorf("item not found")
	}

	err = attributevalue.UnmarshalMap(resp.Item, result)
	if err != nil {
		return fmt.Errorf("failed to unmarshal item: %v", err)
	}

	return nil
}

func (db *DynamoDBClient) PutItem(ctx context.Context, tableName string, item interface{}) error {
	av, err := attributevalue.MarshalMap(item)
	if err != nil {
		return fmt.Errorf("failed to marshal item: %v", err)
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      av,
	}

	_, err = db.client.PutItem(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to put item to %s: %v", tableName, err)
	}

	return nil
}

func (db *DynamoDBClient) UpdateItem(ctx context.Context, tableName string, key map[string]types.AttributeValue, updateExpression string, expressionAttributeValues map[string]types.AttributeValue) error {
	input := &dynamodb.UpdateItemInput{
		TableName:                 aws.String(tableName),
		Key:                       key,
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	_, err := db.client.UpdateItem(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to update item in %s: %v", tableName, err)
	}

	return nil
}

func (db *DynamoDBClient) UpdateItemWithNames(ctx context.Context, tableName string, key map[string]types.AttributeValue, updateExpression string, expressionAttributeValues map[string]types.AttributeValue, expressionAttributeNames map[string]string) error {
	input := &dynamodb.UpdateItemInput{
		TableName:                 aws.String(tableName),
		Key:                       key,
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	if expressionAttributeNames != nil {
		input.ExpressionAttributeNames = expressionAttributeNames
	}

	_, err := db.client.UpdateItem(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to update item in %s: %v", tableName, err)
	}

	return nil
}

func (db *DynamoDBClient) Query(ctx context.Context, tableName string, keyCondition string, expressionAttributeValues map[string]types.AttributeValue, results interface{}) error {
	input := &dynamodb.QueryInput{
		TableName:                 aws.String(tableName),
		KeyConditionExpression:    aws.String(keyCondition),
		ExpressionAttributeValues: expressionAttributeValues,
	}

	resp, err := db.client.Query(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to query %s: %v", tableName, err)
	}

	err = attributevalue.UnmarshalListOfMaps(resp.Items, results)
	if err != nil {
		return fmt.Errorf("failed to unmarshal query results: %v", err)
	}

	return nil
}

func (db *DynamoDBClient) QueryGSI(ctx context.Context, tableName string, indexName string, keyCondition string, expressionAttributeValues map[string]interface{}, results interface{}) error {
	// Convert interface{} values to AttributeValue
	avMap := make(map[string]types.AttributeValue)
	for k, v := range expressionAttributeValues {
		av, err := attributevalue.Marshal(v)
		if err != nil {
			return fmt.Errorf("failed to marshal expression attribute value %s: %v", k, err)
		}
		avMap[k] = av
	}

	input := &dynamodb.QueryInput{
		TableName:                 aws.String(tableName),
		IndexName:                 aws.String(indexName),
		KeyConditionExpression:    aws.String(keyCondition),
		ExpressionAttributeValues: avMap,
	}

	resp, err := db.client.Query(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to query GSI %s on %s: %v", indexName, tableName, err)
	}

	err = attributevalue.UnmarshalListOfMaps(resp.Items, results)
	if err != nil {
		return fmt.Errorf("failed to unmarshal GSI query results: %v", err)
	}

	return nil
}

func (db *DynamoDBClient) TransactWrite(ctx context.Context, transactItems []types.TransactWriteItem) error {
	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: transactItems,
	}

	_, err := db.client.TransactWriteItems(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to execute transaction: %v", err)
	}

	return nil
}

func (db *DynamoDBClient) DeleteItem(ctx context.Context, tableName string, key map[string]types.AttributeValue) error {
	input := &dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key:       key,
	}

	_, err := db.client.DeleteItem(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to delete item from %s: %v", tableName, err)
	}

	return nil
}

func (db *DynamoDBClient) ScanTable(ctx context.Context, tableName string, results interface{}) error {
	fmt.Printf("Scanning DynamoDB table: %s\n", tableName)
	
	input := &dynamodb.ScanInput{
		TableName: aws.String(tableName),
	}

	resp, err := db.client.Scan(ctx, input)
	if err != nil {
		fmt.Printf("DynamoDB scan error for table %s: %v\n", tableName, err)
		return fmt.Errorf("failed to scan %s: %v", tableName, err)
	}

	fmt.Printf("DynamoDB scan successful, found %d items\n", len(resp.Items))

	err = attributevalue.UnmarshalListOfMaps(resp.Items, results)
	if err != nil {
		return fmt.Errorf("failed to unmarshal scan results: %v", err)
	}

	return nil
}

func (db *DynamoDBClient) ScanAll(ctx context.Context, tableName string, results interface{}) error {
	return db.ScanTable(ctx, tableName, results)
}

// Utility functions for marshalling/unmarshalling
func MarshalDynamoDBItem(item interface{}) (map[string]types.AttributeValue, error) {
	return attributevalue.MarshalMap(item)
}

func UnmarshalDynamoDBItem(av map[string]types.AttributeValue, result interface{}) error {
	return attributevalue.UnmarshalMap(av, result)
}