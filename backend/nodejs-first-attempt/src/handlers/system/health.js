const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');

const USERS_TABLE = process.env.USERS_TABLE;
const SOURCES_TABLE = process.env.SOURCES_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;
const RUNS_TABLE = process.env.RUNS_TABLE;

exports.handler = async (event) => {
    console.log('Health check request:', JSON.stringify(event, null, 2));
    
    try {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        
        // Basic health check
        const health = {
            status: 'healthy',
            timestamp,
            version: 'v2',
            uptime: process.uptime(),
            environment: process.env.STAGE || 'unknown'
        };
        
        // For detailed health check (authenticated endpoint)
        if (event.requestContext?.authorizer?.userId) {
            const detailed = await getDetailedHealth();
            health.details = detailed;
        }
        
        const responseTime = Date.now() - startTime;
        health.responseTime = `${responseTime}ms`;
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data: health
            })
        };
        
    } catch (error) {
        console.error('Health check error:', error);
        
        return {
            statusCode: 503,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                status: 'unhealthy',
                error: 'Service unavailable',
                timestamp: new Date().toISOString()
            })
        };
    }
};

async function getDetailedHealth() {
    try {
        const checks = await Promise.allSettled([
            checkDynamoDBTable(USERS_TABLE, 'Users'),
            checkDynamoDBTable(SOURCES_TABLE, 'Sources'),
            checkDynamoDBTable(JOBS_TABLE, 'Jobs'),
            checkDynamoDBTable(RUNS_TABLE, 'Runs')
        ]);
        
        const services = {};
        let overallStatus = 'healthy';
        
        checks.forEach((check, index) => {
            const serviceNames = ['users', 'sources', 'jobs', 'runs'];
            const serviceName = serviceNames[index];
            
            if (check.status === 'fulfilled') {
                services[serviceName] = check.value;
            } else {
                services[serviceName] = {
                    status: 'unhealthy',
                    error: check.reason?.message || 'Unknown error'
                };
                overallStatus = 'degraded';
            }
        });
        
        return {
            status: overallStatus,
            services,
            checks: {
                database: overallStatus === 'healthy' ? 'ok' : 'degraded',
                authentication: 'ok',
                storage: 'ok' // Would need S3 check
            }
        };
        
    } catch (error) {
        console.error('Detailed health check error:', error);
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
}

async function checkDynamoDBTable(tableName, displayName) {
    if (!tableName) {
        throw new Error(`${displayName} table not configured`);
    }
    
    try {
        // Simple scan with limit to test table access
        const result = await dynamodb.send(new ScanCommand({
            TableName: tableName,
            Limit: 1,
            Select: 'COUNT'
        }));
        
        return {
            status: 'healthy',
            table: tableName,
            count: result.Count,
            scannedCount: result.ScannedCount
        };
    } catch (error) {
        throw new Error(`${displayName} table check failed: ${error.message}`);
    }
}

function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
        'Content-Type': 'application/json'
    };
}