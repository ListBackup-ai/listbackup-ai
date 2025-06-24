const { QueryCommand, PutCommand, UpdateCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { SendCommand } = require('@aws-sdk/client-ses');
const { PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { dynamodb, ses, eventBridge, cognitoIdentityProvider } = require('../../utils/aws-clients');

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USERS_TABLE = process.env.USERS_TABLE;
const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

exports.handler = async (event) => {
    console.log('Register request:', JSON.stringify(event, null, 2));
    
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
    
    const { email, password, name, accountName } = body;
    
    try {
        // Validate input
        if (!email || !password || !name) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Email, password, and name are required'
                })
            };
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid email format'
                })
            };
        }
        
        // Validate password strength (Cognito will also validate)
        if (password.length < 8) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Password must be at least 8 characters long'
                })
            };
        }
        
        const normalizedEmail = email.toLowerCase();
        
        try {
            // Create user in Cognito
            const createUserParams = {
                UserPoolId: COGNITO_USER_POOL_ID,
                Username: normalizedEmail,
                TemporaryPassword: password,
                MessageAction: 'SUPPRESS', // Don't send welcome email yet
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: normalizedEmail
                    },
                    {
                        Name: 'name',
                        Value: name
                    },
                    {
                        Name: 'email_verified',
                        Value: 'false'
                    }
                ]
            };
            
            const cognitoUser = await cognitoIdentityProvider.send(new AdminCreateUserCommand(createUserParams));
            
            // Set permanent password
            await cognitoIdentityProvider.send(new AdminSetUserPasswordCommand({
                UserPoolId: COGNITO_USER_POOL_ID,
                Username: normalizedEmail,
                Password: password,
                Permanent: true
            }));
            
            // Get the user's sub (unique ID)
            const userAttributes = {};
            cognitoUser.User.Attributes.forEach(attr => {
                userAttributes[attr.Name] = attr.Value;
            });
            
            const cognitoUserId = userAttributes.sub;
            const userId = `user:${cognitoUserId}`;
            const accountId = `account:${cognitoUserId}`;
            const timestamp = new Date().toISOString();
            
            // Create account record
            const account = {
                accountId,
                userId,
                name: accountName || `${name}'s Account`,
                plan: 'free',
                status: 'trial',
                billingEmail: normalizedEmail,
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
                cognitoUserId,
                email: normalizedEmail,
                name,
                accountId,
                role: 'owner',
                status: 'active',
                createdAt: timestamp,
                updatedAt: timestamp,
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
            
            // Log registration activity
            await logActivity(accountId, userId, 'auth', 'register_success', 'User registered successfully');
            
            // Publish registration event
            if (EVENT_BUS_NAME) {
                await eventBridge.send(new PutEventsCommand({
                    Entries: [{
                        Source: 'listbackup.auth',
                        DetailType: 'User Registration',
                        Detail: JSON.stringify({
                            userId,
                            accountId,
                            email: normalizedEmail,
                            name,
                            timestamp
                        }),
                        EventBusName: EVENT_BUS_NAME
                    }]
                }));
            }
            
            return {
                statusCode: 201,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            userId,
                            email: normalizedEmail,
                            name,
                            accountId,
                            role: 'owner',
                            mfaEnabled: false,
                            emailVerified: false
                        },
                        account: {
                            accountId,
                            name: account.name,
                            plan: account.plan,
                            status: account.status
                        },
                        message: 'Registration successful. Please check your email to verify your account.'
                    }
                })
            };
            
        } catch (cognitoError) {
            console.error('Cognito registration error:', cognitoError);
            
            if (cognitoError.code === 'UsernameExistsException') {
                return {
                    statusCode: 409,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({
                        success: false,
                        error: 'User with this email already exists'
                    })
                };
            } else if (cognitoError.code === 'InvalidPasswordException') {
                return {
                    statusCode: 400,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({
                        success: false,
                        error: 'Password does not meet requirements'
                    })
                };
            } else {
                throw cognitoError;
            }
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        
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
                status: 'success',
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