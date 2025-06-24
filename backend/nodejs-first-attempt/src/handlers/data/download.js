const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const FILES_TABLE = process.env.FILES_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Download file event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = event.requestContext.authorizer;
        const body = JSON.parse(event.body || '{}');
        
        const { fileId, downloadType = 'url' } = body;
        
        if (!fileId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'File ID is required' })
            };
        }
        
        // Get file metadata
        const fileResult = await dynamodb.get({
            TableName: FILES_TABLE,
            Key: { fileId }
        }).promise();
        
        if (!fileResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'File not found' })
            };
        }
        
        const file = fileResult.Item;
        
        // Verify file belongs to user's account
        if (file.accountId !== accountId) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Access denied' })
            };
        }
        
        let response;
        
        if (downloadType === 'url') {
            // Generate presigned URL for download
            const downloadUrl = await generatePresignedUrl(file);
            
            response = {
                fileId: file.fileId,
                fileName: file.fileName,
                fileSize: file.fileSize,
                downloadUrl: downloadUrl,
                expiresIn: 3600, // 1 hour
                downloadType: 'url'
            };
            
        } else if (downloadType === 'direct') {
            // Direct download (for smaller files)
            if (file.fileSize > 50 * 1024 * 1024) { // 50MB limit
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        error: 'File too large for direct download. Use URL download instead.',
                        maxSize: '50MB'
                    })
                };
            }
            
            try {
                const s3Object = await s3.getObject({
                    Bucket: S3_BUCKET,
                    Key: file.s3Key
                }).promise();
                
                response = {
                    fileId: file.fileId,
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    content: s3Object.Body.toString('base64'),
                    contentType: file.contentType || 'application/octet-stream',
                    downloadType: 'direct'
                };
                
            } catch (s3Error) {
                console.error('S3 download error:', s3Error);
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'File not available for download' })
                };
            }
            
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Invalid download type. Use "url" or "direct"'
                })
            };
        }
        
        // Log download activity
        const activity = {
            activityId: `activity:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId,
            userId,
            type: 'file.downloaded',
            resourceId: fileId,
            resourceType: 'file',
            message: `Downloaded file: ${file.fileName}`,
            metadata: {
                fileName: file.fileName,
                fileSize: file.fileSize,
                downloadType: downloadType,
                sourceId: file.sourceId
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
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        console.error('Error downloading file:', error);
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

async function generatePresignedUrl(file) {
    const params = {
        Bucket: S3_BUCKET,
        Key: file.s3Key,
        Expires: 3600, // 1 hour
        ResponseContentDisposition: `attachment; filename="${file.fileName}"`,
        ResponseContentType: file.contentType || 'application/octet-stream'
    };
    
    return s3.getSignedUrl('getObject', params);
}