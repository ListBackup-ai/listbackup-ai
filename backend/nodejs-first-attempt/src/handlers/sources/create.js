const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');
const { v4: uuidv4 } = require('uuid');

const SOURCES_TABLE = process.env.SOURCES_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Create source event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract auth context - HTTP API passes differently
        let userId, accountId;
        if (event.requestContext.authorizer && event.requestContext.authorizer.lambda) {
            userId = event.requestContext.authorizer.lambda.userId;
            accountId = event.requestContext.authorizer.lambda.accountId;
        } else if (event.requestContext.authorizer) {
            userId = event.requestContext.authorizer.userId;
            accountId = event.requestContext.authorizer.accountId;
        } else {
            // Fallback - extract from JWT token manually
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (authHeader) {
                const token = authHeader.replace(/^Bearer\s+/i, '');
                try {
                    const { dynamodb } = require('../../utils/aws-clients');
                    const jwt = require('jsonwebtoken');
                    const jwksClient = require('jwks-rsa');
                    const util = require('util');
                    
                    const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_gersj11kh';
                    const COGNITO_REGION = process.env.AWS_REGION || 'us-east-1';
                    
                    // Decode token to get user ID
                    const decodedToken = jwt.decode(token);
                    if (decodedToken && decodedToken.sub) {
                        userId = `user:${decodedToken.sub}`;
                        accountId = `account:${decodedToken.sub}`;
                    } else {
                        throw new Error('Unable to extract user ID from token');
                    }
                } catch (error) {
                    console.error('Token decode error:', error);
                    throw new Error('Invalid authorization token');
                }
            } else {
                throw new Error('No authorization context found');
            }
        }
        
        console.log('Extracted auth context - userId:', userId, 'accountId:', accountId);
        
        const body = JSON.parse(event.body || '{}');
        
        // Validate required fields
        const { name, type, config } = body;
        if (!name || !type || !config) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Missing required fields: name, type, config' })
            };
        }
        
        const sourceId = `source:${uuidv4()}`;
        const timestamp = new Date().toISOString();
        const timestampNum = Date.now();
        
        const source = {
            sourceId,
            accountId,
            name,
            type,
            config,
            status: 'inactive',
            lastSync: null,
            lastError: null,
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: userId
        };
        
        // Create source
        await dynamodb.send(new PutCommand({
            TableName: SOURCES_TABLE,
            Item: source
        }));
        
        // Log activity
        const activity = {
            eventId: `activity:${uuidv4()}`,
            accountId,
            userId,
            type: 'source.created',
            resourceId: sourceId,
            resourceType: 'source',
            description: `Created source: ${name}`,
            severity: 'info',
            metadata: {
                sourceType: type,
                sourceName: name
            },
            timestamp: timestampNum
        };
        
        await dynamodb.send(new PutCommand({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }));
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(source)
        };
        
    } catch (error) {
        console.error('Error creating source:', error);
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