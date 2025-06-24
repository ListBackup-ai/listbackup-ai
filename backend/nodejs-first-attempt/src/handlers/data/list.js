const { GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');

const FILES_TABLE = process.env.FILES_TABLE;
const SOURCES_TABLE = process.env.SOURCES_TABLE;

exports.handler = async (event) => {
    console.log('List files event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = event.requestContext.authorizer;
        const queryParams = event.queryStringParameters || {};
        
        const {
            sourceId,
            limit = '50',
            lastKey,
            fileType,
            dateFrom,
            dateTo
        } = queryParams;
        
        let result;
        
        if (sourceId) {
            // List files for specific source
            // First verify source belongs to account
            const sourceResult = await dynamodb.get({
                TableName: SOURCES_TABLE,
                Key: { sourceId }
            }).promise();
            
            if (!sourceResult.Item || sourceResult.Item.accountId !== accountId) {
                return {
                    statusCode: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Access denied to source' })
                };
            }
            
            const queryParams = {
                TableName: FILES_TABLE,
                IndexName: 'SourceIndex',
                KeyConditionExpression: 'sourceId = :sourceId',
                ExpressionAttributeValues: {
                    ':sourceId': sourceId
                },
                Limit: parseInt(limit),
                ScanIndexForward: false // Most recent first
            };
            
            if (lastKey) {
                queryParams.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
            }
            
            // Add filters
            const filterExpressions = [];
            if (fileType) {
                filterExpressions.push('fileType = :fileType');
                queryParams.ExpressionAttributeValues[':fileType'] = fileType;
            }
            
            if (dateFrom) {
                filterExpressions.push('createdAt >= :dateFrom');
                queryParams.ExpressionAttributeValues[':dateFrom'] = dateFrom;
            }
            
            if (dateTo) {
                filterExpressions.push('createdAt <= :dateTo');
                queryParams.ExpressionAttributeValues[':dateTo'] = dateTo;
            }
            
            if (filterExpressions.length > 0) {
                queryParams.FilterExpression = filterExpressions.join(' AND ');
            }
            
            result = await dynamodb.query(queryParams).promise();
            
        } else {
            // List files for entire account
            const queryParams = {
                TableName: FILES_TABLE,
                IndexName: 'AccountIndex',
                KeyConditionExpression: 'accountId = :accountId',
                ExpressionAttributeValues: {
                    ':accountId': accountId
                },
                Limit: parseInt(limit),
                ScanIndexForward: false // Most recent first
            };
            
            if (lastKey) {
                queryParams.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
            }
            
            // Add filters
            const filterExpressions = [];
            if (fileType) {
                filterExpressions.push('fileType = :fileType');
                queryParams.ExpressionAttributeValues[':fileType'] = fileType;
            }
            
            if (dateFrom) {
                filterExpressions.push('createdAt >= :dateFrom');
                queryParams.ExpressionAttributeValues[':dateFrom'] = dateFrom;
            }
            
            if (dateTo) {
                filterExpressions.push('createdAt <= :dateTo');
                queryParams.ExpressionAttributeValues[':dateTo'] = dateTo;
            }
            
            if (filterExpressions.length > 0) {
                queryParams.FilterExpression = filterExpressions.join(' AND ');
            }
            
            result = await dynamodb.query(queryParams).promise();
        }
        
        // Format response
        const response = {
            files: result.Items || [],
            count: result.Items ? result.Items.length : 0,
            lastKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
            hasMore: !!result.LastEvaluatedKey
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        console.error('Error listing files:', error);
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