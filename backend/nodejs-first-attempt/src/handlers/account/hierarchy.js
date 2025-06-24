const AWS = require('aws-sdk');
const { extractAuthContext } = require('../../utils/auth');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const USERS_ACCOUNTS_TABLE = process.env.USERS_ACCOUNTS_TABLE;

/**
 * Create a sub-account under the current account
 */
exports.createSubAccount = async (event) => {
    console.log('Create sub-account event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { name, company, settings = {} } = JSON.parse(event.body || '{}');
        
        if (!name) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account name is required' })
            };
        }
        
        // Check if user has permission to create sub-accounts
        const userAccountResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId }
        }).promise();
        
        if (!userAccountResult.Item || 
            !['Owner', 'Manager'].includes(userAccountResult.Item.role) ||
            !userAccountResult.Item.permissions?.canCreateSubAccounts) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Insufficient permissions to create sub-accounts' })
            };
        }
        
        // Get parent account to inherit settings and calculate hierarchy
        const parentAccountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();
        
        if (!parentAccountResult.Item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Parent account not found' })
            };
        }
        
        const parentAccount = parentAccountResult.Item;
        const newAccountId = uuidv4();
        const newLevel = (parentAccount.level || 0) + 1;
        const newAccountPath = `${parentAccount.accountPath || ''}/${newAccountId}`;
        
        // Create the new sub-account
        const subAccount = {
            accountId: newAccountId,
            parentAccountId: accountId,
            ownerUserId: userId,
            name,
            company: company || '',
            accountPath: newAccountPath,
            level: newLevel,
            isActive: true,
            settings: {
                allowSubAccounts: settings.allowSubAccounts !== false,
                maxSubAccounts: settings.maxSubAccounts || 10,
                whiteLabel: settings.whiteLabel || {
                    enabled: false,
                    logo: null,
                    brandName: null
                },
                ...settings
            },
            limits: parentAccount.limits || {
                storage: 1024 * 1024 * 1024, // 1GB
                sources: 5,
                jobs: 10,
                apiCalls: 1000
            },
            usage: {
                storage: { used: 0, limit: parentAccount.limits?.storage || 1024 * 1024 * 1024 },
                sources: { used: 0, limit: parentAccount.limits?.sources || 5 },
                jobs: { used: 0, limit: parentAccount.limits?.jobs || 10 },
                apiCalls: { 
                    used: 0, 
                    limit: parentAccount.limits?.apiCalls || 1000,
                    period: 'monthly',
                    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
                }
            },
            billing: {
                customerId: null,
                subscriptionId: null,
                status: 'inherited' // Inherits from parent
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save the sub-account
        await dynamodb.put({
            TableName: ACCOUNTS_TABLE,
            Item: subAccount
        }).promise();
        
        // Link the creator as Owner of the new account
        await dynamodb.put({
            TableName: USERS_ACCOUNTS_TABLE,
            Item: {
                userId,
                accountId: newAccountId,
                role: 'Owner',
                status: 'Active',
                permissions: {
                    canCreateSubAccounts: true,
                    canInviteUsers: true,
                    canManageIntegrations: true,
                    canViewAllData: true
                },
                linkedAt: Date.now()
            }
        }).promise();
        
        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(subAccount)
        };
        
    } catch (error) {
        console.error('Error creating sub-account:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Get account hierarchy (children and descendants)
 */
exports.getAccountHierarchy = async (event) => {
    console.log('Get account hierarchy event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        
        // Verify user has access to this account
        const userAccountResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId }
        }).promise();
        
        if (!userAccountResult.Item) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Access denied to this account' })
            };
        }
        
        // Get all accounts where this account is in the path (descendants)
        const scanParams = {
            TableName: ACCOUNTS_TABLE,
            FilterExpression: 'contains(accountPath, :accountId) OR accountId = :accountId',
            ExpressionAttributeValues: {
                ':accountId': accountId
            }
        };
        
        const result = await dynamodb.scan(scanParams).promise();
        const accounts = result.Items || [];
        
        // Build hierarchy tree
        const hierarchy = buildAccountTree(accounts, accountId);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(hierarchy)
        };
        
    } catch (error) {
        console.error('Error getting account hierarchy:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Get all accounts accessible to the current user
 */
exports.getUserAccounts = async (event) => {
    console.log('Get user accounts event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId } = extractAuthContext(event);
        
        // Get all account associations for this user
        const queryParams = {
            TableName: USERS_ACCOUNTS_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };
        
        const userAccountsResult = await dynamodb.query(queryParams).promise();
        const userAccounts = userAccountsResult.Items || [];
        
        if (userAccounts.length === 0) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify([])
            };
        }
        
        // Get account details for each association
        const accountIds = userAccounts.map(ua => ({ accountId: ua.accountId }));
        const batchParams = {
            RequestItems: {
                [ACCOUNTS_TABLE]: {
                    Keys: accountIds
                }
            }
        };
        
        const accountsResult = await dynamodb.batchGet(batchParams).promise();
        const accounts = accountsResult.Responses[ACCOUNTS_TABLE] || [];
        
        // Merge account details with user permissions
        const accountsWithPermissions = accounts.map(account => {
            const userAccount = userAccounts.find(ua => ua.accountId === account.accountId);
            return {
                ...account,
                userRole: userAccount.role,
                userStatus: userAccount.status,
                userPermissions: userAccount.permissions
            };
        });
        
        // Sort by hierarchy level and name
        accountsWithPermissions.sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(accountsWithPermissions)
        };
        
    } catch (error) {
        console.error('Error getting user accounts:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Switch account context for the user
 */
exports.switchAccount = async (event) => {
    console.log('Switch account event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId } = extractAuthContext(event);
        const { accountId: targetAccountId } = JSON.parse(event.body || '{}');
        
        if (!targetAccountId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Target account ID is required' })
            };
        }
        
        // Verify user has access to target account
        const userAccountResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId: targetAccountId }
        }).promise();
        
        if (!userAccountResult.Item) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Access denied to target account' })
            };
        }
        
        // Get account details
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId: targetAccountId }
        }).promise();
        
        if (!accountResult.Item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account not found' })
            };
        }
        
        const account = accountResult.Item;
        const userPermissions = userAccountResult.Item;
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                account,
                userRole: userPermissions.role,
                userPermissions: userPermissions.permissions,
                switchedAt: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error switching account:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Helper function to build account hierarchy tree
 */
function buildAccountTree(accounts, rootAccountId) {
    const accountMap = new Map();
    const children = new Map();
    
    // Index accounts by ID and organize children
    accounts.forEach(account => {
        accountMap.set(account.accountId, account);
        
        if (account.parentAccountId) {
            if (!children.has(account.parentAccountId)) {
                children.set(account.parentAccountId, []);
            }
            children.get(account.parentAccountId).push(account.accountId);
        }
    });
    
    // Build tree recursively
    function buildNode(accountId) {
        const account = accountMap.get(accountId);
        if (!account) return null;
        
        const node = { ...account };
        const childIds = children.get(accountId) || [];
        
        if (childIds.length > 0) {
            node.children = childIds.map(buildNode).filter(Boolean);
        }
        
        return node;
    }
    
    return buildNode(rootAccountId);
}