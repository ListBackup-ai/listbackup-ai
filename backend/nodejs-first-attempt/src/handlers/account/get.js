const { GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');
const { extractAuthContext } = require('../../utils/auth');

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
    console.log('Get account event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        
        // Get account details
        const accountResult = await dynamodb.send(new GetCommand({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }));
        
        if (!accountResult.Item) {
            // Create default account if it doesn't exist
            const defaultAccount = {
                accountId,
                name: 'Default Account',
                status: 'active',
                plan: 'free',
                limits: {
                    storage: 1024 * 1024 * 1024, // 1GB
                    sources: 5,
                    jobs: 10,
                    apiCalls: 1000
                },
                usage: {
                    storage: {
                        used: 0,
                        limit: 1024 * 1024 * 1024
                    },
                    sources: {
                        used: 0,
                        limit: 5
                    },
                    jobs: {
                        used: 0,
                        limit: 10
                    },
                    apiCalls: {
                        used: 0,
                        limit: 1000,
                        period: 'monthly',
                        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
                    }
                },
                billing: {
                    customerId: null,
                    subscriptionId: null,
                    status: 'free'
                },
                settings: {
                    timezone: 'UTC',
                    notifications: {
                        email: true,
                        jobFailures: true,
                        storageWarnings: true
                    }
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await dynamodb.send(new PutCommand({
                TableName: ACCOUNTS_TABLE,
                Item: defaultAccount
            }));
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(defaultAccount)
            };
        }
        
        // Get user details for additional context
        const userResult = await dynamodb.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId }
        }));
        
        const account = accountResult.Item;
        
        // Add user information to account response
        if (userResult.Item) {
            account.user = {
                userId: userResult.Item.userId,
                email: userResult.Item.email,
                name: userResult.Item.name,
                role: userResult.Item.role || 'user',
                status: userResult.Item.status
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(account)
        };
        
    } catch (error) {
        console.error('Error getting account:', error);
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