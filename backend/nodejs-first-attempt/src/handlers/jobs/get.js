const AWS = require('aws-sdk');
const { extractAuthContext } = require('../../utils/auth');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const JOBS_TABLE = process.env.JOBS_TABLE;
const SOURCES_TABLE = process.env.SOURCES_TABLE;

exports.handler = async (event) => {
    console.log('Get jobs event:', JSON.stringify(event, null, 2));
    
    try {
        const { jobId } = event.pathParameters || {};
        const { userId, accountId } = extractAuthContext(event);
        
        if (jobId) {
            // Get specific job
            const result = await dynamodb.get({
                TableName: JOBS_TABLE,
                Key: { jobId }
            }).promise();
            
            if (!result.Item) {
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
            if (result.Item.accountId !== accountId) {
                return {
                    statusCode: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Access denied' })
                };
            }
            
            // Get associated source details
            if (result.Item.sourceId) {
                const sourceResult = await dynamodb.get({
                    TableName: SOURCES_TABLE,
                    Key: { sourceId: result.Item.sourceId }
                }).promise();
                
                if (sourceResult.Item) {
                    result.Item.source = sourceResult.Item;
                }
            }
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result.Item)
            };
        } else {
            // List all jobs for account
            const result = await dynamodb.query({
                TableName: JOBS_TABLE,
                IndexName: 'AccountIndex',
                KeyConditionExpression: 'accountId = :accountId',
                ExpressionAttributeValues: {
                    ':accountId': accountId
                }
            }).promise();
            
            // Get source details for each job
            const jobs = await Promise.all(
                (result.Items || []).map(async (job) => {
                    if (job.sourceId) {
                        const sourceResult = await dynamodb.get({
                            TableName: SOURCES_TABLE,
                            Key: { sourceId: job.sourceId }
                        }).promise();
                        
                        if (sourceResult.Item) {
                            job.source = {
                                sourceId: sourceResult.Item.sourceId,
                                name: sourceResult.Item.name,
                                type: sourceResult.Item.type,
                                status: sourceResult.Item.status
                            };
                        }
                    }
                    return job;
                })
            );
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(jobs)
            };
        }
        
    } catch (error) {
        console.error('Error getting jobs:', error);
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