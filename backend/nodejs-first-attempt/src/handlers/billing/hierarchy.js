const AWS = require('aws-sdk');
const Stripe = require('stripe');
const { extractAuthContext } = require('../../utils/auth');
const { ensureStripeCustomer } = require('./customer');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const USERS_ACCOUNTS_TABLE = process.env.USERS_ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

/**
 * Set up billing inheritance for sub-account
 */
exports.setupBillingInheritance = async (event) => {
    console.log('Setup billing inheritance event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { parentAccountId, billingSettings = {} } = JSON.parse(event.body || '{}');

        if (!parentAccountId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'parentAccountId is required' })
            };
        }

        // Verify user has admin permissions for both accounts
        const [subAccountAccess, parentAccountAccess] = await Promise.all([
            dynamodb.get({
                TableName: USERS_ACCOUNTS_TABLE,
                Key: { userId, accountId }
            }).promise(),
            dynamodb.get({
                TableName: USERS_ACCOUNTS_TABLE,
                Key: { userId, accountId: parentAccountId }
            }).promise()
        ]);

        if (!subAccountAccess.Item || !['Owner', 'Manager'].includes(subAccountAccess.Item.role)) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Insufficient permissions for sub-account' })
            };
        }

        if (!parentAccountAccess.Item || !['Owner', 'Manager'].includes(parentAccountAccess.Item.role)) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Insufficient permissions for parent account' })
            };
        }

        // Get both account details
        const [subAccount, parentAccount] = await Promise.all([
            dynamodb.get({
                TableName: ACCOUNTS_TABLE,
                Key: { accountId }
            }).promise(),
            dynamodb.get({
                TableName: ACCOUNTS_TABLE,
                Key: { accountId: parentAccountId }
            }).promise()
        ]);

        if (!subAccount.Item || !parentAccount.Item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account not found' })
            };
        }

        // Verify the parent-child relationship
        if (subAccount.Item.parentAccountId !== parentAccountId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invalid parent-child account relationship' })
            };
        }

        // Ensure parent account has billing set up
        if (!parentAccount.Item.billing?.customerId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Parent account must have billing configured first' })
            };
        }

        // Configure billing inheritance
        const inheritanceConfig = {
            type: billingSettings.inheritanceType || 'inherit', // 'inherit', 'separate', 'delegate'
            parentAccountId,
            parentCustomerId: parentAccount.Item.billing.customerId,
            isInherited: billingSettings.inheritanceType !== 'separate',
            billingContact: billingSettings.billingContact || {
                useParent: true,
                email: null,
                name: null
            },
            limits: {
                inherited: billingSettings.inheritLimits !== false,
                overrides: billingSettings.limitOverrides || {}
            },
            notifications: {
                sendToParent: billingSettings.notifyParent !== false,
                sendToSubAccount: billingSettings.notifySubAccount === true,
                emailOverride: billingSettings.notificationEmail || null
            },
            setupAt: new Date().toISOString()
        };

        // Handle different inheritance types
        let billingData = {};
        switch (inheritanceConfig.type) {
            case 'inherit':
                // Use parent's customer and billing settings
                billingData = {
                    customerId: parentAccount.Item.billing.customerId,
                    isInherited: true,
                    parentAccountId,
                    inheritanceConfig
                };
                break;
            
            case 'separate':
                // Create separate billing for sub-account
                const customer = await ensureStripeCustomer(
                    accountId,
                    billingSettings.billingContact?.email || subAccount.Item.ownerEmail,
                    billingSettings.billingContact?.name || subAccount.Item.name
                );
                billingData = {
                    customerId: customer.id,
                    isInherited: false,
                    parentAccountId,
                    inheritanceConfig
                };
                break;
            
            case 'delegate':
                // Delegate billing decisions to parent but maintain separate customer
                const delegateCustomer = await ensureStripeCustomer(
                    accountId,
                    billingSettings.billingContact?.email || subAccount.Item.ownerEmail,
                    billingSettings.billingContact?.name || subAccount.Item.name
                );
                billingData = {
                    customerId: delegateCustomer.id,
                    isInherited: false,
                    isDelegated: true,
                    parentAccountId,
                    inheritanceConfig
                };
                break;
        }

        // Update sub-account with billing inheritance configuration
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing = :billing, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':billing': billingData,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity for both accounts
        const activityPromises = [
            dynamodb.put({
                TableName: ACTIVITY_TABLE,
                Item: {
                    eventId: `billing-inheritance-setup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    accountId,
                    type: 'billing.inheritance.setup',
                    description: `Billing inheritance configured with parent account`,
                    metadata: {
                        parentAccountId,
                        inheritanceType: inheritanceConfig.type,
                        customerId: billingData.customerId
                    },
                    timestamp: Date.now()
                }
            }).promise(),
            dynamodb.put({
                TableName: ACTIVITY_TABLE,
                Item: {
                    eventId: `billing-inheritance-parent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    accountId: parentAccountId,
                    type: 'billing.inheritance.child_added',
                    description: `Sub-account billing inheritance configured`,
                    metadata: {
                        subAccountId: accountId,
                        inheritanceType: inheritanceConfig.type,
                        customerId: billingData.customerId
                    },
                    timestamp: Date.now()
                }
            }).promise()
        ];

        await Promise.all(activityPromises);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    accountId,
                    parentAccountId,
                    inheritanceType: inheritanceConfig.type,
                    customerId: billingData.customerId,
                    isInherited: billingData.isInherited,
                    isDelegated: billingData.isDelegated,
                    config: inheritanceConfig
                }
            })
        };

    } catch (error) {
        console.error('Error setting up billing inheritance:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Get billing hierarchy for account
 */
exports.getBillingHierarchy = async (event) => {
    console.log('Get billing hierarchy event:', JSON.stringify(event, null, 2));
    
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

        // Get account details
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();

        const account = accountResult.Item;
        if (!account) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account not found' })
            };
        }

        // Build billing hierarchy
        const hierarchy = {
            currentAccount: {
                accountId: account.accountId,
                name: account.name,
                billing: account.billing || null,
                level: account.level || 0
            },
            parent: null,
            children: [],
            billingFlow: []
        };

        // Get parent account billing info if exists
        if (account.parentAccountId) {
            try {
                const parentResult = await dynamodb.get({
                    TableName: ACCOUNTS_TABLE,
                    Key: { accountId: account.parentAccountId }
                }).promise();

                if (parentResult.Item) {
                    hierarchy.parent = {
                        accountId: parentResult.Item.accountId,
                        name: parentResult.Item.name,
                        billing: parentResult.Item.billing || null,
                        level: parentResult.Item.level || 0
                    };
                }
            } catch (error) {
                console.warn('Error fetching parent account:', error.message);
            }
        }

        // Get child accounts billing info
        const scanParams = {
            TableName: ACCOUNTS_TABLE,
            FilterExpression: 'parentAccountId = :parentId',
            ExpressionAttributeValues: {
                ':parentId': accountId
            }
        };

        const childrenResult = await dynamodb.scan(scanParams).promise();
        hierarchy.children = (childrenResult.Items || []).map(child => ({
            accountId: child.accountId,
            name: child.name,
            billing: child.billing || null,
            level: child.level || 0
        }));

        // Analyze billing flow
        hierarchy.billingFlow = analyzeBillingFlow(hierarchy);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: hierarchy
            })
        };

    } catch (error) {
        console.error('Error getting billing hierarchy:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Update billing delegation settings
 */
exports.updateBillingDelegation = async (event) => {
    console.log('Update billing delegation event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { delegationSettings } = JSON.parse(event.body || '{}');

        // Verify user has admin permissions
        const userAccountResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId }
        }).promise();

        if (!userAccountResult.Item || !['Owner', 'Manager'].includes(userAccountResult.Item.role)) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }

        // Get account details
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();

        const account = accountResult.Item;
        if (!account || !account.billing) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account or billing configuration not found' })
            };
        }

        // Update delegation settings
        const updatedInheritanceConfig = {
            ...account.billing.inheritanceConfig,
            delegation: {
                ...account.billing.inheritanceConfig?.delegation,
                ...delegationSettings,
                updatedAt: new Date().toISOString()
            }
        };

        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.inheritanceConfig = :config, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':config': updatedInheritanceConfig,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `billing-delegation-updated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.delegation.updated',
                description: 'Billing delegation settings updated',
                metadata: {
                    updatedSettings: Object.keys(delegationSettings),
                    delegationConfig: updatedInheritanceConfig.delegation
                },
                timestamp: Date.now()
            }
        }).promise();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    accountId,
                    inheritanceConfig: updatedInheritanceConfig
                }
            })
        };

    } catch (error) {
        console.error('Error updating billing delegation:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Analyze billing flow for hierarchy
 */
function analyzeBillingFlow(hierarchy) {
    const flow = [];
    
    if (hierarchy.currentAccount.billing?.isInherited) {
        flow.push({
            step: 1,
            type: 'inheritance',
            description: 'Billing inherited from parent account',
            accountId: hierarchy.parent?.accountId,
            customerId: hierarchy.parent?.billing?.customerId
        });
    } else if (hierarchy.currentAccount.billing?.isDelegated) {
        flow.push({
            step: 1,
            type: 'delegation',
            description: 'Billing delegated to parent account decisions',
            accountId: hierarchy.currentAccount.accountId,
            customerId: hierarchy.currentAccount.billing?.customerId
        });
    } else if (hierarchy.currentAccount.billing?.customerId) {
        flow.push({
            step: 1,
            type: 'independent',
            description: 'Independent billing configuration',
            accountId: hierarchy.currentAccount.accountId,
            customerId: hierarchy.currentAccount.billing?.customerId
        });
    }

    // Add child billing flows
    hierarchy.children.forEach((child, index) => {
        if (child.billing?.isInherited) {
            flow.push({
                step: index + 2,
                type: 'child_inheritance',
                description: `Child account inherits billing`,
                accountId: child.accountId,
                customerId: hierarchy.currentAccount.billing?.customerId
            });
        } else if (child.billing?.isDelegated) {
            flow.push({
                step: index + 2,
                type: 'child_delegation',
                description: `Child account billing delegated`,
                accountId: child.accountId,
                customerId: child.billing?.customerId
            });
        }
    });

    return flow;
}