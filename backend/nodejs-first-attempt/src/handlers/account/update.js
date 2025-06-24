const { GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Update account event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = event.requestContext.authorizer;
        const body = JSON.parse(event.body || '{}');
        
        // Get existing account
        const existingResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();
        
        if (!existingResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Account not found' })
            };
        }
        
        // Prepare update expression for allowed fields
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        
        const updatableFields = ['name', 'settings'];
        const updatedFields = [];
        
        updatableFields.forEach(field => {
            if (body[field] !== undefined) {
                updateExpression.push(`#${field} = :${field}`);
                expressionAttributeNames[`#${field}`] = field;
                expressionAttributeValues[`:${field}`] = body[field];
                updatedFields.push(field);
            }
        });
        
        // Handle nested settings updates
        if (body.settings) {
            const existingSettings = existingResult.Item.settings || {};
            const newSettings = { ...existingSettings, ...body.settings };
            
            // Validate settings structure
            if (newSettings.timezone && typeof newSettings.timezone !== 'string') {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Invalid timezone format' })
                };
            }
            
            expressionAttributeValues[':settings'] = newSettings;
        }
        
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
        
        // Update account
        const result = await dynamodb.update({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId },
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
            type: 'account.updated',
            resourceId: accountId,
            resourceType: 'account',
            message: 'Account settings updated',
            metadata: {
                updatedFields: updatedFields,
                accountName: result.Attributes.name
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
        console.error('Error updating account:', error);
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