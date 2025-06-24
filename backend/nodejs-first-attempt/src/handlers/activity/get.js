const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamodb } = require('../../utils/aws-clients');
const { extractAuthContext } = require('../../utils/auth');

const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE;

exports.handler = async (event) => {
    console.log('Get activity event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const queryParams = event.queryStringParameters || {};
        
        const {
            limit = '50',
            lastKey,
            type,
            resourceType,
            resourceId,
            dateFrom,
            dateTo
        } = queryParams;
        
        // Query activity for account
        const queryParameters = {
            TableName: ACTIVITY_TABLE,
            IndexName: 'AccountTimeIndex',
            KeyConditionExpression: 'accountId = :accountId',
            ExpressionAttributeValues: {
                ':accountId': accountId
            },
            Limit: parseInt(limit),
            ScanIndexForward: false // Most recent first
        };
        
        if (lastKey) {
            queryParameters.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
        }
        
        // Build filter expressions
        const filterExpressions = [];
        
        if (type) {
            filterExpressions.push('#type = :type');
            queryParameters.ExpressionAttributeNames = queryParameters.ExpressionAttributeNames || {};
            queryParameters.ExpressionAttributeNames['#type'] = 'type';
            queryParameters.ExpressionAttributeValues[':type'] = type;
        }
        
        if (resourceType) {
            filterExpressions.push('resourceType = :resourceType');
            queryParameters.ExpressionAttributeValues[':resourceType'] = resourceType;
        }
        
        if (resourceId) {
            filterExpressions.push('resourceId = :resourceId');
            queryParameters.ExpressionAttributeValues[':resourceId'] = resourceId;
        }
        
        if (dateFrom) {
            filterExpressions.push('#timestamp >= :dateFrom');
            queryParameters.ExpressionAttributeNames = queryParameters.ExpressionAttributeNames || {};
            queryParameters.ExpressionAttributeNames['#timestamp'] = 'timestamp';
            queryParameters.ExpressionAttributeValues[':dateFrom'] = dateFrom;
        }
        
        if (dateTo) {
            filterExpressions.push('#timestamp <= :dateTo');
            queryParameters.ExpressionAttributeNames = queryParameters.ExpressionAttributeNames || {};
            queryParameters.ExpressionAttributeNames['#timestamp'] = 'timestamp';
            queryParameters.ExpressionAttributeValues[':dateTo'] = dateTo;
        }
        
        if (filterExpressions.length > 0) {
            queryParameters.FilterExpression = filterExpressions.join(' AND ');
        }
        
        // Execute query
        const result = await dynamodb.send(new QueryCommand(queryParameters));
        
        // Process and enrich activity items
        const activities = (result.Items || []).map(activity => {
            return {
                activityId: activity.activityId,
                type: activity.type,
                message: activity.message,
                timestamp: activity.timestamp,
                resourceId: activity.resourceId,
                resourceType: activity.resourceType,
                metadata: activity.metadata || {},
                userId: activity.userId,
                // Add display properties
                displayType: getDisplayType(activity.type),
                displayIcon: getDisplayIcon(activity.type),
                displayColor: getDisplayColor(activity.type),
                timeAgo: getTimeAgo(activity.timestamp)
            };
        });
        
        // Group activities by date for UI
        const groupedActivities = groupActivitiesByDate(activities);
        
        // Format response
        const response = {
            activities: activities,
            groupedActivities: groupedActivities,
            count: activities.length,
            filters: {
                type,
                resourceType,
                resourceId,
                dateFrom,
                dateTo
            },
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
        console.error('Error getting activity:', error);
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

function getDisplayType(activityType) {
    const typeMap = {
        'source.created': 'Source Created',
        'source.updated': 'Source Updated',
        'source.deleted': 'Source Deleted',
        'source.test.success': 'Source Test Passed',
        'source.test.failed': 'Source Test Failed',
        'source.sync.success': 'Source Sync Completed',
        'source.sync.failed': 'Source Sync Failed',
        'job.created': 'Job Created',
        'job.updated': 'Job Updated',
        'job.deleted': 'Job Deleted',
        'job.run.started': 'Job Run Started',
        'job.run.completed': 'Job Run Completed',
        'job.run.failed': 'Job Run Failed',
        'file.downloaded': 'File Downloaded',
        'account.updated': 'Account Updated'
    };
    
    return typeMap[activityType] || activityType;
}

function getDisplayIcon(activityType) {
    if (activityType.includes('source')) return 'database';
    if (activityType.includes('job')) return 'play';
    if (activityType.includes('file')) return 'file';
    if (activityType.includes('account')) return 'settings';
    return 'activity';
}

function getDisplayColor(activityType) {
    if (activityType.includes('failed') || activityType.includes('deleted')) return 'red';
    if (activityType.includes('success') || activityType.includes('completed') || activityType.includes('created')) return 'green';
    if (activityType.includes('updated') || activityType.includes('started')) return 'blue';
    return 'gray';
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return activityTime.toLocaleDateString();
}

function groupActivitiesByDate(activities) {
    const groups = {};
    
    activities.forEach(activity => {
        const date = new Date(activity.timestamp).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(activity);
    });
    
    // Convert to array format with date labels
    return Object.entries(groups).map(([date, activities]) => ({
        date,
        displayDate: formatDateLabel(date),
        activities
    }));
}

function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}