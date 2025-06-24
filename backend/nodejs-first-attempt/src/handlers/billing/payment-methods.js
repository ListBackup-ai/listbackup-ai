const AWS = require('aws-sdk');
const Stripe = require('stripe');
const { extractAuthContext } = require('../../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

/**
 * Get payment methods for account
 */
exports.getPaymentMethods = async (event) => {
    console.log('Get payment methods event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const type = event.queryStringParameters?.type || 'card';
        
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

        // Get payment methods from Stripe
        const paymentMethods = await stripe.paymentMethods.list({
            customer: account.billing.customerId,
            type: type,
            limit: 20
        });

        // Get customer to check default payment method
        const customer = await stripe.customers.retrieve(account.billing.customerId);
        const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    paymentMethods: paymentMethods.data.map(pm => ({
                        id: pm.id,
                        type: pm.type,
                        created: pm.created,
                        isDefault: pm.id === defaultPaymentMethodId,
                        card: pm.card ? {
                            brand: pm.card.brand,
                            last4: pm.card.last4,
                            expMonth: pm.card.exp_month,
                            expYear: pm.card.exp_year,
                            funding: pm.card.funding,
                            country: pm.card.country
                        } : null,
                        billingDetails: pm.billing_details
                    })),
                    defaultPaymentMethodId
                }
            })
        };

    } catch (error) {
        console.error('Error getting payment methods:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Create setup intent for adding payment method
 */
exports.createSetupIntent = async (event) => {
    console.log('Create setup intent event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { usage = 'off_session', paymentMethodTypes = ['card'] } = JSON.parse(event.body || '{}');
        
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

        // Create setup intent
        const setupIntent = await stripe.setupIntents.create({
            customer: account.billing.customerId,
            usage: usage,
            payment_method_types: paymentMethodTypes,
            metadata: {
                accountId,
                userId,
                environment: process.env.STAGE || 'dev'
            }
        });

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `setup-intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.setup_intent.created',
                description: 'Setup intent created for payment method',
                metadata: {
                    setupIntentId: setupIntent.id,
                    customerId: account.billing.customerId
                },
                timestamp: Date.now()
            }
        }).promise();

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    setupIntentId: setupIntent.id,
                    clientSecret: setupIntent.client_secret,
                    status: setupIntent.status
                }
            })
        };

    } catch (error) {
        console.error('Error creating setup intent:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Set default payment method
 */
exports.setDefaultPaymentMethod = async (event) => {
    console.log('Set default payment method event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { paymentMethodId } = JSON.parse(event.body || '{}');

        if (!paymentMethodId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'paymentMethodId is required' })
            };
        }
        
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

        // Verify payment method belongs to customer
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.customer !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Payment method does not belong to this customer' })
            };
        }

        // Update customer's default payment method
        const customer = await stripe.customers.update(account.billing.customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `default-payment-method-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.payment_method.set_default',
                description: 'Default payment method updated',
                metadata: {
                    paymentMethodId,
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
                    customerId: customer.id,
                    defaultPaymentMethodId: paymentMethodId
                }
            })
        };

    } catch (error) {
        console.error('Error setting default payment method:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Remove payment method
 */
exports.removePaymentMethod = async (event) => {
    console.log('Remove payment method event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { paymentMethodId } = event.pathParameters;

        if (!paymentMethodId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'paymentMethodId is required' })
            };
        }
        
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

        // Verify payment method belongs to customer
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.customer !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Payment method does not belong to this customer' })
            };
        }

        // Detach payment method from customer
        const detachedPaymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `payment-method-removed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.payment_method.removed',
                description: 'Payment method removed',
                metadata: {
                    paymentMethodId,
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
                    paymentMethodId: detachedPaymentMethod.id,
                    status: 'removed'
                }
            })
        };

    } catch (error) {
        console.error('Error removing payment method:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};