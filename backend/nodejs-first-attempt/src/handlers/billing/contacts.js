const AWS = require('aws-sdk');
const Stripe = require('stripe');
const { extractAuthContext } = require('../../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const USERS_ACCOUNTS_TABLE = process.env.USERS_ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

/**
 * Get billing contacts for account
 */
exports.getBillingContacts = async (event) => {
    console.log('Get billing contacts event:', JSON.stringify(event, null, 2));
    
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

        // Get billing contacts configuration
        const billingContacts = account.billing?.contacts || {
            primary: {
                type: 'account_owner',
                email: account.ownerEmail,
                name: account.ownerName || account.name,
                role: 'Primary Contact',
                notifications: {
                    invoices: true,
                    paymentFailures: true,
                    subscriptionChanges: true,
                    usageAlerts: true
                }
            },
            additional: []
        };

        // Merge with Stripe customer data if available
        if (account.billing?.customerId) {
            try {
                const customer = await stripe.customers.retrieve(account.billing.customerId);
                if (billingContacts.primary.type === 'account_owner') {
                    billingContacts.primary.email = customer.email || billingContacts.primary.email;
                    billingContacts.primary.name = customer.name || billingContacts.primary.name;
                    billingContacts.primary.phone = customer.phone;
                    billingContacts.primary.address = customer.address;
                }
            } catch (error) {
                console.warn('Error fetching Stripe customer data:', error.message);
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    accountId,
                    contacts: billingContacts,
                    hasStripeCustomer: !!account.billing?.customerId
                }
            })
        };

    } catch (error) {
        console.error('Error getting billing contacts:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Add billing contact
 */
exports.addBillingContact = async (event) => {
    console.log('Add billing contact event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { email, name, role, phone, address, notifications = {} } = JSON.parse(event.body || '{}');

        if (!email || !name) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Email and name are required' })
            };
        }

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
        if (!account) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account not found' })
            };
        }

        // Create new contact
        const newContact = {
            id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            email,
            name,
            role: role || 'Billing Contact',
            phone: phone || null,
            address: address || null,
            notifications: {
                invoices: notifications.invoices !== false,
                paymentFailures: notifications.paymentFailures !== false,
                subscriptionChanges: notifications.subscriptionChanges !== false,
                usageAlerts: notifications.usageAlerts !== false,
                ...notifications
            },
            addedAt: new Date().toISOString(),
            addedBy: userId,
            isActive: true
        };

        // Update account with new contact
        const currentContacts = account.billing?.contacts || { primary: null, additional: [] };
        currentContacts.additional = currentContacts.additional || [];
        currentContacts.additional.push(newContact);

        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.contacts = :contacts, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':contacts': currentContacts,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `billing-contact-added-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.contact.added',
                description: 'Billing contact added',
                metadata: {
                    contactId: newContact.id,
                    email: newContact.email,
                    name: newContact.name,
                    role: newContact.role
                },
                timestamp: Date.now()
            }
        }).promise();

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: newContact
            })
        };

    } catch (error) {
        console.error('Error adding billing contact:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Update billing contact
 */
exports.updateBillingContact = async (event) => {
    console.log('Update billing contact event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { contactId } = event.pathParameters;
        const updateData = JSON.parse(event.body || '{}');

        if (!contactId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'contactId is required' })
            };
        }

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
        if (!account || !account.billing?.contacts) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account or contacts not found' })
            };
        }

        const contacts = account.billing.contacts;
        let contactToUpdate = null;
        let isPrimaryContact = false;

        // Check if updating primary contact
        if (contacts.primary && contacts.primary.id === contactId) {
            contactToUpdate = contacts.primary;
            isPrimaryContact = true;
        } else {
            // Find in additional contacts
            const contactIndex = contacts.additional?.findIndex(c => c.id === contactId);
            if (contactIndex !== -1) {
                contactToUpdate = contacts.additional[contactIndex];
            }
        }

        if (!contactToUpdate) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Contact not found' })
            };
        }

        // Update contact fields
        const updatedContact = {
            ...contactToUpdate,
            ...updateData,
            id: contactToUpdate.id, // Preserve ID
            updatedAt: new Date().toISOString(),
            updatedBy: userId
        };

        // Update in the appropriate location
        if (isPrimaryContact) {
            contacts.primary = updatedContact;
        } else {
            const contactIndex = contacts.additional.findIndex(c => c.id === contactId);
            contacts.additional[contactIndex] = updatedContact;
        }

        // Save updated contacts
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.contacts = :contacts, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':contacts': contacts,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Update Stripe customer if this is the primary contact
        if (isPrimaryContact && account.billing?.customerId) {
            try {
                await stripe.customers.update(account.billing.customerId, {
                    email: updatedContact.email,
                    name: updatedContact.name,
                    phone: updatedContact.phone,
                    address: updatedContact.address
                });
            } catch (error) {
                console.warn('Error updating Stripe customer:', error.message);
            }
        }

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `billing-contact-updated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.contact.updated',
                description: `Billing contact updated${isPrimaryContact ? ' (Primary)' : ''}`,
                metadata: {
                    contactId,
                    isPrimaryContact,
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
                data: updatedContact
            })
        };

    } catch (error) {
        console.error('Error updating billing contact:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Remove billing contact
 */
exports.removeBillingContact = async (event) => {
    console.log('Remove billing contact event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { contactId } = event.pathParameters;

        if (!contactId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'contactId is required' })
            };
        }

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
        if (!account || !account.billing?.contacts?.additional) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account or contacts not found' })
            };
        }

        // Find and remove contact (only additional contacts can be removed)
        const contacts = account.billing.contacts;
        const contactIndex = contacts.additional.findIndex(c => c.id === contactId);

        if (contactIndex === -1) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Contact not found or cannot be removed' })
            };
        }

        const removedContact = contacts.additional[contactIndex];
        contacts.additional.splice(contactIndex, 1);

        // Save updated contacts
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.contacts = :contacts, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':contacts': contacts,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `billing-contact-removed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.contact.removed',
                description: 'Billing contact removed',
                metadata: {
                    contactId,
                    email: removedContact.email,
                    name: removedContact.name
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
                    contactId,
                    removed: true
                }
            })
        };

    } catch (error) {
        console.error('Error removing billing contact:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Set primary billing contact
 */
exports.setPrimaryBillingContact = async (event) => {
    console.log('Set primary billing contact event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { contactId } = JSON.parse(event.body || '{}');

        if (!contactId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'contactId is required' })
            };
        }

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
        if (!account || !account.billing?.contacts) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Account or contacts not found' })
            };
        }

        const contacts = account.billing.contacts;
        
        // Find the contact to promote
        const contactIndex = contacts.additional?.findIndex(c => c.id === contactId);
        if (contactIndex === -1) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Contact not found' })
            };
        }

        const newPrimaryContact = contacts.additional[contactIndex];
        
        // Move current primary to additional if it exists
        if (contacts.primary && contacts.primary.id) {
            contacts.additional.push({
                ...contacts.primary,
                role: contacts.primary.role || 'Former Primary Contact'
            });
        }

        // Set new primary contact
        contacts.primary = {
            ...newPrimaryContact,
            type: 'custom',
            role: 'Primary Contact',
            promotedAt: new Date().toISOString(),
            promotedBy: userId
        };

        // Remove from additional contacts
        contacts.additional.splice(contactIndex, 1);

        // Save updated contacts
        await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
            UpdateExpression: 'SET billing.contacts = :contacts, updatedAt = :timestamp',
            ExpressionAttributeValues: {
                ':contacts': contacts,
                ':timestamp': new Date().toISOString()
            }
        }).promise();

        // Update Stripe customer with new primary contact
        if (account.billing?.customerId) {
            try {
                await stripe.customers.update(account.billing.customerId, {
                    email: newPrimaryContact.email,
                    name: newPrimaryContact.name,
                    phone: newPrimaryContact.phone,
                    address: newPrimaryContact.address
                });
            } catch (error) {
                console.warn('Error updating Stripe customer:', error.message);
            }
        }

        // Log activity
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: {
                eventId: `primary-contact-changed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                accountId,
                type: 'billing.contact.primary_changed',
                description: 'Primary billing contact changed',
                metadata: {
                    newPrimaryContactId: contactId,
                    email: newPrimaryContact.email,
                    name: newPrimaryContact.name
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
                    newPrimaryContact: contacts.primary,
                    totalContacts: contacts.additional.length + 1
                }
            })
        };

    } catch (error) {
        console.error('Error setting primary billing contact:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};