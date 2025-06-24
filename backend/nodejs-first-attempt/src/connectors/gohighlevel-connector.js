/**
 * GoHighLevel (GHL) Data Connector
 * Implements data extraction from GoHighLevel API
 */

const BaseConnector = require('./base-connector');

class GoHighLevelConnector extends BaseConnector {
    constructor(config) {
        const { api_key, location_id } = config;
        
        super({
            ...config,
            baseUrl: 'https://services.leadconnectorhq.com',
            auth: {
                type: 'api_key',
                authorization_type: 'Bearer',
                api_key: api_key
            }
        });
        
        this.locationId = location_id;
        this.rateLimitDelay = 200; // GHL allows higher rate limits
    }

    getTestEndpoint() {
        return `https://services.leadconnectorhq.com/locations/${this.locationId}`;
    }

    getAvailableEndpoints() {
        return [
            {
                name: 'contacts',
                url: `https://services.leadconnectorhq.com/contacts/`,
                description: 'Contact records',
                options: {
                    entityKey: 'contacts',
                    limitParam: 'limit',
                    offsetParam: 'startAfterId',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'opportunities',
                url: `https://services.leadconnectorhq.com/opportunities/search`,
                description: 'Sales opportunities',
                options: {
                    entityKey: 'opportunities',
                    limitParam: 'limit',
                    offsetParam: 'startAfterId',
                    limit: 100,
                    extraParams: `location_id=${this.locationId}`
                }
            },
            {
                name: 'calendars',
                url: `https://services.leadconnectorhq.com/calendars/`,
                description: 'Calendar configurations',
                options: {
                    entityKey: 'calendars',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'appointments',
                url: `https://services.leadconnectorhq.com/calendars/events`,
                description: 'Calendar appointments',
                options: {
                    entityKey: 'events',
                    limitParam: 'limit',
                    offsetParam: 'startAfterId',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'campaigns',
                url: `https://services.leadconnectorhq.com/campaigns/`,
                description: 'Marketing campaigns',
                options: {
                    entityKey: 'campaigns',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'forms',
                url: `https://services.leadconnectorhq.com/forms/`,
                description: 'Lead capture forms',
                options: {
                    entityKey: 'forms',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'surveys',
                url: `https://services.leadconnectorhq.com/surveys/`,
                description: 'Survey forms',
                options: {
                    entityKey: 'surveys',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'workflows',
                url: `https://services.leadconnectorhq.com/workflows/`,
                description: 'Automation workflows',
                options: {
                    entityKey: 'workflows',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'conversations',
                url: `https://services.leadconnectorhq.com/conversations/search`,
                description: 'Message conversations',
                options: {
                    entityKey: 'conversations',
                    limitParam: 'limit',
                    offsetParam: 'startAfterId',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'users',
                url: `https://services.leadconnectorhq.com/users/`,
                description: 'User accounts',
                options: {
                    entityKey: 'users',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'custom_fields',
                url: `https://services.leadconnectorhq.com/custom-fields/`,
                description: 'Custom field definitions',
                options: {
                    entityKey: 'customFields',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'custom_values',
                url: `https://services.leadconnectorhq.com/custom-values/`,
                description: 'Custom field values',
                options: {
                    entityKey: 'customValues',
                    limitParam: 'limit',
                    offsetParam: 'startAfterId',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'tags',
                url: `https://services.leadconnectorhq.com/tags/`,
                description: 'Contact tags',
                options: {
                    entityKey: 'tags',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            },
            {
                name: 'pipelines',
                url: `https://services.leadconnectorhq.com/opportunities/pipelines`,
                description: 'Sales pipelines',
                options: {
                    entityKey: 'pipelines',
                    limitParam: 'limit',
                    limit: 100,
                    extraParams: `locationId=${this.locationId}`
                }
            }
        ];
    }

    /**
     * Override pagination for GHL's cursor-based pagination
     */
    async fetchPaginatedData(endpoint, options = {}) {
        const {
            entityKey = 'contacts',
            limitParam = 'limit',
            offsetParam = 'startAfterId',
            limit = 100,
            maxPages = null,
            extraParams = ''
        } = options;

        let allData = [];
        let page = 0;
        let startAfterId = null;
        let hasMore = true;

        while (hasMore && (maxPages === null || page < maxPages)) {
            let url = `${endpoint}?${limitParam}=${limit}`;
            
            if (extraParams) {
                url += `&${extraParams}`;
            }
            
            if (startAfterId && offsetParam) {
                url += `&${offsetParam}=${startAfterId}`;
            }
            
            console.log(`Fetching GHL page ${page + 1}, startAfterId: ${startAfterId || 'none'}`);
            
            try {
                const response = await this.makeRequest(url, options);
                const pageData = this.extractDataFromResponse(response, entityKey);
                
                if (pageData && pageData.length > 0) {
                    allData = allData.concat(pageData);
                    page++;
                    
                    // GHL uses cursor-based pagination
                    // Get the last item's ID for next page
                    startAfterId = pageData[pageData.length - 1].id;
                    
                    // Check if we got fewer results than requested (indicates last page)
                    if (pageData.length < limit) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }

                // Rate limiting delay - GHL allows higher rates
                await this.sleep(this.rateLimitDelay);
                
            } catch (error) {
                console.error(`Error fetching GHL page ${page + 1}:`, error);
                throw error;
            }
        }

        console.log(`Total ${entityKey} fetched from GoHighLevel: ${allData.length}`);
        return allData;
    }

    /**
     * Test GoHighLevel connection by fetching location info
     */
    async testConnection() {
        try {
            const location = await this.makeRequest(this.getTestEndpoint());
            
            return { 
                success: true, 
                message: `Connected to GoHighLevel location: ${location.name || location.businessName || 'Unknown Location'}`,
                accountInfo: {
                    locationId: this.locationId,
                    locationName: location.name || location.businessName,
                    address: location.address,
                    phone: location.phone,
                    website: location.website,
                    timezone: location.timezone
                }
            };
        } catch (error) {
            let message = 'Connection failed';
            
            if (error.statusCode === 401) {
                message = 'Invalid API key - please check your GoHighLevel API key';
            } else if (error.statusCode === 403) {
                message = 'Access denied - please check API key permissions';
            } else if (error.statusCode === 404) {
                message = 'Location not found - please check your Location ID';
            } else {
                message = `Connection failed: ${error.message}`;
            }
            
            return { 
                success: false, 
                message,
                error: error.statusCode || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * Get summary statistics about the GoHighLevel account
     */
    async getAccountSummary() {
        try {
            const [location, contacts, opportunities] = await Promise.all([
                this.makeRequest(this.getTestEndpoint()),
                this.makeRequest(`https://services.leadconnectorhq.com/contacts/?locationId=${this.locationId}&limit=1`),
                this.makeRequest(`https://services.leadconnectorhq.com/opportunities/search?location_id=${this.locationId}&limit=1`)
            ]);

            return {
                account: {
                    locationId: this.locationId,
                    name: location.name || location.businessName || 'GoHighLevel Location',
                    address: location.address,
                    phone: location.phone,
                    website: location.website
                },
                stats: {
                    totalContacts: contacts.meta?.total || contacts.contacts?.length || 0,
                    totalOpportunities: opportunities.meta?.total || opportunities.opportunities?.length || 0,
                    timezone: location.timezone || 'Unknown'
                }
            };
        } catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }

    /**
     * Enhanced sync that includes custom fields
     */
    async syncData(endpoints = []) {
        console.log('Starting GoHighLevel data sync...');
        
        // Perform standard sync
        const results = await super.syncData(endpoints);

        // If we successfully got custom fields, enhance contact data
        if (results.custom_fields && results.custom_fields.success) {
            console.log(`Found ${results.custom_fields.count} custom fields`);
        }

        return results;
    }
}

module.exports = GoHighLevelConnector;