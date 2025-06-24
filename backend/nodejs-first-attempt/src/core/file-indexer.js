const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { dynamodb, eventBridge } = require('../utils/aws-clients');

const FILES_TABLE = process.env.FILES_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

exports.handler = async (event) => {
    console.log('File indexer triggered:', JSON.stringify(event, null, 2));
    
    try {
        for (const record of event.Records) {
            if (record.eventName.startsWith('ObjectCreated')) {
                await processNewFile(record.s3);
            }
        }
        
        return { statusCode: 200, body: 'Files indexed successfully' };
    } catch (error) {
        console.error('Error indexing files:', error);
        throw error;
    }
};

async function processNewFile(s3Record) {
    const bucket = s3Record.bucket.name;
    const key = decodeURIComponent(s3Record.object.key.replace(/\+/g, ' '));
    const size = s3Record.object.size;
    
    console.log(`Processing file: s3://${bucket}/${key}`);
    
    // Extract metadata from S3 key structure
    // Expected format: data/{accountId}/{sourceId}/{runId?}/{path}
    const keyParts = key.split('/');
    if (keyParts.length < 4 || keyParts[0] !== 'data') {
        console.log('Skipping file - invalid key structure:', key);
        return;
    }
    
    const [, accountId, sourceId, ...pathParts] = keyParts;
    const filePath = pathParts.join('/');
    const fileName = pathParts[pathParts.length - 1];
    
    const fileId = `${sourceId}:${filePath}`;
    const timestamp = new Date().toISOString();
    
    // Store file metadata in DynamoDB
    const fileRecord = {
        fileId,
        accountId,
        sourceId,
        name: fileName,
        path: filePath,
        type: 'file',
        sizeBytes: size,
        s3Key: key,
        s3Bucket: bucket,
        indexed: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };
    
    await dynamodb.put({
        TableName: FILES_TABLE,
        Item: fileRecord,
        ConditionExpression: 'attribute_not_exists(fileId)'
    }).promise().catch(err => {
        if (err.code !== 'ConditionalCheckFailedException') {
            throw err;
        }
        console.log('File already indexed:', fileId);
    });
    
    // Log activity
    const eventId = `activity:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await dynamodb.put({
        TableName: ACTIVITY_TABLE,
        Item: {
            eventId,
            accountId,
            type: 'file',
            action: 'indexed',
            resource: 'file',
            resourceId: fileId,
            status: 'success',
            message: `File indexed: ${fileName}`,
            metadata: {
                bucket,
                key,
                size,
                sourceId
            },
            timestamp: Date.now(), // Use number format
            ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
        }
    }).promise();
    
    // Publish event
    if (EVENT_BUS_NAME) {
        await eventbridge.putEvents({
            Entries: [{
                Source: 'listbackup.files',
                DetailType: 'File Indexed',
                Detail: JSON.stringify({
                    fileId,
                    accountId,
                    sourceId,
                    fileName,
                    filePath,
                    size,
                    bucket,
                    key
                }),
                EventBusName: EVENT_BUS_NAME
            }]
        }).promise();
    }
    
    console.log(`Successfully indexed file: ${fileId}`);
}