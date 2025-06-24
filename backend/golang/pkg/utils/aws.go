package utils

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type AWSClients struct {
	CognitoClient        *cognitoidentityprovider.Client
	DynamoDBClient       *dynamodb.Client
	S3Client             *s3.Client
	SESClient            *ses.Client
	EventBridgeClient    *eventbridge.Client
	SecretsManagerClient *secretsmanager.Client
	SQSClient            *sqs.Client
}

// GetAWSConfig returns a properly configured AWS config with explicit region and endpoint resolution
func GetAWSConfig(ctx context.Context) (aws.Config, error) {
	// Get region from environment or default to us-east-1
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

	// Load default config with explicit region and retry configuration
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(region),
		config.WithRetryMaxAttempts(3),
		config.WithRetryMode(aws.RetryModeAdaptive),
	)
	if err != nil {
		return aws.Config{}, fmt.Errorf("failed to load AWS config: %v", err)
	}

	return cfg, nil
}

func NewAWSClients(ctx context.Context) (*AWSClients, error) {
	cfg, err := GetAWSConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get AWS config: %v", err)
	}

	// Create Cognito client with explicit configuration and endpoint resolver
	cognitoClient := cognitoidentityprovider.NewFromConfig(cfg, func(o *cognitoidentityprovider.Options) {
		o.Region = cfg.Region
		// Set explicit endpoint resolver to ensure proper connectivity
		o.EndpointResolver = cognitoidentityprovider.EndpointResolverFunc(func(region string, options cognitoidentityprovider.EndpointResolverOptions) (aws.Endpoint, error) {
			return aws.Endpoint{
				URL:           fmt.Sprintf("https://cognito-idp.%s.amazonaws.com", region),
				SigningRegion: region,
			}, nil
		})
	})

	// Create DynamoDB client with explicit endpoint resolver
	dynamoDBClient := dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
		o.Region = cfg.Region
		// Set explicit endpoint resolver to ensure proper connectivity
		o.EndpointResolver = dynamodb.EndpointResolverFunc(func(region string, options dynamodb.EndpointResolverOptions) (aws.Endpoint, error) {
			return aws.Endpoint{
				URL:           fmt.Sprintf("https://dynamodb.%s.amazonaws.com", region),
				SigningRegion: region,
			}, nil
		})
	})

	return &AWSClients{
		CognitoClient:        cognitoClient,
		DynamoDBClient:       dynamoDBClient,
		S3Client:             s3.NewFromConfig(cfg),
		SESClient:            ses.NewFromConfig(cfg),
		EventBridgeClient:    eventbridge.NewFromConfig(cfg),
		SecretsManagerClient: secretsmanager.NewFromConfig(cfg),
		SQSClient:            sqs.NewFromConfig(cfg),
	}, nil
}