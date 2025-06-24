const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { InvokeCommand } = require('@aws-sdk/client-lambda');
const { dynamodb, lambda } = require('../../../utils/aws-clients');

const SOURCES_TABLE = process.env.SOURCES_TABLE;
const OAUTH_REFRESH_FUNCTION = process.env.OAUTH_REFRESH_FUNCTION;

/**
 * This function is triggered by EventBridge to check and refresh OAuth tokens
 * that are about to expire
 */
exports.handler = async (event) => {
    console.log('OAuth refresh scheduler started');
    
    try {
        // Scan for sources with OAuth authentication
        const scanResult = await dynamodb.send(new ScanCommand({
            TableName: SOURCES_TABLE,
            FilterExpression: '#config.authType = :authType AND #status = :status',
            ExpressionAttributeNames: {
                '#config': 'config',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':authType': 'oauth2',
                ':status': 'active'
            }
        }));
        
        const sources = scanResult.Items || [];
        console.log(`Found ${sources.length} OAuth sources to check`);
        
        // Process each source
        const refreshPromises = sources.map(async (source) => {
            try {
                // Invoke the refresh function for each source
                const invokeResult = await lambda.send(new InvokeCommand({
                    FunctionName: OAUTH_REFRESH_FUNCTION,
                    InvocationType: 'Event', // Async invocation
                    Payload: JSON.stringify({
                        sourceId: source.sourceId
                    })
                }));
                
                console.log(`Triggered refresh for source ${source.sourceId}`);
                return {
                    sourceId: source.sourceId,
                    success: true
                };
            } catch (error) {
                console.error(`Error triggering refresh for source ${source.sourceId}:`, error);
                return {
                    sourceId: source.sourceId,
                    success: false,
                    error: error.message
                };
            }
        });
        
        const results = await Promise.all(refreshPromises);
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        console.log(`OAuth refresh scheduler completed: ${successCount} succeeded, ${failureCount} failed`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'OAuth refresh scheduler completed',
                processed: sources.length,
                succeeded: successCount,
                failed: failureCount,
                results
            })
        };
        
    } catch (error) {
        console.error('Error in OAuth refresh scheduler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};