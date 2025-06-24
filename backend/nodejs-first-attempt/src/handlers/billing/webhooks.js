const AWS = require('aws-sdk');
const Stripe = require('stripe');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Handle Stripe webhook events
 */
exports.handler = async (event) => {
    console.log('Stripe webhook event:', JSON.stringify(event, null, 2));
    
    try {
        const sig = event.headers['stripe-signature'];
        
        if (!sig || !WEBHOOK_SECRET) {
            console.error('Missing signature or webhook secret');
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid signature' })
            };
        }

        // Verify webhook signature
        let stripeEvent;
        try {
            stripeEvent = stripe.webhooks.constructEvent(event.body, sig, WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid signature' })
            };
        }

        console.log('Processing Stripe event:', stripeEvent.type);

        // Process the event
        switch (stripeEvent.type) {
            case 'customer.created':
                await handleCustomerCreated(stripeEvent.data.object);
                break;
            
            case 'customer.updated':
                await handleCustomerUpdated(stripeEvent.data.object);
                break;
            
            case 'customer.deleted':
                await handleCustomerDeleted(stripeEvent.data.object);
                break;
            
            case 'customer.subscription.created':
                await handleSubscriptionCreated(stripeEvent.data.object);
                break;
            
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(stripeEvent.data.object);
                break;
            
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(stripeEvent.data.object);
                break;
            
            case 'invoice.created':
                await handleInvoiceCreated(stripeEvent.data.object);
                break;
            
            case 'invoice.finalized':
                await handleInvoiceFinalized(stripeEvent.data.object);
                break;
            
            case 'invoice.paid':
                await handleInvoicePaid(stripeEvent.data.object);
                break;
            
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(stripeEvent.data.object);
                break;
            
            case 'payment_method.attached':
                await handlePaymentMethodAttached(stripeEvent.data.object);
                break;
            
            case 'payment_method.detached':
                await handlePaymentMethodDetached(stripeEvent.data.object);
                break;
            
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(stripeEvent.data.object);
                break;
            
            case 'setup_intent.succeeded':
                await handleSetupIntentSucceeded(stripeEvent.data.object);
                break;
            
            default:
                console.log(`Unhandled event type: ${stripeEvent.type}`);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ received: true })
        };

    } catch (error) {
        console.error('Webhook processing error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Handle customer creation
 */
async function handleCustomerCreated(customer) {
    const accountId = customer.metadata?.accountId;
    if (!accountId) return;

    await logActivity(accountId, 'billing.customer.created', 'Stripe customer created via webhook', {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
    });
}

/**
 * Handle customer updates
 */
async function handleCustomerUpdated(customer) {
    const accountId = customer.metadata?.accountId;
    if (!accountId) return;

    await logActivity(accountId, 'billing.customer.updated', 'Stripe customer updated via webhook', {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
    });
}

/**
 * Handle customer deletion
 */
async function handleCustomerDeleted(customer) {
    const accountId = customer.metadata?.accountId;
    if (!accountId) return;

    // Clean up account billing data
    try {
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'REMOVE billing.customerId, billing.customerCreatedAt SET updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':timestamp': new Date().toISOString()
            }
        }).promise();
    } catch (error) {
        console.error('Error cleaning up customer data:', error);
    }

    await logActivity(accountId, 'billing.customer.deleted', 'Stripe customer deleted via webhook', {
        customerId: customer.id
    });
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription) {
    const accountId = subscription.metadata?.accountId;
    if (!accountId) return;

    // Update account with subscription info
    try {
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.subscriptionId = :subId, billing.subscriptionStatus = :status, billing.subscriptionCreatedAt = :timestamp, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':subId': subscription.id,
                ':status': subscription.status,
                ':timestamp': new Date().toISOString()
            }
        }).promise();
    } catch (error) {
        console.error('Error updating subscription data:', error);
    }

    await logActivity(accountId, 'billing.subscription.created', 'Subscription created via webhook', {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer
    });
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
    const accountId = subscription.metadata?.accountId;
    if (!accountId) return;

    // Update account with subscription status
    try {
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.subscriptionStatus = :status, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':status': subscription.status,
                ':timestamp': new Date().toISOString()
            }
        }).promise();
    } catch (error) {
        console.error('Error updating subscription status:', error);
    }

    await logActivity(accountId, 'billing.subscription.updated', 'Subscription updated via webhook', {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
    });
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
    const accountId = subscription.metadata?.accountId;
    if (!accountId) return;

    // Update account subscription status
    try {
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.subscriptionStatus = :status, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':status': 'canceled',
                ':timestamp': new Date().toISOString()
            }
        }).promise();
    } catch (error) {
        console.error('Error updating canceled subscription:', error);
    }

    await logActivity(accountId, 'billing.subscription.canceled', 'Subscription canceled via webhook', {
        subscriptionId: subscription.id,
        canceledAt: subscription.canceled_at
    });
}

/**
 * Handle invoice creation
 */
async function handleInvoiceCreated(invoice) {
    const subscription = invoice.subscription;
    if (!subscription) return;

    // Get subscription to find accountId
    try {
        const sub = await stripe.subscriptions.retrieve(subscription);
        const accountId = sub.metadata?.accountId;
        if (!accountId) return;

        await logActivity(accountId, 'billing.invoice.created', 'Invoice created via webhook', {
            invoiceId: invoice.id,
            subscriptionId: subscription,
            amountDue: invoice.amount_due,
            currency: invoice.currency
        });
    } catch (error) {
        console.error('Error handling invoice creation:', error);
    }
}

/**
 * Handle invoice finalization
 */
async function handleInvoiceFinalized(invoice) {
    const subscription = invoice.subscription;
    if (!subscription) return;

    try {
        const sub = await stripe.subscriptions.retrieve(subscription);
        const accountId = sub.metadata?.accountId;
        if (!accountId) return;

        await logActivity(accountId, 'billing.invoice.finalized', 'Invoice finalized via webhook', {
            invoiceId: invoice.id,
            subscriptionId: subscription,
            amountDue: invoice.amount_due,
            dueDate: invoice.due_date
        });
    } catch (error) {
        console.error('Error handling invoice finalization:', error);
    }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice) {
    const subscription = invoice.subscription;
    if (!subscription) return;

    try {
        const sub = await stripe.subscriptions.retrieve(subscription);
        const accountId = sub.metadata?.accountId;
        if (!accountId) return;

        await logActivity(accountId, 'billing.invoice.paid', 'Invoice paid successfully via webhook', {
            invoiceId: invoice.id,
            subscriptionId: subscription,
            amountPaid: invoice.amount_paid,
            currency: invoice.currency
        });
    } catch (error) {
        console.error('Error handling invoice payment:', error);
    }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
    const subscription = invoice.subscription;
    if (!subscription) return;

    try {
        const sub = await stripe.subscriptions.retrieve(subscription);
        const accountId = sub.metadata?.accountId;
        if (!accountId) return;

        await logActivity(accountId, 'billing.invoice.payment_failed', 'Invoice payment failed via webhook', {
            invoiceId: invoice.id,
            subscriptionId: subscription,
            amountDue: invoice.amount_due,
            attemptCount: invoice.attempt_count
        });
    } catch (error) {
        console.error('Error handling invoice payment failure:', error);
    }
}

/**
 * Handle payment method attachment
 */
async function handlePaymentMethodAttached(paymentMethod) {
    const customerId = paymentMethod.customer;
    if (!customerId) return;

    try {
        const customer = await stripe.customers.retrieve(customerId);
        const accountId = customer.metadata?.accountId;
        if (!accountId) return;

        await logActivity(accountId, 'billing.payment_method.attached', 'Payment method attached via webhook', {
            paymentMethodId: paymentMethod.id,
            customerId,
            type: paymentMethod.type,
            last4: paymentMethod.card?.last4
        });
    } catch (error) {
        console.error('Error handling payment method attachment:', error);
    }
}

/**
 * Handle payment method detachment
 */
async function handlePaymentMethodDetached(paymentMethod) {
    // Customer will be null for detached payment methods
    await logActivity(null, 'billing.payment_method.detached', 'Payment method detached via webhook', {
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4
    });
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session) {
    const accountId = session.metadata?.accountId;
    if (!accountId) return;

    await logActivity(accountId, 'billing.checkout.completed', 'Checkout session completed via webhook', {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        amountTotal: session.amount_total,
        currency: session.currency
    });
}

/**
 * Handle successful setup intent
 */
async function handleSetupIntentSucceeded(setupIntent) {
    const accountId = setupIntent.metadata?.accountId;
    if (!accountId) return;

    await logActivity(accountId, 'billing.setup_intent.succeeded', 'Setup intent succeeded via webhook', {
        setupIntentId: setupIntent.id,
        customerId: setupIntent.customer,
        paymentMethodId: setupIntent.payment_method
    });
}

/**
 * Log activity to DynamoDB
 */
async function logActivity(accountId, type, description, metadata = {}) {
    if (!accountId) {
        console.warn('Cannot log activity without accountId');
        return;
    }

    try {
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type,
                description,
                metadata,
                timestamp: Date.now()
            }
        }).promise();
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}