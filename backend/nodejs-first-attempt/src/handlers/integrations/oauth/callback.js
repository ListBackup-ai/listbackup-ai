const { GetCommand, DeleteCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { PutSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { dynamodb, secretsManager } = require('../../../utils/aws-clients');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const OAUTH_STATES_TABLE = process.env.OAUTH_STATES_TABLE;
const SOURCES_TABLE = process.env.SOURCES_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'https://main.api.listbackup.ai';

exports.handler = async (event) => {
    console.log('OAuth callback event:', JSON.stringify(event, null, 2));
    
    try {
        const { integrationType } = event.pathParameters;
        const { code, state, error, error_description } = event.queryStringParameters || {};
        
        // Handle OAuth errors
        if (error) {
            console.error('OAuth error:', error, error_description);
            return {
                statusCode: 302,
                headers: {
                    'Location': `${process.env.FRONTEND_URL}/dashboard/sources?error=${encodeURIComponent(error_description || error)}`
                }
            };
        }
        
        // Validate state parameter
        if (!state || !code) {
            return {
                statusCode: 302,
                headers: {
                    'Location': `${process.env.FRONTEND_URL}/dashboard/sources?error=invalid_request`
                }
            };
        }
        
        // Get state data from DynamoDB
        const stateResult = await dynamodb.send(new GetCommand({
            TableName: OAUTH_STATES_TABLE,
            Key: { state }
        }));
        
        if (!stateResult.Item) {
            return {
                statusCode: 302,
                headers: {
                    'Location': `${process.env.FRONTEND_URL}/dashboard/sources?error=invalid_state`
                }
            };
        }
        
        const stateData = stateResult.Item;
        
        // Check if state has expired
        if (new Date(stateData.expiresAt) < new Date()) {
            await dynamodb.send(new DeleteCommand({
                TableName: OAUTH_STATES_TABLE,
                Key: { state }
            }));
            
            return {
                statusCode: 302,
                headers: {
                    'Location': `${stateData.returnUrl}?error=state_expired`
                }
            };
        }
        
        // Exchange authorization code for tokens
        const redirectUri = `${API_GATEWAY_URL}/integrations/${integrationType}/oauth/callback`;
        let tokenData;
        
        try {
            tokenData = await exchangeCodeForToken(integrationType, code, redirectUri);
        } catch (tokenError) {
            console.error('Token exchange error:', tokenError);
            return {
                statusCode: 302,
                headers: {
                    'Location': `${stateData.returnUrl}?error=token_exchange_failed`
                }
            };
        }
        
        // Store tokens securely
        const secretName = `listbackup/${stateData.accountId}/oauth/${integrationType}/${stateData.sourceId || uuidv4()}`;
        await secretsManager.send(new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: JSON.stringify({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: tokenData.expires_at,
                scope: tokenData.scope,
                token_type: tokenData.token_type
            })
        }));
        
        // Create or update source
        let sourceId = stateData.sourceId;
        if (!sourceId) {
            sourceId = `source:${uuidv4()}`;
            
            // Get integration info
            const integrationInfo = await getIntegrationInfo(integrationType, tokenData.access_token);
            
            const source = {
                sourceId,
                accountId: stateData.accountId,
                userId: stateData.userId,
                type: integrationType,
                name: integrationInfo.name || `${integrationType} Account`,
                status: 'active',
                config: {
                    authType: 'oauth2',
                    tokenSecretName: secretName,
                    accountInfo: integrationInfo
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await dynamodb.send(new PutCommand({
                TableName: SOURCES_TABLE,
                Item: source
            }));
            
            // Log activity
            await logActivity(stateData.accountId, stateData.userId, sourceId, 'source.created', 
                `OAuth source created: ${source.name}`);
        } else {
            // Update existing source
            await dynamodb.send(new UpdateCommand({
                TableName: SOURCES_TABLE,
                Key: { sourceId },
                UpdateExpression: 'SET #config.tokenSecretName = :secretName, #status = :status, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#config': 'config',
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':secretName': secretName,
                    ':status': 'active',
                    ':updatedAt': new Date().toISOString()
                }
            }));
            
            await logActivity(stateData.accountId, stateData.userId, sourceId, 'source.reauthorized', 
                `OAuth source reauthorized`);
        }
        
        // Clean up state
        await dynamodb.send(new DeleteCommand({
            TableName: OAUTH_STATES_TABLE,
            Key: { state }
        }));
        
        // Redirect back to frontend
        return {
            statusCode: 302,
            headers: {
                'Location': `${stateData.returnUrl}?success=true&sourceId=${sourceId}`
            }
        };
        
    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        return {
            statusCode: 302,
            headers: {
                'Location': `${process.env.FRONTEND_URL}/dashboard/sources?error=internal_error`
            }
        };
    }
};

async function exchangeCodeForToken(integrationType, code, redirectUri) {
    let tokenUrl, tokenParams, headers;
    
    switch (integrationType) {
        case 'hubspot':
            tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
            tokenParams = {
                grant_type: 'authorization_code',
                client_id: process.env.HUBSPOT_CLIENT_ID,
                client_secret: process.env.HUBSPOT_CLIENT_SECRET,
                redirect_uri: redirectUri,
                code
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        case 'google':
            tokenUrl = 'https://oauth2.googleapis.com/token';
            tokenParams = {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        case 'dropbox':
            tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
            tokenParams = {
                code,
                grant_type: 'authorization_code',
                client_id: process.env.DROPBOX_CLIENT_ID,
                client_secret: process.env.DROPBOX_CLIENT_SECRET,
                redirect_uri: redirectUri
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        case 'box':
            tokenUrl = 'https://api.box.com/oauth2/token';
            tokenParams = {
                grant_type: 'authorization_code',
                code,
                client_id: process.env.BOX_CLIENT_ID,
                client_secret: process.env.BOX_CLIENT_SECRET,
                redirect_uri: redirectUri
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        case 'shopify':
            // Shopify uses a different OAuth flow
            // This would need the shop domain from the state
            throw new Error('Shopify OAuth requires special handling');
            
        default:
            throw new Error(`OAuth not configured for ${integrationType}`);
    }
    
    const response = await axios.post(tokenUrl, new URLSearchParams(tokenParams), { headers });
    
    // Calculate token expiration
    const expiresAt = response.data.expires_in 
        ? new Date(Date.now() + response.data.expires_in * 1000).toISOString()
        : null;
    
    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: expiresAt,
        scope: response.data.scope,
        token_type: response.data.token_type || 'Bearer'
    };
}

async function getIntegrationInfo(integrationType, accessToken) {
    try {
        switch (integrationType) {
            case 'hubspot':
                const hubspotResponse = await axios.get('https://api.hubapi.com/account-info/v3/details', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                return {
                    name: hubspotResponse.data.companyName,
                    portalId: hubspotResponse.data.portalId,
                    timeZone: hubspotResponse.data.timeZone
                };
                
            case 'google':
                const googleResponse = await axios.get('https://www.googleapis.com/drive/v3/about?fields=user', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                return {
                    name: `Google Drive - ${googleResponse.data.user.emailAddress}`,
                    email: googleResponse.data.user.emailAddress
                };
                
            case 'dropbox':
                const dropboxResponse = await axios.post('https://api.dropboxapi.com/2/users/get_current_account', null, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                return {
                    name: `Dropbox - ${dropboxResponse.data.email}`,
                    email: dropboxResponse.data.email,
                    accountId: dropboxResponse.data.account_id
                };
                
            case 'box':
                const boxResponse = await axios.get('https://api.box.com/2.0/users/me', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                return {
                    name: `Box - ${boxResponse.data.login}`,
                    email: boxResponse.data.login,
                    userId: boxResponse.data.id
                };
                
            default:
                return { name: `${integrationType} Account` };
        }
    } catch (error) {
        console.error('Error getting integration info:', error);
        return { name: `${integrationType} Account` };
    }
}

async function logActivity(accountId, userId, sourceId, type, description) {
    const activity = {
        eventId: `activity:${uuidv4()}`,
        accountId,
        userId,
        type,
        resourceId: sourceId,
        resourceType: 'source',
        description,
        severity: 'info',
        timestamp: Date.now()
    };
    
    await dynamodb.send(new PutCommand({
        TableName: ACTIVITY_TABLE,
        Item: activity
    }));
}