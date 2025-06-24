const { GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');

const SOURCES_TABLE = process.env.SOURCES_TABLE;

exports.handler = async (event) => {
    console.log('Get sources event:', JSON.stringify(event, null, 2));
    
    try {
        let { sourceId } = event.pathParameters || {};
        console.log('Event requestContext:', JSON.stringify(event.requestContext, null, 2));
        
        // Extract auth context - HTTP API passes differently than REST API
        let userId, accountId;
        if (event.requestContext.authorizer) {
            // Try different context formats
            if (event.requestContext.authorizer.lambda) {
                // Lambda authorizer context
                userId = event.requestContext.authorizer.lambda.userId;
                accountId = event.requestContext.authorizer.lambda.accountId;
            } else if (event.requestContext.authorizer.principalId) {
                // Principal ID format
                userId = event.requestContext.authorizer.principalId;
                accountId = event.requestContext.authorizer.accountId;
            } else {
                // Direct format
                userId = event.requestContext.authorizer.userId;
                accountId = event.requestContext.authorizer.accountId;
            }
        } else {
            // Fallback - extract from JWT token manually
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (authHeader) {
                const token = authHeader.replace(/^Bearer\s+/i, '');
                try {
                    const jwt = require('jsonwebtoken');
                    
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
        
        console.log('Extracted userId:', userId, 'accountId:', accountId);
        
        if (sourceId) {
            // Ensure sourceId has the 'source:' prefix
            if (!sourceId.startsWith('source:')) {
                sourceId = `source:${sourceId}`;
            }
            
            // Get specific source
            const result = await dynamodb.send(new GetCommand({
                TableName: SOURCES_TABLE,
                Key: { sourceId }
            }));
            
            if (!result.Item) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Source not found' })
                };
            }
            
            // Verify source belongs to user's account
            if (result.Item.accountId !== accountId) {
                return {
                    statusCode: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Access denied' })
                };
            }
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result.Item)
            };
        } else {
            // List all sources for account
            const result = await dynamodb.send(new QueryCommand({
                TableName: SOURCES_TABLE,
                IndexName: 'AccountIndex',
                KeyConditionExpression: 'accountId = :accountId',
                ExpressionAttributeValues: {
                    ':accountId': accountId
                }
            }));
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result.Items || [])
            };
        }
        
    } catch (error) {
        console.error('Error getting sources:', error);
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