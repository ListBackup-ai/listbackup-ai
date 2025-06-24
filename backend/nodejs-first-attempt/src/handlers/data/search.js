const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const FILES_TABLE = process.env.FILES_TABLE;
const SOURCES_TABLE = process.env.SOURCES_TABLE;

exports.handler = async (event) => {
    console.log('Search files event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = event.requestContext.authorizer;
        const body = JSON.parse(event.body || '{}');
        
        const {
            query,
            filters = {},
            limit = 50,
            lastKey
        } = body;
        
        if (!query || query.trim().length === 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Search query is required' })
            };
        }
        
        // Build scan parameters for searching across files
        const scanParams = {
            TableName: FILES_TABLE,
            FilterExpression: 'accountId = :accountId',
            ExpressionAttributeValues: {
                ':accountId': accountId
            },
            Limit: parseInt(limit)
        };
        
        if (lastKey) {
            scanParams.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
        }
        
        // Add search conditions
        const searchConditions = [];
        const searchQuery = query.toLowerCase();
        
        // Search in filename, path, and content
        searchConditions.push('contains(#fileName, :query)');
        searchConditions.push('contains(#filePath, :query)');
        if (filters.searchContent !== false) {
            searchConditions.push('contains(#content, :query)');
        }
        
        scanParams.FilterExpression += ` AND (${searchConditions.join(' OR ')})`;
        scanParams.ExpressionAttributeNames = {
            '#fileName': 'fileName',
            '#filePath': 'filePath',
            '#content': 'content'
        };
        scanParams.ExpressionAttributeValues[':query'] = searchQuery;
        
        // Add additional filters
        if (filters.sourceId) {
            scanParams.FilterExpression += ' AND sourceId = :sourceId';
            scanParams.ExpressionAttributeValues[':sourceId'] = filters.sourceId;
            
            // Verify source belongs to account
            const sourceResult = await dynamodb.get({
                TableName: SOURCES_TABLE,
                Key: { sourceId: filters.sourceId }
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
        }
        
        if (filters.fileType) {
            scanParams.FilterExpression += ' AND fileType = :fileType';
            scanParams.ExpressionAttributeValues[':fileType'] = filters.fileType;
        }
        
        if (filters.sizeMin) {
            scanParams.FilterExpression += ' AND fileSize >= :sizeMin';
            scanParams.ExpressionAttributeValues[':sizeMin'] = parseInt(filters.sizeMin);
        }
        
        if (filters.sizeMax) {
            scanParams.FilterExpression += ' AND fileSize <= :sizeMax';
            scanParams.ExpressionAttributeValues[':sizeMax'] = parseInt(filters.sizeMax);
        }
        
        if (filters.dateFrom) {
            scanParams.FilterExpression += ' AND createdAt >= :dateFrom';
            scanParams.ExpressionAttributeValues[':dateFrom'] = filters.dateFrom;
        }
        
        if (filters.dateTo) {
            scanParams.FilterExpression += ' AND createdAt <= :dateTo';
            scanParams.ExpressionAttributeValues[':dateTo'] = filters.dateTo;
        }
        
        // Perform search
        const result = await dynamodb.scan(scanParams).promise();
        
        // Sort results by relevance (simple scoring based on match position)
        const scoredResults = (result.Items || []).map(file => {
            let score = 0;
            const fileName = (file.fileName || '').toLowerCase();
            const filePath = (file.filePath || '').toLowerCase();
            const content = (file.content || '').toLowerCase();
            
            // Higher score for matches in filename
            if (fileName.includes(searchQuery)) {
                score += fileName.startsWith(searchQuery) ? 10 : 5;
            }
            
            // Medium score for path matches
            if (filePath.includes(searchQuery)) {
                score += 3;
            }
            
            // Lower score for content matches
            if (content.includes(searchQuery)) {
                score += 1;
            }
            
            return { ...file, _searchScore: score };
        }).sort((a, b) => b._searchScore - a._searchScore);
        
        // Remove search score from final results
        const finalResults = scoredResults.map(file => {
            const { _searchScore, ...cleanFile } = file;
            return cleanFile;
        });
        
        // Format response
        const response = {
            files: finalResults,
            count: finalResults.length,
            query: query,
            filters: filters,
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
        console.error('Error searching files:', error);
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