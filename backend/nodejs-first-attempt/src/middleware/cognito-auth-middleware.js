const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../utils/aws-clients');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const util = require('util');

const USERS_TABLE = process.env.USERS_TABLE;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_REGION = process.env.AWS_REGION || 'us-east-1';

// JWKS client for fetching Cognito public keys
const client = jwksClient({
    jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

const getKey = util.promisify(client.getSigningKey);

exports.handler = async (event) => {
    console.log('Cognito Authorizer event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract token from Authorization header
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authHeader) {
            throw new Error('No authorization header');
        }
        
        const token = authHeader.replace(/^Bearer\s+/i, '');
        if (!token) {
            throw new Error('No token provided');
        }
        
        // Decode token header to get key ID
        const decodedToken = jwt.decode(token, { complete: true });
        if (!decodedToken) {
            throw new Error('Invalid token format');
        }
        
        // Get signing key from Cognito
        let key;
        try {
            const signingKey = await getKey(decodedToken.header.kid);
            key = signingKey.getPublicKey();
        } catch (error) {
            console.error('Failed to get signing key:', error);
            throw new Error('Invalid token signing key');
        }
        
        // Verify token
        let payload;
        try {
            payload = jwt.verify(token, key, {
                algorithms: ['RS256'],
                issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
            });
            console.log('Token payload:', payload);
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new Error('Invalid token');
        }
        
        // Extract user ID from token
        const cognitoUserId = payload.sub;
        const username = payload.username || cognitoUserId;
        
        // Get user from database to get account info
        // Try to find user with userId = user:cognitoId format (our pattern)
        const userIdResult = await dynamodb.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: `user:${cognitoUserId}` }
        }));
        
        let user;
        if (userIdResult.Item) {
            user = userIdResult.Item;
            console.log('Found user in database:', user.userId);
        } else {
            console.log('User not found in database for cognitoId:', cognitoUserId);
            // For now, allow access but with limited context
            user = {
                userId: `user:${cognitoUserId}`,
                accountId: `account:${cognitoUserId}`,
                status: 'active'
            };
        }
        
        // Create policy
        const policy = generatePolicy(user.userId, 'Allow', event.routeArn || '*');
        
        // Add user context for Lambda functions
        policy.context = {
            userId: user.userId,
            accountId: user.accountId || 'unknown',
            email: payload.email || '',
            cognitoId: cognitoUserId,
            username: username,
            tokenUse: payload.token_use,
            scope: payload.scope || ''
        };
        
        console.log('Authorization successful for user:', user.userId);
        return policy;
        
    } catch (error) {
        console.error('Authorization failed:', error.message);
        
        // Return deny policy for any error
        return generatePolicy('user', 'Deny', event.routeArn || '*');
    }
};

function generatePolicy(principalId, effect, resource) {
    const policy = {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    };
    
    return policy;
}