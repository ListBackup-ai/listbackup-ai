const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../../utils/aws-clients');
const crypto = require('crypto');
const { AVAILABLE_INTEGRATIONS } = require('../../../config/available-integrations');

const OAUTH_STATES_TABLE = process.env.OAUTH_STATES_TABLE;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'https://main.api.listbackup.ai';

exports.handler = async (event) => {
    console.log('OAuth initiate event:', JSON.stringify(event, null, 2));
    
    try {
        const { integrationType } = event.pathParameters;
        const { sourceId, returnUrl } = JSON.parse(event.body || '{}');
        
        // Extract auth context
        let userId, accountId;
        if (event.requestContext.authorizer?.lambda) {
            userId = event.requestContext.authorizer.lambda.userId;
            accountId = event.requestContext.authorizer.lambda.accountId;
        } else if (event.requestContext.authorizer) {
            userId = event.requestContext.authorizer.userId;
            accountId = event.requestContext.authorizer.accountId;
        } else {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }
        
        // Validate integration type
        const integrationConfig = AVAILABLE_INTEGRATIONS[integrationType];
        if (!integrationConfig) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Invalid integration type' })
            };
        }
        
        // Check if integration supports OAuth
        if (integrationConfig.auth_config.type !== 'oauth2') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Integration does not support OAuth' })
            };
        }
        
        // Generate secure state parameter
        const state = crypto.randomBytes(32).toString('hex');
        const stateData = {
            state,
            integrationType,
            userId,
            accountId,
            sourceId,
            returnUrl: returnUrl || `${process.env.FRONTEND_URL}/dashboard/sources`,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        };
        
        // Store state in DynamoDB
        await dynamodb.send(new PutCommand({
            TableName: OAUTH_STATES_TABLE,
            Item: stateData
        }));
        
        // Build OAuth URL based on integration type
        let authUrl;
        const redirectUri = `${API_GATEWAY_URL}/integrations/${integrationType}/oauth/callback`;
        
        switch (integrationType) {
            case 'hubspot':
                const hubspotParams = new URLSearchParams({
                    client_id: process.env.HUBSPOT_CLIENT_ID,
                    redirect_uri: redirectUri,
                    scope: 'crm.objects.contacts.read crm.objects.companies.read crm.objects.deals.read crm.objects.custom.read oauth',
                    state
                });
                authUrl = `https://app.hubspot.com/oauth/authorize?${hubspotParams}`;
                break;
                
            case 'google':
                const googleParams = new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    redirect_uri: redirectUri,
                    response_type: 'code',
                    scope: 'https://www.googleapis.com/auth/drive.readonly',
                    access_type: 'offline',
                    prompt: 'consent',
                    state
                });
                authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${googleParams}`;
                break;
                
            case 'dropbox':
                const dropboxParams = new URLSearchParams({
                    client_id: process.env.DROPBOX_CLIENT_ID,
                    redirect_uri: redirectUri,
                    response_type: 'code',
                    state
                });
                authUrl = `https://www.dropbox.com/oauth2/authorize?${dropboxParams}`;
                break;
                
            case 'box':
                const boxParams = new URLSearchParams({
                    client_id: process.env.BOX_CLIENT_ID,
                    redirect_uri: redirectUri,
                    response_type: 'code',
                    state
                });
                authUrl = `https://account.box.com/api/oauth2/authorize?${boxParams}`;
                break;
                
            case 'shopify':
                // Shopify OAuth requires shop domain
                const { shopDomain } = JSON.parse(event.body || '{}');
                if (!shopDomain) {
                    return {
                        statusCode: 400,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'Shop domain required for Shopify OAuth' })
                    };
                }
                const shopifyParams = new URLSearchParams({
                    client_id: process.env.SHOPIFY_CLIENT_ID,
                    scope: 'read_products,read_orders,read_customers,read_inventory',
                    redirect_uri: redirectUri,
                    state
                });
                authUrl = `https://${shopDomain}/admin/oauth/authorize?${shopifyParams}`;
                break;
                
            default:
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'OAuth not configured for this integration' })
                };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                authUrl,
                state
            })
        };
        
    } catch (error) {
        console.error('Error initiating OAuth:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};