const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');
const { v4: uuidv4 } = require('uuid');
const { extractAuthContext } = require('../../utils/auth');

const INTEGRATIONS_TABLE = process.env.INTEGRATIONS_TABLE || 'listbackup-integrations-dev';

exports.handler = async (event) => {
    console.log('Create integration event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const body = JSON.parse(event.body);
        
        const {
            appIntegrationId,
            connectionName,
            auth_config,
            description
        } = body;
        
        // Validate required fields
        if (!appIntegrationId || !connectionName || !auth_config) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Missing required fields: appIntegrationId, connectionName, auth_config' 
                })
            };
        }
        
        const integrationId = uuidv4();
        const currentTime = Date.now();
        
        const integration = {
            integrationId,
            accountId,
            userId,
            appIntegrationId,
            connectionName,
            auth_config,
            description: description || '',
            status: 'active',
            createdAt: currentTime,
            updatedAt: currentTime,
            createdBy: userId
        };
        
        // Save to DynamoDB
        const params = {
            TableName: INTEGRATIONS_TABLE,
            Item: integration,
            ConditionExpression: 'attribute_not_exists(integrationId)'
        };
        
        await dynamodb.send(new PutCommand(params));
        
        console.log(`Integration created: ${integrationId}`);
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                integration
            })
        };
        
    } catch (error) {
        console.error('Error creating integration:', error);
        
        if (error.code === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Integration already exists' })
            };
        }
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};