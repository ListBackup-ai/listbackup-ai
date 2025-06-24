const { AVAILABLE_INTEGRATIONS } = require('../../config/available-integrations');

exports.handler = async (event) => {
    console.log('List integrations event:', JSON.stringify(event, null, 2));
    
    try {
        // Get all available integrations
        const integrations = Object.values(AVAILABLE_INTEGRATIONS).map(integration => {
            // Return only the necessary fields for the frontend
            return {
                id: integration.appIntegrationId,
                title: integration.title,
                company: integration.company,
                description: integration.shortDescription,
                categories: integration.categories,
                logo: integration.logo,
                popularityScore: integration.popularityScore,
                authType: integration.auth_config.type,
                fields: integration.auth_config.fields
            };
        });

        // Sort by popularity score descending
        integrations.sort((a, b) => b.popularityScore - a.popularityScore);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                integrations,
                total: integrations.length
            })
        };
        
    } catch (error) {
        console.error('Error listing integrations:', error);
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