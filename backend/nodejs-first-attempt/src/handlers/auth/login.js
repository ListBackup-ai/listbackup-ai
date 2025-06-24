const { QueryCommand, PutCommand, UpdateCommand, GetCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { SendCommand } = require('@aws-sdk/client-ses');
const { PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { AdminInitiateAuthCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { dynamodb, ses, eventBridge, cognitoIdentityProvider } = require('../../utils/aws-clients');
const jwt = require('jsonwebtoken');

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USERS_TABLE = process.env.USERS_TABLE;
const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

exports.handler = async (event) => {
    console.log('Login request:', JSON.stringify(event, null, 2));
    
    try {
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid JSON format in request body'
                })
            };
        }
        const { email, password, mfaCode } = body;
        
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Email and password are required'
                })
            };
        }
        
        // Authenticate with Cognito
        let authResult;
        try {
            const authParams = {
                UserPoolId: COGNITO_USER_POOL_ID,
                ClientId: COGNITO_CLIENT_ID,
                AuthFlow: 'ADMIN_NO_SRP_AUTH',
                AuthParameters: {
                    USERNAME: email.toLowerCase(),
                    PASSWORD: password
                }
            };

            // Add MFA code if provided
            if (mfaCode) {
                authParams.AuthParameters.SOFTWARE_TOKEN_MFA_CODE = mfaCode;
            }

            authResult = await cognitoIdentityProvider.send(new AdminInitiateAuthCommand(authParams));
            
        } catch (error) {
            console.error('Cognito authentication error:', error);
            
            if (error.code === 'NotAuthorizedException') {
                return {
                    statusCode: 401,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({
                        success: false,
                        error: 'Invalid credentials'
                    })
                };
            } else if (error.code === 'UserNotConfirmedException') {
                return {
                    statusCode: 403,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({
                        success: false,
                        error: 'Email not verified',
                        requiresVerification: true
                    })
                };
            } else if (error.code === 'SOFTWARE_TOKEN_MFA_NOT_FOUND') {
                return {
                    statusCode: 200,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({
                        success: false,
                        requiresMfa: true,
                        message: 'MFA code required'
                    })
                };
            } else {
                throw error;
            }
        }

        // Handle MFA challenge
        if (authResult.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    requiresMfa: true,
                    session: authResult.Session,
                    message: 'MFA code required'
                })
            };
        }

        // Get user details from Cognito
        const cognitoUser = await cognitoIdentityProvider.send(new AdminGetUserCommand({
            UserPoolId: COGNITO_USER_POOL_ID,
            Username: email.toLowerCase()
        }));

        const userAttributes = {};
        cognitoUser.UserAttributes.forEach(attr => {
            userAttributes[attr.Name] = attr.Value;
        });

        // Get or create user record in DynamoDB
        const userId = `user:${userAttributes.sub}`;
        let user = await getUserFromDynamoDB(userId);
        
        if (!user) {
            // Create user record if it doesn't exist
            user = await createUserRecord(userId, userAttributes);
        }
        
        // Use Cognito tokens directly
        const accessToken = authResult.AuthenticationResult.AccessToken;
        const idToken = authResult.AuthenticationResult.IdToken;
        const refreshToken = authResult.AuthenticationResult.RefreshToken;
        const expiresIn = authResult.AuthenticationResult.ExpiresIn;
        
        // Update user's last login
        const timestamp = new Date().toISOString();
        await dynamodb.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId: user.userId },
            UpdateExpression: 'SET lastLoginAt = :timestamp',
            ExpressionAttributeValues: {
                ':timestamp': timestamp
            }
        }));
        
        // Log successful login
        await logActivity(user.accountId, user.userId, 'auth', 'login_success', 'User logged in successfully');
        
        // Publish login event
        if (EVENT_BUS_NAME) {
            await eventBridge.send(new PutEventsCommand({
                Entries: [{
                    Source: 'listbackup.auth',
                    DetailType: 'User Login',
                    Detail: JSON.stringify({
                        userId: user.userId,
                        accountId: user.accountId,
                        email: user.email,
                        timestamp
                    }),
                    EventBusName: EVENT_BUS_NAME
                }]
            }));
        }
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data: {
                    accessToken,
                    idToken,
                    refreshToken,
                    expiresIn,
                    tokenType: 'Bearer',
                    user: {
                        userId: user.userId,
                        email: user.email,
                        name: user.name,
                        accountId: user.accountId,
                        role: user.role || 'user',
                        mfaEnabled: cognitoUser.MFAOptions?.length > 0 || false,
                        emailVerified: userAttributes.email_verified === 'true'
                    }
                }
            })
        };
        
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};

async function getUserFromDynamoDB(userId) {
    try {
        const result = await dynamodb.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId }
        }));
        return result.Item;
    } catch (error) {
        console.error('Error getting user from DynamoDB:', error);
        return null;
    }
}

async function createUserRecord(userId, userAttributes) {
    const accountId = `account:${userAttributes.sub}`;
    const timestamp = new Date().toISOString();
    
    // Create account first
    const account = {
        accountId,
        userId,
        name: `${userAttributes.name || userAttributes.email}'s Account`,
        plan: 'free',
        status: 'trial',
        billingEmail: userAttributes.email,
        createdAt: timestamp,
        updatedAt: timestamp,
        settings: {
            maxSources: 3,
            maxStorageGB: 5,
            maxBackupJobs: 5,
            retentionDays: 30,
            encryptionEnabled: true,
            twoFactorRequired: false
        },
        usage: {
            sources: 0,
            storageUsedGB: 0,
            backupJobs: 0,
            monthlyBackups: 0,
            monthlyAPIRequests: 0
        }
    };
    
    // Create user record
    const user = {
        userId,
        cognitoUserId: userAttributes.sub,
        email: userAttributes.email,
        name: userAttributes.name || userAttributes.email.split('@')[0],
        accountId,
        role: 'owner',
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLoginAt: timestamp,
        preferences: {
            timezone: 'UTC',
            notifications: {
                email: true,
                slack: false,
                backupComplete: true,
                backupFailed: true,
                weeklyReport: true
            },
            theme: 'auto'
        }
    };
    
    // Use transaction to create both records atomically
    await dynamodb.send(new TransactWriteCommand({
        TransactItems: [
            {
                Put: {
                    TableName: ACCOUNTS_TABLE,
                    Item: account,
                    ConditionExpression: 'attribute_not_exists(accountId)'
                }
            },
            {
                Put: {
                    TableName: USERS_TABLE,
                    Item: user,
                    ConditionExpression: 'attribute_not_exists(userId)'
                }
            }
        ]
    }));
    
    return user;
}

async function logActivity(accountId, userId, type, action, message) {
    const eventId = `activity:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now(); // Use number format
    
    try {
        await dynamodb.send(new PutCommand({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId,
                accountId,
                userId,
                type,
                action,
                status: action.includes('failed') ? 'error' : 'success',
                message,
                timestamp,
                ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
            }
        }));
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
        'Content-Type': 'application/json'
    };
}