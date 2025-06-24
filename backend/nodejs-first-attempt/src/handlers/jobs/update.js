const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const JOBS_TABLE = process.env.JOBS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Update job event:', JSON.stringify(event, null, 2));
    
    try {
        const { jobId } = event.pathParameters;
        const { userId, accountId } = event.requestContext.authorizer;
        const body = JSON.parse(event.body || '{}');
        
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
        
        // Prepare update expression
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        
        const updatableFields = ['name', 'description', 'schedule', 'config', 'status'];
        updatableFields.forEach(field => {
            if (body[field] !== undefined) {
                updateExpression.push(`#${field} = :${field}`);
                expressionAttributeNames[`#${field}`] = field;
                expressionAttributeValues[`:${field}`] = body[field];
            }
        });
        
        if (updateExpression.length === 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'No valid fields to update' })
            };
        }
        
        // Add updatedAt timestamp
        updateExpression.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        
        // Update nextRun if schedule changed
        if (body.schedule) {
            updateExpression.push('#nextRun = :nextRun');
            expressionAttributeNames['#nextRun'] = 'nextRun';
            expressionAttributeValues[':nextRun'] = calculateNextRun(body.schedule);
        }
        
        // Update job
        const result = await dynamodb.update({
            TableName: JOBS_TABLE,
            Key: { jobId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        }).promise();
        
        // Log activity
        const activity = {
            activityId: `activity:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId,
            userId,
            type: 'job.updated',
            resourceId: jobId,
            resourceType: 'job',
            message: `Updated backup job: ${result.Attributes.name}`,
            metadata: {
                updatedFields: Object.keys(body),
                jobName: result.Attributes.name
            },
            timestamp: new Date().toISOString()
        };
        
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result.Attributes)
        };
        
    } catch (error) {
        console.error('Error updating job:', error);
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