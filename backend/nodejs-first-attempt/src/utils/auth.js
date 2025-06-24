/**
 * Extract user authentication context from API Gateway event
 * Handles different context formats for HTTP API vs REST API
 */
function extractAuthContext(event) {
    console.log('Auth context extraction - full requestContext:', JSON.stringify(event.requestContext, null, 2));
    
    let userId, accountId;
    
    if (event.requestContext?.authorizer) {
        console.log('Authorizer context:', JSON.stringify(event.requestContext.authorizer, null, 2));
        
        // Try different context formats
        if (event.requestContext.authorizer.lambda) {
            // Lambda authorizer context
            userId = event.requestContext.authorizer.lambda.userId;
            accountId = event.requestContext.authorizer.lambda.accountId;
            console.log('Using lambda context format');
        } else if (event.requestContext.authorizer.principalId) {
            // Principal ID format
            userId = event.requestContext.authorizer.principalId;
            accountId = event.requestContext.authorizer.accountId;
            console.log('Using principalId context format');
        } else {
            // Direct format
            userId = event.requestContext.authorizer.userId;
            accountId = event.requestContext.authorizer.accountId;
            console.log('Using direct context format');
        }
    }
    
    console.log('Extracted auth context - userId:', userId, 'accountId:', accountId);
    return { userId, accountId };
}

module.exports = {
    extractAuthContext
};