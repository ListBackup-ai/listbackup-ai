const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { GetSecretValueCommand, PutSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { dynamodb, secretsManager } = require('../../../utils/aws-clients');
const axios = require('axios');

const SOURCES_TABLE = process.env.SOURCES_TABLE;

exports.handler = async (event) => {
    console.log('OAuth refresh event:', JSON.stringify(event, null, 2));
    
    try {
        const { sourceId } = event;
        
        // Get source from DynamoDB
        const sourceResult = await dynamodb.send(new GetCommand({
            TableName: SOURCES_TABLE,
            Key: { sourceId }
        }));
        
        if (!sourceResult.Item) {
            throw new Error('Source not found');
        }
        
        const source = sourceResult.Item;
        
        // Check if source uses OAuth
        if (source.config?.authType !== 'oauth2' || !source.config?.tokenSecretName) {
            return {
                success: false,
                error: 'Source does not use OAuth authentication'
            };
        }
        
        // Get current tokens from Secrets Manager
        const secretResult = await secretsManager.send(new GetSecretValueCommand({
            SecretId: source.config.tokenSecretName
        }));
        
        const currentTokens = JSON.parse(secretResult.SecretString);
        
        // Check if refresh is needed
        if (currentTokens.expires_at && new Date(currentTokens.expires_at) > new Date(Date.now() + 5 * 60 * 1000)) {
            // Token is still valid for more than 5 minutes
            return {
                success: true,
                message: 'Token still valid',
                expiresAt: currentTokens.expires_at
            };
        }
        
        // Refresh token
        const newTokens = await refreshToken(source.type, currentTokens.refresh_token);
        
        // Update tokens in Secrets Manager
        await secretsManager.send(new PutSecretValueCommand({
            SecretId: source.config.tokenSecretName,
            SecretString: JSON.stringify({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token || currentTokens.refresh_token, // Some providers don't return new refresh token
                expires_at: newTokens.expires_at,
                scope: newTokens.scope || currentTokens.scope,
                token_type: newTokens.token_type || 'Bearer'
            })
        }));
        
        return {
            success: true,
            message: 'Token refreshed successfully',
            expiresAt: newTokens.expires_at
        };
        
    } catch (error) {
        console.error('Error refreshing OAuth token:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

async function refreshToken(integrationType, refreshToken) {
    let tokenUrl, tokenParams, headers;
    
    switch (integrationType) {
        case 'hubspot':
            tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
            tokenParams = {
                grant_type: 'refresh_token',
                client_id: process.env.HUBSPOT_CLIENT_ID,
                client_secret: process.env.HUBSPOT_CLIENT_SECRET,
                refresh_token: refreshToken
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        case 'google':
            tokenUrl = 'https://oauth2.googleapis.com/token';
            tokenParams = {
                refresh_token: refreshToken,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                grant_type: 'refresh_token'
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        case 'dropbox':
            tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
            tokenParams = {
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                client_id: process.env.DROPBOX_CLIENT_ID,
                client_secret: process.env.DROPBOX_CLIENT_SECRET
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        case 'box':
            tokenUrl = 'https://api.box.com/oauth2/token';
            tokenParams = {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.BOX_CLIENT_ID,
                client_secret: process.env.BOX_CLIENT_SECRET
            };
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            break;
            
        default:
            throw new Error(`OAuth refresh not configured for ${integrationType}`);
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