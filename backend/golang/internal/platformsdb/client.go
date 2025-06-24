package platformsdb

import (
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

// Client uses AWS SDK v1 for Go 1.16 compatibility (platforms service only)
type Client struct {
	client *dynamodb.DynamoDB
}

func NewClient() (*Client, error) {
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
	
	return &Client{client: client}, nil
}

func (db *Client) GetItem(tableName string, key map[string]*dynamodb.AttributeValue, result interface{}) error {
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

func (db *Client) PutItem(tableName string, item interface{}) error {
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

func (db *Client) Query(tableName string, keyCondition string, expressionAttributeValues map[string]*dynamodb.AttributeValue, results interface{}) error {
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
func (db *Client) ScanAll(tableName string, results interface{}) error {
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
func (db *Client) QueryGSI(tableName string, indexName string, keyCondition string, expressionAttributeValues map[string]*dynamodb.AttributeValue, results interface{}) error {
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

// Helper function to create string attribute value
func StringValue(value string) *dynamodb.AttributeValue {
	return &dynamodb.AttributeValue{
		S: aws.String(value),
	}
}