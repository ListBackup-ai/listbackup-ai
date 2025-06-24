const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../utils/aws-clients');
const jwt = require('jsonwebtoken');

const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
    console.log('Authorizer event:', JSON.stringify(event, null, 2));
    
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
        
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        // Get user from database to verify account status
        const userResult = await dynamodb.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: decoded.userId }
        }));
        
        if (!userResult.Item) {
            throw new Error('User not found');
        }
        
        const user = userResult.Item;
        
        // Check if user account is active
        if (user.status !== 'active') {
            throw new Error('User account is not active');
        }
        
        // Create policy
        const policy = generatePolicy(decoded.userId, 'Allow', event.routeArn || '*');
        
        // Add user context
        policy.context = {
            userId: decoded.userId,
            accountId: decoded.accountId,
            email: decoded.email,
            role: decoded.role || 'user',
            name: user.name || '',
            accountStatus: user.status
        };
        
        console.log('Authorization successful for user:', decoded.userId);
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