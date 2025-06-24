const AWS = require('aws-sdk');
const { extractAuthContext } = require('../../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ region: process.env.AWS_REGION });

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;
const SES_SOURCE_EMAIL = process.env.SES_SOURCE_EMAIL || 'noreply@listbackup.ai';

/**
 * Send billing notification email
 */
async function sendBillingEmail(recipients, subject, htmlBody, textBody, metadata = {}) {
    try {
        if (!recipients || recipients.length === 0) {
            console.warn('No recipients provided for billing email');
            return false;
        }

        const emailParams = {
            Source: SES_SOURCE_EMAIL,
            Destination: {
                ToAddresses: recipients
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlBody,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: textBody,
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        const result = await ses.sendEmail(emailParams).promise();
        console.log('Email sent successfully:', result.MessageId);
        return result.MessageId;
    } catch (error) {
        console.error('Error sending billing email:', error);
        throw error;
    }
}

/**
 * Get billing notification settings
 */
exports.getNotificationSettings = async (event) => {
    console.log('Get notification settings event:', JSON.stringify(event, null, 2));
    
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

        // Get notification settings
        const notificationSettings = account.billing?.notifications || {
            enabled: true,
            channels: {
                email: {
                    enabled: true,
                    recipients: 'billing_contacts'
                },
                webhook: {
                    enabled: false,
                    url: null,
                    secret: null
                }
            },
            events: {
                invoiceCreated: true,
                invoicePaid: true,
                invoicePaymentFailed: true,
                subscriptionCreated: true,
                subscriptionUpdated: true,
                subscriptionCanceled: true,
                paymentMethodAdded: true,
                paymentMethodRemoved: true,
                usageAlerts: true,
                billingIssues: true
            },
            preferences: {
                frequency: 'immediate', // immediate, daily, weekly
                timezone: 'UTC',
                language: 'en',
                includeUsageData: true,
                includeInvoiceAttachment: true
            }
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: notificationSettings
            })
        };

    } catch (error) {
        console.error('Error getting notification settings:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Update billing notification settings
 */
exports.updateNotificationSettings = async (event) => {
    console.log('Update notification settings event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const updateData = JSON.parse(event.body || '{}');

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

        // Merge with existing settings
        const currentSettings = account.billing?.notifications || {};
        const updatedSettings = {
            ...currentSettings,
            ...updateData,
            updatedAt: new Date().toISOString(),
            updatedBy: userId
        };

        // Update account
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.notifications = :settings, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':settings': updatedSettings,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `notification-settings-updated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.notifications.updated',
                description: 'Billing notification settings updated',
                metadata: {
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
                data: updatedSettings
            })
        };

    } catch (error) {
        console.error('Error updating notification settings:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Send test notification
 */
exports.sendTestNotification = async (event) => {
    console.log('Send test notification event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { type = 'general', recipients } = JSON.parse(event.body || '{}');

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

        // Determine recipients
        let emailRecipients = recipients || [];
        if (emailRecipients.length === 0) {
            // Use billing contacts
            if (account.billing?.contacts?.primary?.email) {
                emailRecipients.push(account.billing.contacts.primary.email);
            }
            if (account.billing?.contacts?.additional) {
                emailRecipients.push(
                    ...account.billing.contacts.additional
                        .filter(c => c.isActive && c.notifications?.invoices)
                        .map(c => c.email)
                );
            }
        }

        if (emailRecipients.length === 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No email recipients available' })
            };
        }

        // Generate test email content
        const subject = `[Test] ListBackup.ai Billing Notification - ${account.name}`;
        const htmlBody = `
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin-bottom: 10px;">Test Billing Notification</h2>
                    <p style="color: #7f8c8d; margin: 0;">ListBackup.ai Billing System</p>
                </div>
                
                <div style="padding: 20px; background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px;">
                    <p>Hello,</p>
                    
                    <p>This is a test notification from the ListBackup.ai billing system for account <strong>${account.name}</strong>.</p>
                    
                    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px; border-radius: 4px; margin: 20px 0;">
                        <strong>✅ Test notification sent successfully!</strong><br>
                        Your billing notification settings are working correctly.
                    </div>
                    
                    <h3>Account Information:</h3>
                    <ul>
                        <li><strong>Account:</strong> ${account.name}</li>
                        <li><strong>Account ID:</strong> ${accountId}</li>
                        <li><strong>Test Type:</strong> ${type}</li>
                        <li><strong>Sent At:</strong> ${new Date().toISOString()}</li>
                    </ul>
                    
                    <p>If you received this email, your billing notifications are configured correctly and you will receive important billing updates when they occur.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
                    
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                        This is an automated message from ListBackup.ai. 
                        If you have questions about your billing, please contact support.
                    </p>
                </div>
            </body>
            </html>
        `;

        const textBody = `
Test Billing Notification - ListBackup.ai

Hello,

This is a test notification from the ListBackup.ai billing system for account "${account.name}".

✅ Test notification sent successfully!
Your billing notification settings are working correctly.

Account Information:
- Account: ${account.name}
- Account ID: ${accountId}
- Test Type: ${type}
- Sent At: ${new Date().toISOString()}

If you received this email, your billing notifications are configured correctly and you will receive important billing updates when they occur.

This is an automated message from ListBackup.ai.
If you have questions about your billing, please contact support.
        `;

        // Send email
        const messageId = await sendBillingEmail(
            emailRecipients,
            subject,
            htmlBody,
            textBody,
            { accountId, type: 'test', userId }
        );

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `test-notification-sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.notifications.test_sent',
                description: 'Test billing notification sent',
                metadata: {
                    messageId,
                    recipients: emailRecipients,
                    testType: type
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
                    messageId,
                    recipients: emailRecipients,
                    sentAt: new Date().toISOString()
                }
            })
        };

    } catch (error) {
        console.error('Error sending test notification:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Send billing event notification (called by webhooks)
 */
exports.sendBillingEventNotification = async (eventType, accountId, eventData) => {
    try {
        // Get account and notification settings
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();

        const account = accountResult.Item;
        if (!account || !account.billing?.notifications?.enabled) {
            return false;
        }

        const settings = account.billing.notifications;
        
        // Check if this event type should trigger notifications
        const eventMap = {
            'invoice.created': 'invoiceCreated',
            'invoice.paid': 'invoicePaid',
            'invoice.payment_failed': 'invoicePaymentFailed',
            'customer.subscription.created': 'subscriptionCreated',
            'customer.subscription.updated': 'subscriptionUpdated',
            'customer.subscription.deleted': 'subscriptionCanceled',
            'payment_method.attached': 'paymentMethodAdded',
            'payment_method.detached': 'paymentMethodRemoved'
        };

        const settingKey = eventMap[eventType];
        if (!settingKey || !settings.events?.[settingKey]) {
            console.log(`Notifications disabled for event type: ${eventType}`);
            return false;
        }

        // Get recipients
        const recipients = [];
        if (account.billing?.contacts?.primary?.email) {
            const primary = account.billing.contacts.primary;
            if (primary.notifications?.[settingKey] !== false) {
                recipients.push(primary.email);
            }
        }

        if (account.billing?.contacts?.additional) {
            account.billing.contacts.additional.forEach(contact => {
                if (contact.isActive && contact.notifications?.[settingKey] !== false) {
                    recipients.push(contact.email);
                }
            });
        }

        if (recipients.length === 0) {
            console.log('No recipients configured for billing notifications');
            return false;
        }

        // Generate email content based on event type
        const { subject, htmlBody, textBody } = generateEventEmailContent(eventType, account, eventData);

        // Send email
        const messageId = await sendBillingEmail(recipients, subject, htmlBody, textBody, {
            accountId,
            eventType,
            eventData
        });

        console.log(`Billing notification sent for ${eventType}:`, messageId);
        return messageId;

    } catch (error) {
        console.error('Error sending billing event notification:', error);
        throw error;
    }
};

/**
 * Generate email content for billing events
 */
function generateEventEmailContent(eventType, account, eventData) {
    const baseStyles = `
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px; background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; }
            .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px; border-radius: 4px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 12px; border-radius: 4px; margin: 20px 0; }
            .danger { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 12px; border-radius: 4px; margin: 20px 0; }
            .footer { color: #6c757d; font-size: 14px; margin: 0; }
        </style>
    `;

    switch (eventType) {
        case 'invoice.paid':
            return {
                subject: `✅ Payment Received - ${account.name}`,
                htmlBody: `
                    <html><head>${baseStyles}</head><body>
                        <div class="header">
                            <h2>Payment Received</h2>
                            <p>ListBackup.ai Billing Update</p>
                        </div>
                        <div class="content">
                            <div class="success">
                                <strong>✅ Payment successful!</strong><br>
                                Your invoice has been paid successfully.
                            </div>
                            <h3>Payment Details:</h3>
                            <ul>
                                <li><strong>Amount:</strong> $${(eventData.amount_paid / 100).toFixed(2)} ${eventData.currency?.toUpperCase()}</li>
                                <li><strong>Invoice:</strong> ${eventData.number}</li>
                                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                            </ul>
                            <p class="footer">Thank you for your payment. Your services will continue uninterrupted.</p>
                        </div>
                    </body></html>
                `,
                textBody: `Payment Received - ${account.name}\n\n✅ Payment successful!\nYour invoice has been paid successfully.\n\nAmount: $${(eventData.amount_paid / 100).toFixed(2)} ${eventData.currency?.toUpperCase()}\nInvoice: ${eventData.number}\nDate: ${new Date().toLocaleDateString()}\n\nThank you for your payment.`
            };

        case 'invoice.payment_failed':
            return {
                subject: `⚠️ Payment Failed - ${account.name}`,
                htmlBody: `
                    <html><head>${baseStyles}</head><body>
                        <div class="header">
                            <h2>Payment Failed</h2>
                            <p>ListBackup.ai Billing Alert</p>
                        </div>
                        <div class="content">
                            <div class="danger">
                                <strong>⚠️ Payment failed!</strong><br>
                                We were unable to process your payment.
                            </div>
                            <h3>Invoice Details:</h3>
                            <ul>
                                <li><strong>Amount Due:</strong> $${(eventData.amount_due / 100).toFixed(2)} ${eventData.currency?.toUpperCase()}</li>
                                <li><strong>Invoice:</strong> ${eventData.number}</li>
                                <li><strong>Attempt:</strong> ${eventData.attempt_count}</li>
                            </ul>
                            <p>Please update your payment method or contact support.</p>
                            <p class="footer">Your services may be suspended if payment is not received.</p>
                        </div>
                    </body></html>
                `,
                textBody: `Payment Failed - ${account.name}\n\n⚠️ Payment failed!\nWe were unable to process your payment.\n\nAmount Due: $${(eventData.amount_due / 100).toFixed(2)} ${eventData.currency?.toUpperCase()}\nInvoice: ${eventData.number}\nAttempt: ${eventData.attempt_count}\n\nPlease update your payment method.`
            };

        case 'customer.subscription.created':
            return {
                subject: `🎉 Subscription Activated - ${account.name}`,
                htmlBody: `
                    <html><head>${baseStyles}</head><body>
                        <div class="header">
                            <h2>Subscription Activated</h2>
                            <p>ListBackup.ai Billing Update</p>
                        </div>
                        <div class="content">
                            <div class="success">
                                <strong>🎉 Subscription activated!</strong><br>
                                Your new subscription is now active.
                            </div>
                            <h3>Subscription Details:</h3>
                            <ul>
                                <li><strong>Status:</strong> ${eventData.status}</li>
                                <li><strong>Current Period:</strong> ${new Date(eventData.current_period_start * 1000).toLocaleDateString()} - ${new Date(eventData.current_period_end * 1000).toLocaleDateString()}</li>
                            </ul>
                            <p class="footer">Welcome to ListBackup.ai! Your services are now active.</p>
                        </div>
                    </body></html>
                `,
                textBody: `Subscription Activated - ${account.name}\n\n🎉 Subscription activated!\nYour new subscription is now active.\n\nStatus: ${eventData.status}\nWelcome to ListBackup.ai!`
            };

        default:
            return {
                subject: `Billing Update - ${account.name}`,
                htmlBody: `
                    <html><head>${baseStyles}</head><body>
                        <div class="header">
                            <h2>Billing Update</h2>
                            <p>ListBackup.ai</p>
                        </div>
                        <div class="content">
                            <p>A billing event has occurred for your account: <strong>${eventType}</strong></p>
                            <p class="footer">For more details, please check your billing dashboard.</p>
                        </div>
                    </body></html>
                `,
                textBody: `Billing Update - ${account.name}\n\nA billing event has occurred: ${eventType}\n\nFor more details, please check your billing dashboard.`
            };
    }
}

// Export the notification sender for use by webhooks
module.exports.sendBillingEventNotification = exports.sendBillingEventNotification;