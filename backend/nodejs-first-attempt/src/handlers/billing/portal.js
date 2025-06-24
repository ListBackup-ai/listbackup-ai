const AWS = require('aws-sdk');
const Stripe = require('stripe');
const { extractAuthContext } = require('../../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

/**
 * Create customer portal session
 */
exports.createPortalSession = async (event) => {
    console.log('Create portal session event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { returnUrl } = JSON.parse(event.body || '{}');

        if (!returnUrl) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'returnUrl is required' })
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

        // Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: account.billing.customerId,
            return_url: returnUrl,
            configuration: {
                business_profile: {
                    privacy_policy_url: 'https://listbackup.ai/privacy',
                    terms_of_service_url: 'https://listbackup.ai/terms'
                },
                features: {
                    payment_method_update: {
                        enabled: true
                    },
                    invoice_history: {
                        enabled: true
                    },
                    subscription_cancel: {
                        enabled: true,
                        mode: 'at_period_end',
                        cancellation_reason: {
                            enabled: true,
                            options: [
                                'too_expensive',
                                'missing_features',
                                'switched_service',
                                'unused',
                                'other'
                            ]
                        }
                    },
                    subscription_pause: {
                        enabled: false
                    },
                    subscription_update: {
                        enabled: true,
                        default_allowed_updates: ['price', 'quantity'],
                        proration_behavior: 'create_prorations'
                    }
                }
            }
        });

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `portal-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.portal.session_created',
                description: 'Customer portal session created',
                metadata: {
                    sessionId: portalSession.id,
                    customerId: account.billing.customerId,
                    returnUrl
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
                    sessionId: portalSession.id,
                    url: portalSession.url
                }
            })
        };

    } catch (error) {
        console.error('Error creating portal session:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Get customer portal configuration
 */
exports.getPortalConfiguration = async (event) => {
    console.log('Get portal configuration event:', JSON.stringify(event, null, 2));
    
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

        // Get customer details from Stripe
        const customer = await stripe.customers.retrieve(account.billing.customerId, {
            expand: ['subscriptions', 'default_source']
        });

        // Get active subscriptions
        const subscriptions = customer.subscriptions?.data?.filter(sub => 
            ['active', 'trialing', 'past_due'].includes(sub.status)
        ) || [];

        // Get payment methods
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customer.id,
            type: 'card',
            limit: 10
        });

        // Get recent invoices
        const invoices = await stripe.invoices.list({
            customer: customer.id,
            limit: 5
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    customer: {
                        id: customer.id,
                        email: customer.email,
                        name: customer.name,
                        phone: customer.phone,
                        address: customer.address
                    },
                    subscriptions: subscriptions.map(sub => ({
                        id: sub.id,
                        status: sub.status,
                        currentPeriodStart: sub.current_period_start,
                        currentPeriodEnd: sub.current_period_end,
                        cancelAtPeriodEnd: sub.cancel_at_period_end,
                        items: sub.items.data.map(item => ({
                            id: item.id,
                            priceId: item.price.id,
                            quantity: item.quantity,
                            amount: item.price.unit_amount,
                            currency: item.price.currency,
                            interval: item.price.recurring?.interval
                        }))
                    })),
                    paymentMethods: paymentMethods.data.map(pm => ({
                        id: pm.id,
                        type: pm.type,
                        isDefault: pm.id === customer.invoice_settings?.default_payment_method,
                        card: pm.card ? {
                            brand: pm.card.brand,
                            last4: pm.card.last4,
                            expMonth: pm.card.exp_month,
                            expYear: pm.card.exp_year
                        } : null
                    })),
                    recentInvoices: invoices.data.map(invoice => ({
                        id: invoice.id,
                        number: invoice.number,
                        status: invoice.status,
                        amountPaid: invoice.amount_paid,
                        amountDue: invoice.amount_due,
                        currency: invoice.currency,
                        created: invoice.created,
                        hostedInvoiceUrl: invoice.hosted_invoice_url
                    })),
                    portalFeatures: {
                        canUpdatePaymentMethods: true,
                        canViewInvoices: true,
                        canCancelSubscription: subscriptions.length > 0,
                        canUpdateSubscription: subscriptions.length > 0,
                        canPauseSubscription: false
                    }
                }
            })
        };

    } catch (error) {
        console.error('Error getting portal configuration:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Get billing summary for account
 */
exports.getBillingSummary = async (event) => {
    console.log('Get billing summary event:', JSON.stringify(event, null, 2));
    
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

        let billingSummary = {
            hasCustomer: false,
            subscriptions: [],
            nextInvoice: null,
            paymentMethods: [],
            totalMonthlyAmount: 0,
            currency: 'usd',
            status: 'no_subscription'
        };

        if (account.billing?.customerId) {
            try {
                // Get customer
                const customer = await stripe.customers.retrieve(account.billing.customerId);
                billingSummary.hasCustomer = true;

                // Get active subscriptions
                const subscriptions = await stripe.subscriptions.list({
                    customer: customer.id,
                    status: 'all',
                    limit: 10
                });

                const activeSubscriptions = subscriptions.data.filter(sub => 
                    ['active', 'trialing', 'past_due'].includes(sub.status)
                );

                billingSummary.subscriptions = activeSubscriptions.map(sub => ({
                    id: sub.id,
                    status: sub.status,
                    currentPeriodEnd: sub.current_period_end,
                    cancelAtPeriodEnd: sub.cancel_at_period_end,
                    trialEnd: sub.trial_end,
                    amount: sub.items.data.reduce((total, item) => 
                        total + (item.price.unit_amount * item.quantity), 0
                    ),
                    currency: sub.currency,
                    interval: sub.items.data[0]?.price?.recurring?.interval
                }));

                // Calculate total monthly amount
                billingSummary.totalMonthlyAmount = billingSummary.subscriptions.reduce((total, sub) => {
                    let monthlyAmount = sub.amount;
                    if (sub.interval === 'year') {
                        monthlyAmount = Math.round(sub.amount / 12);
                    }
                    return total + monthlyAmount;
                }, 0);

                // Get upcoming invoice
                if (activeSubscriptions.length > 0) {
                    try {
                        const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
                            customer: customer.id
                        });
                        billingSummary.nextInvoice = {
                            amountDue: upcomingInvoice.amount_due,
                            currency: upcomingInvoice.currency,
                            periodStart: upcomingInvoice.period_start,
                            periodEnd: upcomingInvoice.period_end,
                            total: upcomingInvoice.total
                        };
                    } catch (error) {
                        console.warn('No upcoming invoice found:', error.message);
                    }
                }

                // Get payment methods
                const paymentMethods = await stripe.paymentMethods.list({
                    customer: customer.id,
                    type: 'card'
                });

                billingSummary.paymentMethods = paymentMethods.data.map(pm => ({
                    id: pm.id,
                    isDefault: pm.id === customer.invoice_settings?.default_payment_method,
                    card: pm.card ? {
                        brand: pm.card.brand,
                        last4: pm.card.last4,
                        expMonth: pm.card.exp_month,
                        expYear: pm.card.exp_year
                    } : null
                }));

                // Determine overall status
                if (activeSubscriptions.length > 0) {
                    const hasActiveSubscription = activeSubscriptions.some(sub => sub.status === 'active');
                    const hasTrialingSubscription = activeSubscriptions.some(sub => sub.status === 'trialing');
                    const hasPastDueSubscription = activeSubscriptions.some(sub => sub.status === 'past_due');

                    if (hasPastDueSubscription) {
                        billingSummary.status = 'past_due';
                    } else if (hasTrialingSubscription) {
                        billingSummary.status = 'trialing';
                    } else if (hasActiveSubscription) {
                        billingSummary.status = 'active';
                    }
                }

            } catch (error) {
                console.warn('Error fetching Stripe data:', error.message);
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: billingSummary
            })
        };

    } catch (error) {
        console.error('Error getting billing summary:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};