/**
 * MailChimp Data Connector
 * Implements data extraction from MailChimp API following v1 patterns
 */

const BaseConnector = require('./base-connector');

class MailchimpConnector extends BaseConnector {
    constructor(config) {
        const { server_prefix, api_key } = config;
        
        super({
            ...config,
            baseUrl: `https://${server_prefix}.api.mailchimp.com/3.0`,
            auth: {
                type: 'api_key',
                authorization_type: 'Basic',
                api_key: Buffer.from(`anystring:${api_key}`).toString('base64')
            }
        });
        
        this.serverPrefix = server_prefix;
    }

    getTestEndpoint() {
        return `https://${this.serverPrefix}.api.mailchimp.com/3.0/ping`;
    }

    getAvailableEndpoints() {
        return [
            {
                name: 'lists',
                url: `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists`,
                description: 'Audience lists',
                options: {
                    entityKey: 'lists',
                    limitParam: 'count',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'campaigns',
                url: `https://${this.serverPrefix}.api.mailchimp.com/3.0/campaigns`,
                description: 'Email campaigns',
                options: {
                    entityKey: 'campaigns',
                    limitParam: 'count',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'reports',
                url: `https://${this.serverPrefix}.api.mailchimp.com/3.0/reports`,
                description: 'Campaign reports',
                options: {
                    entityKey: 'reports',
                    limitParam: 'count',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'automations',
                url: `https://${this.serverPrefix}.api.mailchimp.com/3.0/automations`,
                description: 'Marketing automations',
                options: {
                    entityKey: 'automations',
                    limitParam: 'count',
                    offsetParam: 'offset',
                    limit: 100
                }
            },
            {
                name: 'templates',
                url: `https://${this.serverPrefix}.api.mailchimp.com/3.0/templates`,
                description: 'Email templates',
                options: {
                    entityKey: 'templates',
                    limitParam: 'count',
                    offsetParam: 'offset',
                    limit: 100
                }
            }
        ];
    }

    /**
     * Test MailChimp connection by pinging the API
     */
    async testConnection() {
        try {
            const ping = await this.makeRequest(this.getTestEndpoint());
            const account = await this.makeRequest(`https://${this.serverPrefix}.api.mailchimp.com/3.0/`);
            
            return { 
                success: true, 
                message: `Connected to MailChimp account: ${account.account_name || account.email || 'Unknown Account'}`,
                accountInfo: {
                    id: account.account_id,
                    name: account.account_name,
                    email: account.email,
                    datacenter: account.dc,
                    industry: account.industry_stats?.type
                }
            };
        } catch (error) {
            let message = 'Connection failed';
            
            if (error.statusCode === 401) {
                message = 'Invalid API key - please check your MailChimp API key';
            } else if (error.statusCode === 403) {
                message = 'Access denied - please check API key permissions';
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
     * Get summary statistics about the MailChimp account
     */
    async getAccountSummary() {
        try {
            const [account, lists, campaigns] = await Promise.all([
                this.makeRequest(`https://${this.serverPrefix}.api.mailchimp.com/3.0/`),
                this.makeRequest(`https://${this.serverPrefix}.api.mailchimp.com/3.0/lists?count=1`),
                this.makeRequest(`https://${this.serverPrefix}.api.mailchimp.com/3.0/campaigns?count=1`)
            ]);

            return {
                account: {
                    id: account.account_id,
                    name: account.account_name || 'Unnamed Account',
                    email: account.email,
                    datacenter: account.dc,
                    industry: account.industry_stats?.type || 'Unknown'
                },
                stats: {
                    totalLists: lists.total_items || 0,
                    totalCampaigns: campaigns.total_items || 0,
                    planType: account.plan_type || 'Unknown'
                }
            };
        } catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }

    /**
     * Sync subscribers for a specific list
     */
    async syncListMembers(listId, options = {}) {
        const url = `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;
        return await this.fetchPaginatedData(url, {
            entityKey: 'members',
            limitParam: 'count',
            offsetParam: 'offset',
            limit: 100,
            ...options
        });
    }

    /**
     * Override sync to include list members for each list
     */
    async syncData(endpoints = []) {
        const results = await super.syncData(endpoints);
        
        // If we successfully got lists, also sync their members
        if (results.lists && results.lists.success && results.lists.data) {
            console.log(`Syncing members for ${results.lists.data.length} lists...`);
            
            for (const list of results.lists.data) {
                try {
                    const members = await this.syncListMembers(list.id, { maxPages: 5 }); // Limit to avoid timeout
                    results[`list_${list.id}_members`] = {
                        success: true,
                        count: members.length,
                        data: members,
                        listName: list.name
                    };
                } catch (error) {
                    console.error(`Error syncing members for list ${list.id}:`, error);
                    results[`list_${list.id}_members`] = {
                        success: false,
                        error: error.message,
                        count: 0,
                        listName: list.name
                    };
                }
            }
        }
        
        return results;
    }
}

module.exports = MailchimpConnector;