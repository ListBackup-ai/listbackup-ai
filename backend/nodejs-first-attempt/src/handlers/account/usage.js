const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const RUNS_TABLE = process.env.RUNS_TABLE;
const FILES_TABLE = process.env.FILES_TABLE;

exports.handler = async (event) => {
    console.log('Get account usage event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = event.requestContext.authorizer;
        const queryParams = event.queryStringParameters || {};
        const { period = 'month', detail = 'summary' } = queryParams;
        
        // Get current account to check limits
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId }
        }).promise();
        
        if (!accountResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Account not found' })
            };
        }
        
        const account = accountResult.Item;
        
        // Calculate date ranges based on period
        const now = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                startDate = weekStart;
                endDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
        }
        
        const startDateISO = startDate.toISOString();
        const endDateISO = endDate.toISOString();
        
        // Get storage usage from files
        const storageUsage = await calculateStorageUsage(accountId, startDateISO, endDateISO);
        
        // Get job run statistics
        const jobRunStats = await calculateJobRunStats(accountId, startDateISO, endDateISO);
        
        // Calculate API usage (mock for now)
        const apiUsage = await calculateApiUsage(accountId, startDateISO, endDateISO);
        
        // Set default limits for new users
        const defaultLimits = {
            storage: 1024 * 1024 * 1024 * 5, // 5GB default
            apiCalls: 10000, // 10k API calls default
        };
        
        const storageLimit = account.limits?.storage || defaultLimits.storage;
        const apiCallsLimit = account.limits?.apiCalls || defaultLimits.apiCalls;
        
        // Build usage response
        const usage = {
            period: period,
            startDate: startDateISO,
            endDate: endDateISO,
            storage: {
                total: storageUsage.totalBytes,
                totalFormatted: formatBytes(storageUsage.totalBytes),
                limit: storageLimit,
                limitFormatted: formatBytes(storageLimit),
                percentage: storageLimit > 0 ? 
                    Math.round((storageUsage.totalBytes / storageLimit) * 100) : 0,
                filesCount: storageUsage.filesCount,
                details: detail === 'detailed' ? storageUsage.bySource : undefined
            },
            jobs: {
                runsCount: jobRunStats.totalRuns,
                successfulRuns: jobRunStats.successfulRuns,
                failedRuns: jobRunStats.failedRuns,
                successRate: jobRunStats.totalRuns > 0 ? 
                    Math.round((jobRunStats.successfulRuns / jobRunStats.totalRuns) * 100) : 0,
                recordsProcessed: jobRunStats.recordsProcessed,
                details: detail === 'detailed' ? jobRunStats.byJob : undefined
            },
            api: {
                callsCount: apiUsage.totalCalls,
                limit: apiCallsLimit,
                percentage: apiCallsLimit > 0 ? 
                    Math.round((apiUsage.totalCalls / apiCallsLimit) * 100) : 0,
                details: detail === 'detailed' ? apiUsage.byEndpoint : undefined
            },
            billing: {
                plan: account.plan || 'free',
                status: account.billing?.status || 'free'
            }
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(usage)
        };
        
    } catch (error) {
        console.error('Error getting account usage:', error);
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

async function calculateStorageUsage(accountId, startDate, endDate) {
    // Return empty data for new users if table doesn't exist or has no data
    if (!FILES_TABLE) {
        console.log('FILES_TABLE not configured, returning empty storage data');
        return {
            totalBytes: 0,
            filesCount: 0,
            bySource: []
        };
    }
    
    const params = {
        TableName: FILES_TABLE,
        IndexName: 'AccountIndex',
        KeyConditionExpression: 'accountId = :accountId',
        FilterExpression: 'createdAt BETWEEN :startDate AND :endDate',
        ExpressionAttributeValues: {
            ':accountId': accountId,
            ':startDate': startDate,
            ':endDate': endDate
        }
    };
    
    let totalBytes = 0;
    let filesCount = 0;
    const bySource = {};
    
    try {
        const result = await dynamodb.query(params).promise();
        
        (result.Items || []).forEach(file => {
            const fileSize = file.fileSize || 0;
            totalBytes += fileSize;
            filesCount++;
            
            // Group by source
            const sourceId = file.sourceId || 'unknown';
            if (!bySource[sourceId]) {
                bySource[sourceId] = {
                    sourceId,
                    sourceName: file.sourceName || 'Unknown Source',
                    totalBytes: 0,
                    filesCount: 0
                };
            }
            bySource[sourceId].totalBytes += fileSize;
            bySource[sourceId].filesCount++;
        });
        
    } catch (error) {
        console.error('Error calculating storage usage:', error);
        // Return default values for new users instead of throwing
        if (error.code === 'ResourceNotFoundException' || error.code === 'ValidationException') {
            console.log('Table or index not found, returning default values for new user');
            return {
                totalBytes: 0,
                filesCount: 0,
                bySource: []
            };
        }
    }
    
    return {
        totalBytes,
        filesCount,
        bySource: Object.values(bySource)
    };
}

async function calculateJobRunStats(accountId, startDate, endDate) {
    // Return empty data for new users if table doesn't exist or has no data
    if (!RUNS_TABLE) {
        console.log('RUNS_TABLE not configured, returning empty job stats');
        return {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            recordsProcessed: 0,
            byJob: []
        };
    }
    
    const params = {
        TableName: RUNS_TABLE,
        IndexName: 'AccountIndex',
        KeyConditionExpression: 'accountId = :accountId',
        FilterExpression: 'startedAt BETWEEN :startDate AND :endDate',
        ExpressionAttributeValues: {
            ':accountId': accountId,
            ':startDate': startDate,
            ':endDate': endDate
        }
    };
    
    let totalRuns = 0;
    let successfulRuns = 0;
    let failedRuns = 0;
    let recordsProcessed = 0;
    const byJob = {};
    
    try {
        const result = await dynamodb.query(params).promise();
        
        (result.Items || []).forEach(run => {
            totalRuns++;
            recordsProcessed += run.recordsProcessed || 0;
            
            if (run.status === 'completed') {
                successfulRuns++;
            } else if (run.status === 'failed') {
                failedRuns++;
            }
            
            // Group by job
            const jobId = run.jobId || 'unknown';
            if (!byJob[jobId]) {
                byJob[jobId] = {
                    jobId,
                    jobName: run.jobName || 'Unknown Job',
                    runsCount: 0,
                    successfulRuns: 0,
                    failedRuns: 0,
                    recordsProcessed: 0
                };
            }
            byJob[jobId].runsCount++;
            byJob[jobId].recordsProcessed += run.recordsProcessed || 0;
            
            if (run.status === 'completed') {
                byJob[jobId].successfulRuns++;
            } else if (run.status === 'failed') {
                byJob[jobId].failedRuns++;
            }
        });
        
    } catch (error) {
        console.error('Error calculating job run stats:', error);
        // Return default values for new users instead of throwing
        if (error.code === 'ResourceNotFoundException' || error.code === 'ValidationException') {
            console.log('Table or index not found, returning default values for new user');
            return {
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                recordsProcessed: 0,
                byJob: []
            };
        }
    }
    
    return {
        totalRuns,
        successfulRuns,
        failedRuns,
        recordsProcessed,
        byJob: Object.values(byJob)
    };
}

async function calculateApiUsage(accountId, startDate, endDate) {
    // Mock API usage calculation
    // In a real implementation, this would query API logs or usage tracking
    const mockUsage = {
        totalCalls: Math.floor(Math.random() * 500) + 100,
        byEndpoint: [
            { endpoint: '/sources', calls: Math.floor(Math.random() * 100) + 10 },
            { endpoint: '/jobs', calls: Math.floor(Math.random() * 100) + 10 },
            { endpoint: '/data/files', calls: Math.floor(Math.random() * 200) + 20 },
            { endpoint: '/account', calls: Math.floor(Math.random() * 50) + 5 }
        ]
    };
    
    return mockUsage;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}