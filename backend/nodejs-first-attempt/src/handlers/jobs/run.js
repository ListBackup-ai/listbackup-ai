const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const JOBS_TABLE = process.env.JOBS_TABLE;
const RUNS_TABLE = process.env.RUNS_TABLE;
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Run job event:', JSON.stringify(event, null, 2));
    
    try {
        const { jobId } = event.pathParameters;
        const { userId, accountId } = event.requestContext.authorizer;
        
        // Get job
        const jobResult = await dynamodb.get({
            TableName: JOBS_TABLE,
            Key: { jobId }
        }).promise();
        
        if (!jobResult.Item) {
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
        if (jobResult.Item.accountId !== accountId) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Access denied' })
            };
        }
        
        const job = jobResult.Item;
        
        // Check if job is active
        if (job.status !== 'active') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Job must be active to run' })
            };
        }
        
        // Check for existing running job
        const existingRunsResult = await dynamodb.query({
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
        
        if (existingRunsResult.Items && existingRunsResult.Items.length > 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Job is already running',
                    existingRun: existingRunsResult.Items[0].runId
                })
            };
        }
        
        const runId = `run:${uuidv4()}`;
        const timestamp = new Date().toISOString();
        
        // Create job run
        const jobRun = {
            runId,
            jobId,
            accountId,
            status: 'pending',
            startedAt: timestamp,
            finishedAt: null,
            duration: null,
            recordsProcessed: 0,
            filesProcessed: 0,
            bytesProcessed: 0,
            error: null,
            logs: [],
            metadata: {
                triggeredBy: userId,
                manual: true
            },
            createdAt: timestamp,
            updatedAt: timestamp
        };
        
        await dynamodb.put({
            TableName: RUNS_TABLE,
            Item: jobRun
        }).promise();
        
        // Update job with last run info and increment run count
        const updateResult = await dynamodb.update({
            TableName: JOBS_TABLE,
            Key: { jobId },
            UpdateExpression: 'SET lastRun = :lastRun, runCount = runCount + :increment, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':lastRun': {
                    runId,
                    startedAt: timestamp,
                    status: 'pending'
                },
                ':increment': 1,
                ':updatedAt': timestamp
            },
            ReturnValues: 'ALL_NEW'
        }).promise();
        
        // Log activity
        const activity = {
            activityId: `activity:${uuidv4()}`,
            accountId,
            userId,
            type: 'job.run.started',
            resourceId: runId,
            resourceType: 'run',
            message: `Started backup job run: ${job.name}`,
            metadata: {
                jobId,
                jobName: job.name,
                runId,
                manual: true
            },
            timestamp
        };
        
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }).promise();
        
        // Simulate async job processing
        setTimeout(async () => {
            try {
                await simulateJobExecution(runId, jobId, accountId, userId);
            } catch (error) {
                console.error('Error in simulated job execution:', error);
            }
        }, 1000);
        
        return {
            statusCode: 202,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Job run started',
                runId,
                jobId,
                status: 'pending'
            })
        };
        
    } catch (error) {
        console.error('Error running job:', error);
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

async function simulateJobExecution(runId, jobId, accountId, userId) {
    try {
        // Update run to running status
        await dynamodb.update({
            TableName: RUNS_TABLE,
            Key: { runId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'running',
                ':updatedAt': new Date().toISOString()
            }
        }).promise();
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 10000));
        
        // Simulate completion
        const finishedAt = new Date().toISOString();
        const startTime = new Date(Date.now() - 15000); // Approximate start time
        const duration = Date.now() - startTime.getTime();
        
        const success = Math.random() > 0.1; // 90% success rate
        const recordsProcessed = success ? Math.floor(Math.random() * 5000) + 100 : 0;
        const filesProcessed = success ? Math.floor(Math.random() * 100) + 1 : 0;
        const bytesProcessed = success ? Math.floor(Math.random() * 1000000000) + 1000000 : 0;
        
        // Update run with results
        const updateExpression = success 
            ? 'SET #status = :status, finishedAt = :finishedAt, duration = :duration, recordsProcessed = :recordsProcessed, filesProcessed = :filesProcessed, bytesProcessed = :bytesProcessed, updatedAt = :updatedAt'
            : 'SET #status = :status, finishedAt = :finishedAt, duration = :duration, error = :error, updatedAt = :updatedAt';
            
        const expressionAttributeValues = {
            ':status': success ? 'completed' : 'failed',
            ':finishedAt': finishedAt,
            ':duration': duration,
            ':updatedAt': new Date().toISOString()
        };
        
        if (success) {
            expressionAttributeValues[':recordsProcessed'] = recordsProcessed;
            expressionAttributeValues[':filesProcessed'] = filesProcessed;
            expressionAttributeValues[':bytesProcessed'] = bytesProcessed;
        } else {
            expressionAttributeValues[':error'] = 'Simulated failure: Connection timeout';
        }
        
        await dynamodb.update({
            TableName: RUNS_TABLE,
            Key: { runId },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: expressionAttributeValues
        }).promise();
        
        // Log completion activity
        const activity = {
            activityId: `activity:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId,
            userId,
            type: success ? 'job.run.completed' : 'job.run.failed',
            resourceId: runId,
            resourceType: 'run',
            message: `Backup job run ${success ? 'completed' : 'failed'}`,
            metadata: {
                jobId,
                runId,
                duration,
                recordsProcessed,
                filesProcessed,
                bytesProcessed,
                success
            },
            timestamp: finishedAt
        };
        
        await dynamodb.put({
            TableName: ACTIVITY_TABLE,
            Item: activity
        }).promise();
        
    } catch (error) {
        console.error('Error in simulated job execution:', error);
        
        // Mark run as failed
        await dynamodb.update({
            TableName: RUNS_TABLE,
            Key: { runId },
            UpdateExpression: 'SET #status = :status, error = :error, finishedAt = :finishedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'failed',
                ':error': `Execution error: ${error.message}`,
                ':finishedAt': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
            }
        }).promise();
    }
}