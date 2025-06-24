const AWS = require('aws-sdk');
const Stripe = require('stripe');
const { extractAuthContext } = require('../../utils/auth');
const { ensureStripeCustomer } = require('./customer');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

/**
 * Get subscriptions for account
 */
exports.getSubscriptions = async (event) => {
    console.log('Get subscriptions event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const status = event.queryStringParameters?.status || 'active';
        
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

        let subscriptions = [];
        if (account.billing?.customerId) {
            try {
                const stripeSubscriptions = await stripe.subscriptions.list({
                    customer: account.billing.customerId,
                    status: status,
                    limit: 20,
                    expand: ['data.latest_invoice', 'data.default_payment_method']
                });
                subscriptions = stripeSubscriptions.data;
            } catch (error) {
                console.warn('Error fetching Stripe subscriptions:', error.message);
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: subscriptions.map(sub => ({
                    id: sub.id,
                    status: sub.status,
                    created: sub.created,
                    currentPeriodStart: sub.current_period_start,
                    currentPeriodEnd: sub.current_period_end,
                    cancelAt: sub.cancel_at,
                    cancelAtPeriodEnd: sub.cancel_at_period_end,
                    items: sub.items.data.map(item => ({
                        id: item.id,
                        priceId: item.price.id,
                        productId: item.price.product,
                        quantity: item.quantity,
                        amount: item.price.unit_amount,
                        currency: item.price.currency,
                        interval: item.price.recurring?.interval,
                        intervalCount: item.price.recurring?.interval_count
                    })),
                    latestInvoice: sub.latest_invoice ? {
                        id: sub.latest_invoice.id,
                        amountPaid: sub.latest_invoice.amount_paid,
                        amountDue: sub.latest_invoice.amount_due,
                        status: sub.latest_invoice.status,
                        hostedInvoiceUrl: sub.latest_invoice.hosted_invoice_url
                    } : null,
                    defaultPaymentMethod: sub.default_payment_method
                }))
            })
        };

    } catch (error) {
        console.error('Error getting subscriptions:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Create subscription checkout session
 */
exports.createCheckoutSession = async (event) => {
    console.log('Create checkout session event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { priceId, successUrl, cancelUrl, customerEmail, customerName } = JSON.parse(event.body || '{}');

        if (!priceId || !successUrl || !cancelUrl) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'priceId, successUrl, and cancelUrl are required' })
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

        // Ensure Stripe customer exists
        let customerId = account.billing?.customerId;
        if (!customerId && customerEmail && customerName) {
            const customer = await ensureStripeCustomer(accountId, customerEmail, customerName);
            customerId = customer.id;
        }

        // Create checkout session
        const sessionParams = {
            mode: 'subscription',
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                accountId,
                userId,
                environment: process.env.STAGE || 'dev'
            },
            subscription_data: {
                metadata: {
                    accountId,
                    environment: process.env.STAGE || 'dev'
                }
            }
        };

        if (customerId) {
            sessionParams.customer = customerId;
        } else if (customerEmail) {
            sessionParams.customer_email = customerEmail;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `checkout-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.checkout.created',
                description: 'Checkout session created',
                metadata: {
                    sessionId: session.id,
                    priceId,
                    customerId
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
                    sessionId: session.id,
                    url: session.url
                }
            })
        };

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Update subscription
 */
exports.updateSubscription = async (event) => {
    console.log('Update subscription event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { subscriptionId } = event.pathParameters;
        const { priceId, quantity, prorationBehavior = 'create_prorations' } = JSON.parse(event.body || '{}');

        if (!subscriptionId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'subscriptionId is required' })
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

        // Verify subscription belongs to this customer
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.customer !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Subscription does not belong to this account' })
            };
        }

        // Update subscription
        const updateParams = {
            proration_behavior: prorationBehavior
        };

        if (priceId || quantity) {
            updateParams.items = [{
                id: subscription.items.data[0].id,
                ...(priceId && { price: priceId }),
                ...(quantity && { quantity })
            }];
        }

        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateParams);

        // Update account billing info
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.subscriptionId = :subId, billing.subscriptionStatus = :status, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':subId': updatedSubscription.id,
                ':status': updatedSubscription.status,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `subscription-updated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.subscription.updated',
                description: 'Subscription updated',
                metadata: {
                    subscriptionId,
                    status: updatedSubscription.status,
                    priceId,
                    quantity
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
                    id: updatedSubscription.id,
                    status: updatedSubscription.status,
                    currentPeriodEnd: updatedSubscription.current_period_end
                }
            })
        };

    } catch (error) {
        console.error('Error updating subscription:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (event) => {
    console.log('Cancel subscription event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { subscriptionId } = event.pathParameters;
        const { atPeriodEnd = true } = JSON.parse(event.body || '{}');

        if (!subscriptionId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'subscriptionId is required' })
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

        // Verify subscription belongs to this customer
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.customer !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Subscription does not belong to this account' })
            };
        }

        // Cancel subscription
        let canceledSubscription;
        if (atPeriodEnd) {
            canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true
            });
        } else {
            canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
        }

        // Update account billing info
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.subscriptionStatus = :status, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':status': canceledSubscription.status,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `subscription-canceled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.subscription.canceled',
                description: atPeriodEnd ? 'Subscription canceled at period end' : 'Subscription canceled immediately',
                metadata: {
                    subscriptionId,
                    status: canceledSubscription.status,
                    atPeriodEnd,
                    cancelAt: canceledSubscription.cancel_at
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
                    id: canceledSubscription.id,
                    status: canceledSubscription.status,
                    cancelAt: canceledSubscription.cancel_at,
                    cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end
                }
            })
        };

    } catch (error) {
        console.error('Error canceling subscription:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Resume subscription
 */
exports.resumeSubscription = async (event) => {
    console.log('Resume subscription event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { subscriptionId } = event.pathParameters;

        if (!subscriptionId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'subscriptionId is required' })
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

        // Verify subscription belongs to this customer
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.customer !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Subscription does not belong to this account' })
            };
        }

        // Resume subscription by removing cancel_at_period_end
        const resumedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
        });

        // Update account billing info
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.subscriptionStatus = :status, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':status': resumedSubscription.status,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `subscription-resumed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.subscription.resumed',
                description: 'Subscription resumed',
                metadata: {
                    subscriptionId,
                    status: resumedSubscription.status
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
                    id: resumedSubscription.id,
                    status: resumedSubscription.status,
                    cancelAtPeriodEnd: resumedSubscription.cancel_at_period_end
                }
            })
        };

    } catch (error) {
        console.error('Error resuming subscription:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};