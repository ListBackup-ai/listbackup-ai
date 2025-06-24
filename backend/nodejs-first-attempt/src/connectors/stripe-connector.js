/**
 * Stripe Data Connector
 * Implements data extraction from Stripe API following v1 patterns
 */

const BaseConnector = require('./base-connector');

class StripeConnector extends BaseConnector {
    constructor(config) {
        super({
            ...config,
            baseUrl: 'https://api.stripe.com/v1',
            auth: {
                type: 'api_key',
                authorization_type: 'Bearer',
                api_key: config.api_key
            }
        });
    }

    getTestEndpoint() {
        return 'https://api.stripe.com/v1/account';
    }

    getAvailableEndpoints() {
        return [
            {
                name: 'customers',
                url: 'https://api.stripe.com/v1/customers',
                description: 'Customer records',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'charges',
                url: 'https://api.stripe.com/v1/charges',
                description: 'Payment charges',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'invoices',
                url: 'https://api.stripe.com/v1/invoices',
                description: 'Customer invoices',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'subscriptions',
                url: 'https://api.stripe.com/v1/subscriptions',
                description: 'Recurring subscriptions',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'products',
                url: 'https://api.stripe.com/v1/products',
                description: 'Products and services',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'prices',
                url: 'https://api.stripe.com/v1/prices',
                description: 'Product pricing',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'payment_intents',
                url: 'https://api.stripe.com/v1/payment_intents',
                description: 'Payment intentions',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'refunds',
                url: 'https://api.stripe.com/v1/refunds',
                description: 'Payment refunds',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'payouts',
                url: 'https://api.stripe.com/v1/payouts',
                description: 'Bank payouts',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'events',
                url: 'https://api.stripe.com/v1/events',
                description: 'Webhook events',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'disputes',
                url: 'https://api.stripe.com/v1/disputes',
                description: 'Payment disputes',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            },
            {
                name: 'transfers',
                url: 'https://api.stripe.com/v1/transfers',
                description: 'Account transfers',
                options: {
                    entityKey: 'data',
                    limitParam: 'limit',
                    limit: 100
                }
            }
        ];
    }

    /**
     * Override pagination handling for Stripe's cursor-based pagination
     */
    async fetchPaginatedData(endpoint, options = {}) {
        const {
            entityKey = 'data',
            limit = 100,
            maxPages = null
        } = options;

        let allData = [];
        let page = 0;
        let startingAfter = null;
        let hasMore = true;

        while (hasMore && (maxPages === null || page < maxPages)) {
            let url = `${endpoint}?limit=${limit}`;
            if (startingAfter) {
                url += `&starting_after=${startingAfter}`;
            }
            
            console.log(`Fetching Stripe page ${page + 1}, starting_after: ${startingAfter || 'none'}`);
            
            try {
                const response = await this.makeRequest(url, options);
                const pageData = this.extractDataFromResponse(response, entityKey);
                
                if (pageData && pageData.length > 0) {
                    allData = allData.concat(pageData);
                    page++;
                    
                    // Stripe uses cursor-based pagination
                    // Set the starting_after parameter to the last item's ID
                    startingAfter = pageData[pageData.length - 1].id;
                    
                    // Check if there are more pages
                    hasMore = response.has_more || false;
                } else {
                    hasMore = false;
                }

                // Rate limiting delay - Stripe allows 100 requests per second
                await this.sleep(50); // 50ms delay = 20 requests/second to be safe
                
            } catch (error) {
                console.error(`Error fetching Stripe page ${page + 1}:`, error);
                throw error;
            }
        }

        console.log(`Total ${entityKey} fetched from Stripe: ${allData.length}`);
        return allData;
    }

    /**
     * Test Stripe connection by fetching account info
     */
    async testConnection() {
        try {
            const account = await this.makeRequest('https://api.stripe.com/v1/account');
            return { 
                success: true, 
                message: `Connected to Stripe account: ${account.business_profile?.name || account.email || account.id}`,
                accountInfo: {
                    id: account.id,
                    name: account.business_profile?.name,
                    email: account.email,
                    country: account.country,
                    currency: account.default_currency
                }
            };
        } catch (error) {
            let message = 'Connection failed';
            
            if (error.statusCode === 401) {
                message = 'Invalid API key - please check your Stripe secret key';
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
     * Get summary statistics about the Stripe account
     */
    async getAccountSummary() {
        try {
            const [account, balance, customers, charges] = await Promise.all([
                this.makeRequest('https://api.stripe.com/v1/account'),
                this.makeRequest('https://api.stripe.com/v1/balance'),
                this.makeRequest('https://api.stripe.com/v1/customers?limit=1'),
                this.makeRequest('https://api.stripe.com/v1/charges?limit=1')
            ]);

            return {
                account: {
                    id: account.id,
                    name: account.business_profile?.name || 'Unnamed Account',
                    email: account.email,
                    country: account.country,
                    currency: account.default_currency
                },
                balance: {
                    available: balance.available,
                    pending: balance.pending
                },
                stats: {
                    totalCustomers: customers.data?.length || 0,
                    totalCharges: charges.data?.length || 0
                }
            };
        } catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }
}

module.exports = StripeConnector;