const { GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { dynamodb, s3 } = require('../../utils/aws-clients');

// Import connectors
const KeapConnector = require('../../connectors/keap-connector');
const StripeConnector = require('../../connectors/stripe-connector');
const GoHighLevelConnector = require('../../connectors/gohighlevel-connector');
const ActiveCampaignConnector = require('../../connectors/activecampaign-connector');
const MailchimpConnector = require('../../connectors/mailchimp-connector');
const ZendeskConnector = require('../../connectors/zendesk-connector');
const ShopifyConnector = require('../../connectors/shopify-connector');
const HubSpotConnector = require('../../connectors/hubspot-connector');
const { AVAILABLE_INTEGRATIONS } = require('../../config/available-integrations');

const SOURCES_TABLE = process.env.SOURCES_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;
const BACKUP_BUCKET = process.env.BACKUP_BUCKET;

exports.handler = async (event) => {
    console.log('Sync source event:', JSON.stringify(event, null, 2));
    
    try {
        let { sourceId } = event.pathParameters;
        
        // Extract auth context - HTTP API passes differently
        let userId, accountId;
        if (event.requestContext.authorizer && event.requestContext.authorizer.lambda) {
            userId = event.requestContext.authorizer.lambda.userId;
            accountId = event.requestContext.authorizer.lambda.accountId;
        } else if (event.requestContext.authorizer) {
            userId = event.requestContext.authorizer.userId;
            accountId = event.requestContext.authorizer.accountId;
        } else {
            // Fallback - extract from JWT token manually
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (authHeader) {
                const token = authHeader.replace(/^Bearer\s+/i, '');
                try {
                    const jwt = require('jsonwebtoken');
                    
                    // Decode token to get user ID
                    const decodedToken = jwt.decode(token);
                    if (decodedToken && decodedToken.sub) {
                        userId = `user:${decodedToken.sub}`;
                        accountId = `account:${decodedToken.sub}`;
                    } else {
                        throw new Error('Unable to extract user ID from token');
                    }
                } catch (error) {
                    console.error('Token decode error:', error);
                    throw new Error('Invalid authorization token');
                }
            } else {
                throw new Error('No authorization context found');
            }
        }
        
        // Ensure sourceId has the 'source:' prefix
        if (!sourceId.startsWith('source:')) {
            sourceId = `source:${sourceId}`;
        }
        
        // Get source
        const sourceResult = await dynamodb.send(new GetCommand({
            TableName: SOURCES_TABLE,
            Key: { sourceId }
        }));
        
        if (!sourceResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Source not found' })
            };
        }
        
        // Verify source belongs to user's account
        if (sourceResult.Item.accountId !== accountId) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Access denied' })
            };
        }
        
        const source = sourceResult.Item;
        
        // Check if source is active
        if (source.status !== 'active') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Source must be active to sync' })
            };
        }
        
        // Create sync job instead of performing sync directly
        const { v4: uuidv4 } = require('uuid');
        const jobId = `sync:${uuidv4()}`;
        const timestamp = Date.now();
        
        const syncJob = {
            jobId,
            sourceId: source.sourceId,
            accountId: source.accountId,
            sourceType: source.type,
            status: 'pending',
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: userId,
            metadata: {
                sourceName: source.name,
                config: source.config
            }
        };
        
        // Store sync job in DynamoDB
        const SYNC_JOBS_TABLE = process.env.SYNC_JOBS_TABLE || `listbackup-${process.env.STAGE}-sync-jobs`;
        await dynamodb.send(new PutCommand({
            TableName: SYNC_JOBS_TABLE,
            Item: syncJob
        }));
        
        // Log activity for sync job creation
        const activity = {
            eventId: `activity:${uuidv4()}`,
            accountId,
            userId,
            type: 'source.sync.started',
            resourceId: sourceId,
            resourceType: 'source',
            description: `Sync job created for source: ${source.name}`,
            severity: 'info',
            metadata: {
                sourceName: source.name,
                sourceType: source.type,
                jobId: jobId
            },
            timestamp: timestamp
        };
        
        await dynamodb.send(new PutCommand({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }));
        
        return {
            statusCode: 202, // Accepted - processing async
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Sync job created successfully',
                jobId: jobId,
                status: 'pending',
                source: {
                    sourceId: source.sourceId,
                    name: source.name,
                    type: source.type
                }
            })
        };
        
    } catch (error) {
        console.error('Error syncing source:', error);
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

async function performSourceSync(source) {
    try {
        console.log(`Starting sync for source ${source.name} of type ${source.type}`);
        
        // Create connector based on source type
        const connector = createConnector(source.type, source.config);
        if (!connector) {
            throw new Error(`Unsupported source type: ${source.type}`);
        }
        
        // Get available endpoints for this connector
        const availableEndpoints = connector.getAvailableEndpoints();
        const integrationConfig = AVAILABLE_INTEGRATIONS[source.type.toLowerCase()];
        
        if (!integrationConfig) {
            throw new Error(`No integration configuration found for ${source.type}`);
        }
        
        // Sync data from all endpoints
        const syncResults = await connector.syncData(availableEndpoints);
        
        // Store data to S3
        const s3Results = await storeDataToS3(source, syncResults);
        
        // Calculate totals
        let totalRecords = 0;
        let totalFiles = 0;
        const endpointDetails = {};
        
        Object.keys(syncResults).forEach(endpointName => {
            const result = syncResults[endpointName];
            if (result.success) {
                totalRecords += result.count || 0;
                totalFiles += 1;
            }
            endpointDetails[endpointName] = {
                success: result.success,
                count: result.count || 0,
                error: result.error || null
            };
        });
        
        return {
            success: true,
            message: `Successfully synced ${totalRecords} records from ${totalFiles} endpoints`,
            recordsProcessed: totalRecords,
            filesProcessed: totalFiles,
            details: {
                timestamp: new Date().toISOString(),
                sourceId: source.sourceId,
                sourceType: source.type,
                endpoints: endpointDetails,
                s3Location: s3Results.location
            }
        };
        
    } catch (error) {
        console.error(`Error syncing source ${source.sourceId}:`, error);
        return {
            success: false,
            error: error.message,
            recordsProcessed: 0,
            filesProcessed: 0,
            details: {
                timestamp: new Date().toISOString(),
                sourceId: source.sourceId,
                sourceType: source.type
            }
        };
    }
}

function createConnector(sourceType, config) {
    switch (sourceType.toLowerCase()) {
        case 'keap':
            return new KeapConnector(config);
        case 'stripe':
            return new StripeConnector(config);
        case 'gohighlevel':
            return new GoHighLevelConnector(config);
        case 'activecampaign':
            return new ActiveCampaignConnector(config);
        case 'mailchimp':
            return new MailchimpConnector(config);
        case 'zendesk':
            return new ZendeskConnector(config);
        case 'shopify':
            return new ShopifyConnector(config);
        case 'hubspot':
            return new HubSpotConnector(config);
        
        default:
            console.log(`No connector available for source type: ${sourceType}`);
            return null;
    }
}

async function storeDataToS3(source, syncResults) {
    const timestamp = new Date().toISOString();
    const s3Prefix = `sources/${source.accountId}/${source.sourceId}/${timestamp}`;
    const uploadPromises = [];
    
    for (const [endpointName, result] of Object.entries(syncResults)) {
        if (result.success && result.data && result.data.length > 0) {
            const s3Key = `${s3Prefix}/${endpointName}.json`;
            
            const uploadPromise = s3.send(new PutObjectCommand({
                Bucket: BACKUP_BUCKET,
                Key: s3Key,
                Body: JSON.stringify(result.data, null, 2),
                ContentType: 'application/json',
                Metadata: {
                    sourceId: source.sourceId,
                    sourceType: source.type,
                    endpointName: endpointName,
                    recordCount: result.count.toString(),
                    syncTimestamp: timestamp
                }
            }));
            
            uploadPromises.push(uploadPromise);
        }
    }
    
    await Promise.all(uploadPromises);
    
    return {
        location: `s3://${BACKUP_BUCKET}/${s3Prefix}`,
        files: uploadPromises.length
    };
}

