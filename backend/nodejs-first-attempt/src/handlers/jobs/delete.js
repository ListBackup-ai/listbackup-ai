const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const JOBS_TABLE = process.env.JOBS_TABLE;
const RUNS_TABLE = process.env.RUNS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Delete job event:', JSON.stringify(event, null, 2));
    
    try {
        const { jobId } = event.pathParameters;
        const { userId, accountId } = event.requestContext.authorizer;
        
        // Get existing job
        const existingResult = await dynamodb.get({
            TableName: JOBS_TABLE,
            Key: { jobId }
        }).promise();
        
        if (!existingResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Job not found' })
            };
        }
        
        // Verify job belongs to user's account
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
        
        const job = existingResult.Item;
        
        // Check for active runs
        const activeRunsResult = await dynamodb.query({
            TableName: RUNS_TABLE,
            IndexName: 'JobIndex',
            KeyConditionExpression: 'jobId = :jobId',
            FilterExpression: '#status IN (:running, :pending)',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':jobId': jobId,
                ':running': 'running',
                ':pending': 'pending'
            }
        }).promise();
        
        if (activeRunsResult.Items && activeRunsResult.Items.length > 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Cannot delete job with active runs',
                    activeRuns: activeRunsResult.Items.length
                })
            };
        }
        
        // Optional: Archive runs instead of deleting them
        // For now, we'll just delete the job and leave runs as historical data
        
        // Delete job
        await dynamodb.delete({
            TableName: JOBS_TABLE,
            Key: { jobId }
        }).promise();
        
        // Log activity
        const activity = {
            activityId: `activity:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId,
            userId,
            type: 'job.deleted',
            resourceId: jobId,
            resourceType: 'job',
            message: `Deleted backup job: ${job.name}`,
            metadata: {
                jobName: job.name,
                sourceId: job.sourceId,
                runCount: job.runCount || 0
            },
            timestamp: new Date().toISOString()
        };
        
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }).promise();
        
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };
        
    } catch (error) {
        console.error('Error deleting job:', error);
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