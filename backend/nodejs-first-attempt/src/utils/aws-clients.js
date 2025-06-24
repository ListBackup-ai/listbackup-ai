// AWS SDK v3 clients utility
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { SESClient } = require('@aws-sdk/client-ses');
const { SQSClient } = require('@aws-sdk/client-sqs');
const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
const { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');

// Create clients with region configuration
const region = process.env.AWS_REGION || 'us-east-1';

// DynamoDB clients
const dynamoDBClient = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(dynamoDBClient);

// Other AWS service clients
const s3 = new S3Client({ region });
const cognitoIdentityProvider = new CognitoIdentityProviderClient({ region });
const ses = new SESClient({ region });
const sqs = new SQSClient({ region });
const eventBridge = new EventBridgeClient({ region });
const secretsManager = new SecretsManagerClient({ region });

module.exports = {
    dynamodb,
    dynamoDBClient,
    s3,
    cognitoIdentityProvider,
    ses,
    sqs,
    eventBridge,
    secretsManager
};