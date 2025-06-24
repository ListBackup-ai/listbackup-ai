const { GetCommand, QueryCommand, DeleteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');

const SOURCES_TABLE = process.env.SOURCES_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Delete source event:', JSON.stringify(event, null, 2));
    
    try {
        let { sourceId } = event.pathParameters;
        const { userId, accountId } = event.requestContext.authorizer;
        
        // Ensure sourceId has the 'source:' prefix
        if (!sourceId.startsWith('source:')) {
            sourceId = `source:${sourceId}`;
        }
        
        // Get existing source
        const existingResult = await dynamodb.send(new GetCommand({
            TableName: SOURCES_TABLE,
            Key: { sourceId }
        }));
        
        if (!existingResult.Item) {
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
        if (existingResult.Item.accountId !== accountId) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Access denied' })
            };
        }
        
        // Check for associated jobs
        const jobsResult = await dynamodb.send(new QueryCommand({
            TableName: JOBS_TABLE,
            IndexName: 'SourceIndex',
            KeyConditionExpression: 'sourceId = :sourceId',
            ExpressionAttributeValues: {
                ':sourceId': sourceId
            }
        }));
        
        if (jobsResult.Items && jobsResult.Items.length > 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Cannot delete source with associated jobs',
                    jobCount: jobsResult.Items.length
                })
            };
        }
        
        // Delete source
        await dynamodb.send(new DeleteCommand({
            TableName: SOURCES_TABLE,
            Key: { sourceId }
        }));
        
        // Log activity
        const activity = {
            eventId: `activity:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId,
            userId,
            type: 'source.deleted',
            resourceId: sourceId,
            resourceType: 'source',
            message: `Deleted source: ${existingResult.Item.name}`,
            metadata: {
                sourceName: existingResult.Item.name,
                sourceType: existingResult.Item.type
            },
            timestamp: Date.now() // Use number format
        };
        
        await dynamodb.send(new PutCommand({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }));
        
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };
        
    } catch (error) {
        console.error('Error deleting source:', error);
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