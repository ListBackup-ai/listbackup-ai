const { GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');

const SOURCES_TABLE = process.env.SOURCES_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Update source event:', JSON.stringify(event, null, 2));
    
    try {
        let { sourceId } = event.pathParameters;
        const { userId, accountId } = event.requestContext.authorizer;
        const body = JSON.parse(event.body || '{}');
        
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
        
        // Prepare update expression
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        
        const updatableFields = ['name', 'config', 'status'];
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
        
        // Update source
        const result = await dynamodb.send(new UpdateCommand({
            TableName: SOURCES_TABLE,
            Key: { sourceId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        }));
        
        // Log activity
        const activity = {
            activityId: `activity:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId,
            userId,
            type: 'source.updated',
            resourceId: sourceId,
            resourceType: 'source',
            message: `Updated source: ${result.Attributes.name}`,
            metadata: {
                updatedFields: Object.keys(body),
                sourceName: result.Attributes.name
            },
            timestamp: new Date().toISOString()
        };
        
        await dynamodb.send(new PutCommand({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result.Attributes)
        };
        
    } catch (error) {
        console.error('Error updating source:', error);
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