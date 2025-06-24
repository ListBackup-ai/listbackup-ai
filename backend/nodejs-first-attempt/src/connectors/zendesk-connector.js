/**
 * Zendesk Data Connector
 * Implements data extraction from Zendesk API following v1 patterns
 */

const BaseConnector = require('./base-connector');

class ZendeskConnector extends BaseConnector {
    constructor(config) {
        const { subdomain, api_token } = config;
        
        super({
            ...config,
            baseUrl: `https://${subdomain}.zendesk.com/api/v2`,
            auth: {
                type: 'api_key',
                authorization_type: 'Bearer',
                api_key: api_token
            }
        });
        
        this.subdomain = subdomain;
    }

    getTestEndpoint() {
        return `https://${this.subdomain}.zendesk.com/api/account/settings.json`;
    }

    getAvailableEndpoints() {
        return [
            {
                name: 'tickets',
                url: `https://${this.subdomain}.zendesk.com/api/tickets.json`,
                description: 'Support tickets',
                options: {
                    entityKey: 'tickets',
                    limitParam: 'per_page',
                    limit: 100
                }
            },
            {
                name: 'users',
                url: `https://${this.subdomain}.zendesk.com/api/users.json`,
                description: 'Users and agents',
                options: {
                    entityKey: 'users',
                    limitParam: 'per_page',
                    limit: 100
                }
            },
            {
                name: 'organizations',
                url: `https://${this.subdomain}.zendesk.com/api/organizations.json`,
                description: 'Customer organizations',
                options: {
                    entityKey: 'organizations',
                    limitParam: 'per_page',
                    limit: 100
                }
            },
            {
                name: 'groups',
                url: `https://${this.subdomain}.zendesk.com/api/groups.json`,
                description: 'Agent groups',
                options: {
                    entityKey: 'groups',
                    limitParam: 'per_page',
                    limit: 100
                }
            },
            {
                name: 'ticket_fields',
                url: `https://${this.subdomain}.zendesk.com/api/ticket_fields.json`,
                description: 'Ticket custom fields',
                options: {
                    entityKey: 'ticket_fields',
                    limitParam: 'per_page',
                    limit: 100
                }
            },
            {
                name: 'satisfaction_ratings',
                url: `https://${this.subdomain}.zendesk.com/api/satisfaction_ratings.json`,
                description: 'Customer satisfaction ratings',
                options: {
                    entityKey: 'satisfaction_ratings',
                    limitParam: 'per_page',
                    limit: 100
                }
            },
            {
                name: 'macros',
                url: `https://${this.subdomain}.zendesk.com/api/macros.json`,
                description: 'Support macros',
                options: {
                    entityKey: 'macros',
                    limitParam: 'per_page',
                    limit: 100
                }
            },
            {
                name: 'views',
                url: `https://${this.subdomain}.zendesk.com/api/views.json`,
                description: 'Ticket views',
                options: {
                    entityKey: 'views',
                    limitParam: 'per_page',
                    limit: 100
                }
            }
        ];
    }

    /**
     * Override pagination handling for Zendesk's next_page URLs
     */
    async fetchPaginatedData(endpoint, options = {}) {
        const {
            entityKey = 'tickets',
            limit = 100,
            maxPages = null
        } = options;

        let allData = [];
        let page = 0;
        let nextPageUrl = `${endpoint}?per_page=${limit}`;
        
        while (nextPageUrl && (maxPages === null || page < maxPages)) {
            console.log(`Fetching Zendesk page ${page + 1}: ${nextPageUrl}`);
            
            try {
                const response = await this.makeRequest(nextPageUrl, options);
                const pageData = this.extractDataFromResponse(response, entityKey);
                
                if (pageData && pageData.length > 0) {
                    allData = allData.concat(pageData);
                    page++;
                    
                    // Zendesk provides next_page URL or null when done
                    nextPageUrl = response.next_page || null;
                } else {
                    nextPageUrl = null;
                }

                // Rate limiting delay - Zendesk allows 700 requests per minute
                await this.sleep(100); // 100ms delay = 10 requests/second to be safe
                
            } catch (error) {
                console.error(`Error fetching Zendesk page ${page + 1}:`, error);
                throw error;
            }
        }

        console.log(`Total ${entityKey} fetched from Zendesk: ${allData.length}`);
        return allData;
    }

    /**
     * Test Zendesk connection by fetching account settings
     */
    async testConnection() {
        try {
            const settings = await this.makeRequest(this.getTestEndpoint());
            const account = settings.settings;
            
            return { 
                success: true, 
                message: `Connected to Zendesk account: ${account.account_display_name || this.subdomain}`,
                accountInfo: {
                    subdomain: this.subdomain,
                    name: account.account_display_name,
                    url: account.url,
                    locale: account.locale,
                    plan: account.plan_name
                }
            };
        } catch (error) {
            let message = 'Connection failed';
            
            if (error.statusCode === 401) {
                message = 'Invalid API token - please check your Zendesk API token';
            } else if (error.statusCode === 403) {
                message = 'Access denied - please check API token permissions';
            } else if (error.statusCode === 404) {
                message = 'Subdomain not found - please check your Zendesk subdomain';
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
     * Get summary statistics about the Zendesk account
     */
    async getAccountSummary() {
        try {
            const [settings, tickets, users] = await Promise.all([
                this.makeRequest(this.getTestEndpoint()),
                this.makeRequest(`https://${this.subdomain}.zendesk.com/api/tickets.json?per_page=1`),
                this.makeRequest(`https://${this.subdomain}.zendesk.com/api/users.json?per_page=1`)
            ]);

            const account = settings.settings;

            return {
                account: {
                    subdomain: this.subdomain,
                    name: account.account_display_name || 'Unnamed Account',
                    url: account.url,
                    locale: account.locale,
                    plan: account.plan_name
                },
                stats: {
                    totalTickets: tickets.count || 0,
                    totalUsers: users.count || 0,
                    planType: account.plan_name || 'Unknown'
                }
            };
        } catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }
}

module.exports = ZendeskConnector;