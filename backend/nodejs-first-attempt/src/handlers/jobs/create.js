const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');
const { v4: uuidv4 } = require('uuid');

const JOBS_TABLE = process.env.JOBS_TABLE;
const SOURCES_TABLE = process.env.SOURCES_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Create job event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = event.requestContext.authorizer;
        const body = JSON.parse(event.body || '{}');
        
        // Validate required fields
        const { name, sourceId, schedule, config } = body;
        if (!name || !sourceId || !schedule) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Missing required fields: name, sourceId, schedule' })
            };
        }
        
        // Verify source exists and belongs to account
        const sourceResult = await dynamodb.get({
            TableName: SOURCES_TABLE,
            Key: { sourceId }
        }).promise();
        
        if (!sourceResult.Item) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Source not found' })
            };
        }
        
        if (sourceResult.Item.accountId !== accountId) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Access denied to source' })
            };
        }
        
        const jobId = `job:${uuidv4()}`;
        const timestamp = new Date().toISOString();
        
        const job = {
            jobId,
            accountId,
            sourceId,
            name,
            description: body.description || '',
            schedule,
            config: config || {},
            status: 'inactive',
            lastRun: null,
            nextRun: calculateNextRun(schedule),
            lastError: null,
            runCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: userId
        };
        
        // Create job
        await dynamodb.put({
            TableName: JOBS_TABLE,
            Item: job
        }).promise();
        
        // Log activity
        const activity = {
            activityId: `activity:${uuidv4()}`,
            accountId,
            userId,
            type: 'job.created',
            resourceId: jobId,
            resourceType: 'job',
            message: `Created backup job: ${name}`,
            metadata: {
                jobName: name,
                sourceName: sourceResult.Item.name,
                schedule: schedule
            },
            timestamp
        };
        
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }).promise();
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(job)
        };
        
    } catch (error) {
        console.error('Error creating job:', error);
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

function calculateNextRun(schedule) {
    // Simple next run calculation based on schedule type
    const now = new Date();
    
    switch (schedule.type) {
        case 'daily':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
            return tomorrow.toISOString();
            
        case 'weekly':
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
            return nextWeek.toISOString();
            
        case 'monthly':
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(schedule.day || 1);
            nextMonth.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
            return nextMonth.toISOString();
            
        default:
            // Default to 24 hours from now
            const defaultNext = new Date(now);
            defaultNext.setHours(defaultNext.getHours() + 24);
            return defaultNext.toISOString();
    }
}