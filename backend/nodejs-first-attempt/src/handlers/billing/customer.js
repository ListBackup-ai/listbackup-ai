const AWS = require('aws-sdk');
const Stripe = require('stripe');
const { extractAuthContext } = require('../../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

/**
 * Get or create Stripe customer for account
 */
const ensureStripeCustomer = async (accountId, userEmail, accountName) => {
    try {
        // Check if account already has a Stripe customer ID
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();

        const account = accountResult.Item;
        if (!account) {
            throw new Error('Account not found');
        }

        // Return existing customer if available
        if (account.billing?.customerId) {
            try {
                const customer = await stripe.customers.retrieve(account.billing.customerId);
                if (!customer.deleted) {
                    return customer;
                }
            } catch (error) {
                console.warn('Existing Stripe customer not found, creating new one:', error.message);
            }
        }

        // Create new Stripe customer
        const customer = await stripe.customers.create({
            email: userEmail,
            name: accountName,
            description: `Customer for account ${accountId}`,
            metadata: {
                accountId,
                environment: process.env.STAGE || 'dev'
            }
        });

        // Update account with Stripe customer ID
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.customerId = :customerId, billing.customerCreatedAt = :timestamp, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':customerId': customer.id,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `stripe-customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.customer.created',
                description: 'Stripe customer created',
                metadata: {
                    customerId: customer.id,
                    email: userEmail
                },
                timestamp: Date.now()
            }
        }).promise();

        return customer;

    } catch (error) {
        console.error('Error ensuring Stripe customer:', error);
        throw error;
    }
};

/**
 * Get Stripe customer for account
 */
exports.getCustomer = async (event) => {
    console.log('Get customer event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        
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

        let customer = null;
        if (account.billing?.customerId) {
            try {
                customer = await stripe.customers.retrieve(account.billing.customerId);
                if (customer.deleted) {
                    customer = null;
                }
            } catch (error) {
                console.warn('Stripe customer not found:', error.message);
                customer = null;
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    customerId: customer?.id || null,
                    email: customer?.email || null,
                    name: customer?.name || null,
                    created: customer?.created || null,
                    defaultPaymentMethod: customer?.invoice_settings?.default_payment_method || null,
                    hasCustomer: !!customer
                }
            })
        };

    } catch (error) {
        console.error('Error getting customer:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Create or update Stripe customer
 */
exports.createCustomer = async (event) => {
    console.log('Create customer event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { email, name, phone, address } = JSON.parse(event.body || '{}');

        if (!email || !name) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Email and name are required' })
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

        // Create or update customer
        const customer = await ensureStripeCustomer(accountId, email, name);

        // Update customer with additional details if provided
        if (phone || address) {
            const updateData = {};
            if (phone) updateData.phone = phone;
            if (address) updateData.address = address;

            await stripe.customers.update(customer.id, updateData);
        }

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    customerId: customer.id,
                    email: customer.email,
                    name: customer.name,
                    created: customer.created
                }
            })
        };

    } catch (error) {
        console.error('Error creating customer:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Update Stripe customer
 */
exports.updateCustomer = async (event) => {
    console.log('Update customer event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const updateData = JSON.parse(event.body || '{}');

        // Get account details
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();

        const account = accountResult.Item;
        if (!account || !account.billing?.customerId) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Customer not found' })
            };
        }

        // Update Stripe customer
        const customer = await stripe.customers.update(account.billing.customerId, updateData);

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `stripe-customer-updated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.customer.updated',
                description: 'Stripe customer updated',
                metadata: {
                    customerId: customer.id,
                    updatedFields: Object.keys(updateData)
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
                    customerId: customer.id,
                    email: customer.email,
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address
                }
            })
        };

    } catch (error) {
        console.error('Error updating customer:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Delete Stripe customer
 */
exports.deleteCustomer = async (event) => {
    console.log('Delete customer event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);

        // Get account details
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();

        const account = accountResult.Item;
        if (!account || !account.billing?.customerId) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Customer not found' })
            };
        }

        // Delete Stripe customer
        const deletedCustomer = await stripe.customers.del(account.billing.customerId);

        // Update account to remove customer ID
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'REMOVE billing.customerId, billing.customerCreatedAt SET updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `stripe-customer-deleted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.customer.deleted',
                description: 'Stripe customer deleted',
                metadata: {
                    customerId: account.billing.customerId
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
                    deleted: deletedCustomer.deleted,
                    customerId: deletedCustomer.id
                }
            })
        };

    } catch (error) {
        console.error('Error deleting customer:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Export utility function for use by other billing modules
module.exports.ensureStripeCustomer = ensureStripeCustomer;