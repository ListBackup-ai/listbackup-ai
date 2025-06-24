/**
 * ActiveCampaign Data Connector
 * Implements data extraction from ActiveCampaign API
 */

const BaseConnector = require('./base-connector');

class ActiveCampaignConnector extends BaseConnector {
    constructor(config) {
        const { api_url, api_key } = config;
        
        super({
            ...config,
            baseUrl: api_url,
            auth: {
                type: 'api_key',
                header_name: 'Api-Token',
                api_key: api_key
            }
        });
        
        this.apiUrl = api_url;
        this.rateLimitDelay = 200; // ActiveCampaign allows good rate limits
    }

    getTestEndpoint() {
        return `${this.apiUrl}/api/3/contacts?limit=1`;
    }

    getAvailableEndpoints() {
        return [
            {
                name: 'contacts',
                url: `${this.apiUrl}/api/3/contacts`,
                description: 'Contact records',
                options: {
                    entityKey: 'contacts',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'lists',
                url: `${this.apiUrl}/api/3/lists`,
                description: 'Contact lists',
                options: {
                    entityKey: 'lists',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'campaigns',
                url: `${this.apiUrl}/api/3/campaigns`,
                description: 'Email campaigns',
                options: {
                    entityKey: 'campaigns',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'automations',
                url: `${this.apiUrl}/api/3/automations`,
                description: 'Marketing automations',
                options: {
                    entityKey: 'automations',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'deals',
                url: `${this.apiUrl}/api/3/deals`,
                description: 'Sales deals',
                options: {
                    entityKey: 'deals',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'accounts',
                url: `${this.apiUrl}/api/3/accounts`,
                description: 'Account records',
                options: {
                    entityKey: 'accounts',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'tags',
                url: `${this.apiUrl}/api/3/tags`,
                description: 'Contact tags',
                options: {
                    entityKey: 'tags',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'custom_fields',
                url: `${this.apiUrl}/api/3/fields`,
                description: 'Custom field definitions',
                options: {
                    entityKey: 'fields',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'messages',
                url: `${this.apiUrl}/api/3/messages`,
                description: 'Email messages',
                options: {
                    entityKey: 'messages',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'forms',
                url: `${this.apiUrl}/api/3/forms`,
                description: 'Subscription forms',
                options: {
                    entityKey: 'forms',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'users',
                url: `${this.apiUrl}/api/3/users`,
                description: 'User accounts',
                options: {
                    entityKey: 'users',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'groups',
                url: `${this.apiUrl}/api/3/groups`,
                description: 'User groups',
                options: {
                    entityKey: 'groups',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'contact_automations',
                url: `${this.apiUrl}/api/3/contactAutomations`,
                description: 'Contact automation assignments',
                options: {
                    entityKey: 'contactAutomations',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'deal_stages',
                url: `${this.apiUrl}/api/3/dealStages`,
                description: 'Deal pipeline stages',
                options: {
                    entityKey: 'dealStages',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'pipelines',
                url: `${this.apiUrl}/api/3/dealGroups`,
                description: 'Deal pipelines',
                options: {
                    entityKey: 'dealGroups',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'notes',
                url: `${this.apiUrl}/api/3/notes`,
                description: 'Contact and deal notes',
                options: {
                    entityKey: 'notes',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'tasks',
                url: `${this.apiUrl}/api/3/dealTasks`,
                description: 'Deal tasks',
                options: {
                    entityKey: 'dealTasks',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 100
                }
            }
        ];
    }

    /**
     * Test ActiveCampaign connection by fetching account info
     */
    async testConnection() {
        try {
            // Test with contacts endpoint and get user info
            const [contacts, users] = await Promise.all([
                this.makeRequest(this.getTestEndpoint()),
                this.makeRequest(`${this.apiUrl}/api/3/users?limit=1`)
            ]);
            
            let accountInfo = {
                contactCount: contacts.meta?.total || 0,
                apiUrl: this.apiUrl
            };

            // Get account owner info if available
            if (users.users && users.users.length > 0) {
                const owner = users.users[0];
                accountInfo = {
                    ...accountInfo,
                    ownerName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
                    ownerEmail: owner.email,
                    timezone: owner.timezone
                };
            }
            
            return { 
                success: true, 
                message: `Connected to ActiveCampaign account. Found ${contacts.meta?.total || 0} contacts.`,
                accountInfo
            };
        } catch (error) {
            let message = 'Connection failed';
            
            if (error.statusCode === 401) {
                message = 'Invalid API key - please check your ActiveCampaign API key';
            } else if (error.statusCode === 403) {
                message = 'Access denied - please check API key permissions';
            } else if (error.statusCode === 404) {
                message = 'API URL not found - please check your ActiveCampaign API URL';
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
     * Get summary statistics about the ActiveCampaign account
     */
    async getAccountSummary() {
        try {
            const [contacts, lists, campaigns, deals, automations] = await Promise.all([
                this.makeRequest(`${this.apiUrl}/api/3/contacts?limit=1`),
                this.makeRequest(`${this.apiUrl}/api/3/lists?limit=1`),
                this.makeRequest(`${this.apiUrl}/api/3/campaigns?limit=1`),
                this.makeRequest(`${this.apiUrl}/api/3/deals?limit=1`),
                this.makeRequest(`${this.apiUrl}/api/3/automations?limit=1`)
            ]);

            // Try to get account owner info
            let accountInfo = { name: 'ActiveCampaign Account', apiUrl: this.apiUrl };
            try {
                const users = await this.makeRequest(`${this.apiUrl}/api/3/users?limit=1`);
                if (users.users && users.users.length > 0) {
                    const owner = users.users[0];
                    accountInfo = {
                        name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'ActiveCampaign Account',
                        email: owner.email,
                        apiUrl: this.apiUrl
                    };
                }
            } catch (userError) {
                console.log('Could not fetch user info for account summary');
            }

            return {
                account: accountInfo,
                stats: {
                    totalContacts: contacts.meta?.total || 0,
                    totalLists: lists.meta?.total || 0,
                    totalCampaigns: campaigns.meta?.total || 0,
                    totalDeals: deals.meta?.total || 0,
                    totalAutomations: automations.meta?.total || 0
                }
            };
        } catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }

    /**
     * Enhanced sync that includes field values with contacts
     */
    async syncData(endpoints = []) {
        console.log('Starting ActiveCampaign data sync...');
        
        // Perform standard sync
        const results = await super.syncData(endpoints);

        // If we successfully got custom fields and contacts, enhance the data
        if (results.custom_fields && results.custom_fields.success && 
            results.contacts && results.contacts.success) {
            console.log(`Found ${results.custom_fields.count} custom fields and ${results.contacts.count} contacts`);
            
            // ActiveCampaign includes field values in contact records automatically
            // The fieldValues property on contacts contains custom field data
        }

        return results;
    }
}

module.exports = ActiveCampaignConnector;