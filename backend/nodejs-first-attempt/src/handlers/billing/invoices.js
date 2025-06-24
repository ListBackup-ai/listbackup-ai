const AWS = require('aws-sdk');
const Stripe = require('stripe');
const { extractAuthContext } = require('../../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;

/**
 * Get invoices for account
 */
exports.getInvoices = async (event) => {
    console.log('Get invoices event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const limit = parseInt(event.queryStringParameters?.limit) || 20;
        const status = event.queryStringParameters?.status; // paid, open, draft, etc.
        
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

        // Get invoices from Stripe
        const invoiceParams = {
            customer: account.billing.customerId,
            limit: Math.min(limit, 100), // Cap at 100
            expand: ['data.payment_intent', 'data.subscription']
        };

        if (status) {
            invoiceParams.status = status;
        }

        const invoices = await stripe.invoices.list(invoiceParams);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    invoices: invoices.data.map(invoice => ({
                        id: invoice.id,
                        number: invoice.number,
                        status: invoice.status,
                        created: invoice.created,
                        dueDate: invoice.due_date,
                        paid: invoice.paid,
                        amountDue: invoice.amount_due,
                        amountPaid: invoice.amount_paid,
                        amountRemaining: invoice.amount_remaining,
                        currency: invoice.currency,
                        description: invoice.description,
                        hostedInvoiceUrl: invoice.hosted_invoice_url,
                        invoicePdf: invoice.invoice_pdf,
                        subscriptionId: invoice.subscription,
                        periodStart: invoice.period_start,
                        periodEnd: invoice.period_end,
                        paymentIntent: invoice.payment_intent ? {
                            id: invoice.payment_intent.id,
                            status: invoice.payment_intent.status
                        } : null,
                        lines: invoice.lines.data.map(line => ({
                            id: line.id,
                            amount: line.amount,
                            currency: line.currency,
                            description: line.description,
                            priceId: line.price?.id,
                            quantity: line.quantity,
                            unitAmount: line.price?.unit_amount
                        }))
                    })),
                    hasMore: invoices.has_more,
                    totalCount: invoices.data.length
                }
            })
        };

    } catch (error) {
        console.error('Error getting invoices:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Get single invoice
 */
exports.getInvoice = async (event) => {
    console.log('Get invoice event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { invoiceId } = event.pathParameters;

        if (!invoiceId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'invoiceId is required' })
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

        // Get invoice from Stripe
        const invoice = await stripe.invoices.retrieve(invoiceId, {
            expand: ['payment_intent', 'subscription', 'customer']
        });

        // Verify invoice belongs to this customer
        if (invoice.customer.id !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invoice does not belong to this customer' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    id: invoice.id,
                    number: invoice.number,
                    status: invoice.status,
                    created: invoice.created,
                    dueDate: invoice.due_date,
                    paid: invoice.paid,
                    amountDue: invoice.amount_due,
                    amountPaid: invoice.amount_paid,
                    amountRemaining: invoice.amount_remaining,
                    currency: invoice.currency,
                    description: invoice.description,
                    hostedInvoiceUrl: invoice.hosted_invoice_url,
                    invoicePdf: invoice.invoice_pdf,
                    subscriptionId: invoice.subscription,
                    periodStart: invoice.period_start,
                    periodEnd: invoice.period_end,
                    paymentIntent: invoice.payment_intent ? {
                        id: invoice.payment_intent.id,
                        status: invoice.payment_intent.status,
                        amount: invoice.payment_intent.amount,
                        currency: invoice.payment_intent.currency
                    } : null,
                    customer: {
                        id: invoice.customer.id,
                        email: invoice.customer.email,
                        name: invoice.customer.name
                    },
                    lines: invoice.lines.data.map(line => ({
                        id: line.id,
                        amount: line.amount,
                        currency: line.currency,
                        description: line.description,
                        priceId: line.price?.id,
                        quantity: line.quantity,
                        unitAmount: line.price?.unit_amount,
                        period: {
                            start: line.period?.start,
                            end: line.period?.end
                        }
                    })),
                    tax: invoice.tax || 0,
                    total: invoice.total,
                    subtotal: invoice.subtotal
                }
            })
        };

    } catch (error) {
        console.error('Error getting invoice:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Pay invoice (for draft/open invoices)
 */
exports.payInvoice = async (event) => {
    console.log('Pay invoice event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { invoiceId } = event.pathParameters;
        const { paymentMethodId } = JSON.parse(event.body || '{}');

        if (!invoiceId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'invoiceId is required' })
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

        // Get invoice from Stripe
        const invoice = await stripe.invoices.retrieve(invoiceId);

        // Verify invoice belongs to this customer
        if (invoice.customer !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invoice does not belong to this customer' })
            };
        }

        // Check if invoice can be paid
        if (invoice.status === 'paid') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invoice is already paid' })
            };
        }

        if (invoice.status !== 'open' && invoice.status !== 'draft') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invoice cannot be paid in current status' })
            };
        }

        // Pay the invoice
        const payParams = {};
        if (paymentMethodId) {
            payParams.payment_method = paymentMethodId;
        }

        const paidInvoice = await stripe.invoices.pay(invoiceId, payParams);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    id: paidInvoice.id,
                    status: paidInvoice.status,
                    paid: paidInvoice.paid,
                    amountPaid: paidInvoice.amount_paid,
                    paymentIntent: paidInvoice.payment_intent
                }
            })
        };

    } catch (error) {
        console.error('Error paying invoice:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Download invoice PDF
 */
exports.downloadInvoice = async (event) => {
    console.log('Download invoice event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { invoiceId } = event.pathParameters;

        if (!invoiceId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'invoiceId is required' })
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

        // Get invoice from Stripe
        const invoice = await stripe.invoices.retrieve(invoiceId);

        // Verify invoice belongs to this customer
        if (invoice.customer !== account.billing.customerId) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invoice does not belong to this customer' })
            };
        }

        if (!invoice.invoice_pdf) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invoice PDF not available' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.number,
                    downloadUrl: invoice.invoice_pdf,
                    hostedUrl: invoice.hosted_invoice_url
                }
            })
        };

    } catch (error) {
        console.error('Error downloading invoice:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};