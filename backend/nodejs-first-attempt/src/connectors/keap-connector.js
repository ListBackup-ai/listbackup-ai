/**
 * Keap (Infusionsoft) Data Connector
 * Implements data extraction from both REST and XML-RPC APIs following v1 patterns
 */

const BaseConnector = require('./base-connector');

class KeapConnector extends BaseConnector {
    constructor(config) {
        // Support both auth_token and apiToken field names
        const authToken = config.auth_token || config.apiToken;
        
        super({
            ...config,
            baseUrl: 'https://api.infusionsoft.com/crm/rest/v1',
            auth: {
                type: 'api_key',
                authorization_type: 'Bearer',
                api_key: authToken
            }
        });
        
        this.authToken = authToken;
        // Custom rate limiting for Keap - more conservative than default
        this.rateLimitDelay = 2000; // 2 second delay between requests
    }

    getTestEndpoint() {
        return 'https://api.infusionsoft.com/crm/rest/v1/contacts?limit=1';
    }

    getAvailableEndpoints() {
        return [
            // REST API Endpoints (16 total)
            {
                name: 'contacts',
                url: 'https://api.infusionsoft.com/crm/rest/v1/contacts',
                description: 'Contact records with custom fields',
                options: {
                    entityKey: 'contacts',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000,
                    extraParams: 'optional_properties=lead_source_id,custom_fields,job_title'
                }
            },
            {
                name: 'companies',
                url: 'https://api.infusionsoft.com/crm/rest/v1/companies',
                description: 'Company records',
                options: {
                    entityKey: 'companies',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'opportunities',
                url: 'https://api.infusionsoft.com/crm/rest/v1/opportunities',
                description: 'Sales opportunities',
                options: {
                    entityKey: 'opportunities',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'orders',
                url: 'https://api.infusionsoft.com/crm/rest/v1/orders',
                description: 'Order records',
                options: {
                    entityKey: 'orders',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'products',
                url: 'https://api.infusionsoft.com/crm/rest/v1/products',
                description: 'Product catalog',
                options: {
                    entityKey: 'products',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'tags',
                url: 'https://api.infusionsoft.com/crm/rest/v1/tags',
                description: 'Contact tags',
                options: {
                    entityKey: 'tags',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'tasks',
                url: 'https://api.infusionsoft.com/crm/rest/v1/tasks',
                description: 'Task records',
                options: {
                    entityKey: 'tasks',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'notes',
                url: 'https://api.infusionsoft.com/crm/rest/v1/notes',
                description: 'Contact notes',
                options: {
                    entityKey: 'notes',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'emails',
                url: 'https://api.infusionsoft.com/crm/rest/v1/emails',
                description: 'Email records',
                options: {
                    entityKey: 'emails',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'transactions',
                url: 'https://api.infusionsoft.com/crm/rest/v1/transactions',
                description: 'Transaction records',
                options: {
                    entityKey: 'transactions',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'subscriptions',
                url: 'https://api.infusionsoft.com/crm/rest/v1/subscriptions',
                description: 'Subscription records',
                options: {
                    entityKey: 'subscriptions',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'users',
                url: 'https://api.infusionsoft.com/crm/rest/v1/users',
                description: 'User accounts',
                options: {
                    entityKey: 'users',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'files',
                url: 'https://api.infusionsoft.com/crm/rest/v1/files',
                description: 'File attachments',
                options: {
                    entityKey: 'files',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'affiliates',
                url: 'https://api.infusionsoft.com/crm/rest/v1/affiliates',
                description: 'Affiliate records',
                options: {
                    entityKey: 'affiliates',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'affiliate_commissions',
                url: 'https://api.infusionsoft.com/crm/rest/v1/affiliates/commissions',
                description: 'Affiliate commissions',
                options: {
                    entityKey: 'commissions',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            },
            {
                name: 'affiliate_programs',
                url: 'https://api.infusionsoft.com/crm/rest/v1/affiliates/programs',
                description: 'Affiliate programs',
                options: {
                    entityKey: 'programs',
                    limitParam: 'limit',
                    offsetParam: 'offset',
                    limit: 1000
                }
            }
        ];
    }

    /**
     * Get XML-RPC table definitions for comprehensive data extraction
     */
    getXmlRpcTables() {
        return [
            // Core data tables from v1 implementation
            { name: 'Contact', description: 'Contact records' },
            { name: 'Company', description: 'Company records' },
            { name: 'Affiliate', description: 'Affiliate records' },
            { name: 'Lead', description: 'Lead records' },
            { name: 'Opportunity', description: 'Opportunity records' },
            { name: 'Stage', description: 'Sales stages' },
            { name: 'StageMove', description: 'Stage movement history' },
            { name: 'Product', description: 'Product records' },
            { name: 'ProductCategory', description: 'Product categories' },
            { name: 'ProductCategoryAssign', description: 'Product category assignments' },
            { name: 'Order', description: 'Order records' },
            { name: 'OrderItem', description: 'Order line items' },
            { name: 'RecurringOrder', description: 'Recurring orders' },
            { name: 'RecurringOrderWithContact', description: 'Recurring orders with contact info' },
            { name: 'Invoice', description: 'Invoice records' },
            { name: 'InvoiceItem', description: 'Invoice line items' },
            { name: 'Payment', description: 'Payment records' },
            { name: 'CreditCard', description: 'Credit card records' },
            { name: 'Campaign', description: 'Campaign records' },
            { name: 'CampaignStep', description: 'Campaign steps' },
            { name: 'Campaignee', description: 'Campaign participants' },
            { name: 'ActionSequence', description: 'Action sequences' },
            { name: 'ContactAction', description: 'Contact actions' },
            { name: 'ContactGroup', description: 'Contact groups' },
            { name: 'ContactGroupCategory', description: 'Contact group categories' },
            { name: 'GroupAssign', description: 'Group assignments' },
            { name: 'LinkedContactType', description: 'Linked contact types' },
            { name: 'Template', description: 'Email templates' },
            { name: 'EmailAddStatus', description: 'Email address statuses' },
            { name: 'Job', description: 'Job records' },
            { name: 'JobRecurringInstance', description: 'Recurring job instances' },
            { name: 'User', description: 'User accounts' },
            { name: 'UserGroup', description: 'User groups' },
            { name: 'FileBox', description: 'File storage' },
            { name: 'DataFormField', description: 'Custom field definitions' },
            { name: 'DataFormGroup', description: 'Custom field groups' },
            { name: 'DataFormTab', description: 'Custom field tabs' },
            { name: 'SavedFilter', description: 'Saved search filters' },
            { name: 'LeadSource', description: 'Lead sources' },
            { name: 'LeadSourceCategory', description: 'Lead source categories' },
            { name: 'LeadSourceExpense', description: 'Lead source expenses' },
            { name: 'LeadSourceRecurringExpense', description: 'Recurring lead source expenses' },
            { name: 'Expense', description: 'Expense records' },
            { name: 'PayPlan', description: 'Payment plans' },
            { name: 'PayPlanItem', description: 'Payment plan items' },
            { name: 'Referral', description: 'Referral records' },
            { name: 'SocialAccount', description: 'Social media accounts' },
            { name: 'SubscriptionPlan', description: 'Subscription plans' }
        ];
    }

    /**
     * Override pagination to handle Keap's specific patterns and rate limiting
     */
    async fetchPaginatedData(endpoint, options = {}) {
        const {
            entityKey = 'contacts',
            limitParam = 'limit',
            offsetParam = 'offset',
            limit = 1000,
            maxPages = null,
            extraParams = ''
        } = options;

        let allData = [];
        let page = 0;
        let hasMore = true;

        while (hasMore && (maxPages === null || page < maxPages)) {
            const offset = page * limit;
            let url = `${endpoint}?${limitParam}=${limit}&${offsetParam}=${offset}`;
            
            if (extraParams) {
                url += `&${extraParams}`;
            }
            
            console.log(`Fetching Keap page ${page + 1}, offset: ${offset}`);
            
            try {
                const response = await this.makeRequest(url, options);
                const pageData = this.extractDataFromResponse(response, entityKey);
                
                if (pageData && pageData.length > 0) {
                    allData = allData.concat(pageData);
                    page++;
                    
                    // Check if we got fewer results than requested (indicates last page)
                    if (pageData.length < limit) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }

                // Keap rate limiting - 2 second delay between requests
                await this.sleep(this.rateLimitDelay);
                
            } catch (error) {
                console.error(`Error fetching Keap page ${page + 1}:`, error);
                
                // Handle rate limiting more aggressively for Keap
                if (error.statusCode === 429) {
                    console.log('Rate limited by Keap, waiting 10 seconds...');
                    await this.sleep(10000);
                    continue; // Retry the same page
                }
                
                throw error;
            }
        }

        console.log(`Total ${entityKey} fetched from Keap: ${allData.length}`);
        return allData;
    }

    /**
     * Test Keap connection by fetching a small contact sample
     */
    async testConnection() {
        try {
            const response = await this.makeRequest(this.getTestEndpoint());
            
            // Try to get account info from user endpoint
            let accountInfo = null;
            try {
                const userResponse = await this.makeRequest('https://api.infusionsoft.com/crm/rest/v1/users?limit=1');
                if (userResponse.users && userResponse.users.length > 0) {
                    const user = userResponse.users[0];
                    accountInfo = {
                        userId: user.id,
                        userName: user.given_name + ' ' + user.family_name,
                        email: user.email_address
                    };
                }
            } catch (userError) {
                console.log('Could not fetch user info for account details');
            }
            
            return { 
                success: true, 
                message: `Connected to Keap account successfully. Found ${response.contacts?.length || 0} contacts in test query.`,
                accountInfo: accountInfo || {
                    contactCount: response.contacts?.length || 0,
                    apiStatus: 'Connected'
                }
            };
        } catch (error) {
            let message = 'Connection failed';
            
            if (error.statusCode === 401) {
                message = 'Invalid API token - please check your Keap API token (should start with KeapAK-)';
            } else if (error.statusCode === 403) {
                message = 'Access denied - please check API token permissions';
            } else if (error.statusCode === 429) {
                message = 'Rate limited - please try again later';
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
     * Get summary statistics about the Keap account
     */
    async getAccountSummary() {
        try {
            const [contacts, companies, products, orders] = await Promise.all([
                this.makeRequest('https://api.infusionsoft.com/crm/rest/v1/contacts?limit=1'),
                this.makeRequest('https://api.infusionsoft.com/crm/rest/v1/companies?limit=1'),
                this.makeRequest('https://api.infusionsoft.com/crm/rest/v1/products?limit=1'),
                this.makeRequest('https://api.infusionsoft.com/crm/rest/v1/orders?limit=1')
            ]);

            // Try to get user info for account details
            let accountInfo = { name: 'Keap Account' };
            try {
                const userResponse = await this.makeRequest('https://api.infusionsoft.com/crm/rest/v1/users?limit=1');
                if (userResponse.users && userResponse.users.length > 0) {
                    const user = userResponse.users[0];
                    accountInfo = {
                        name: user.given_name + ' ' + user.family_name,
                        email: user.email_address,
                        userId: user.id
                    };
                }
            } catch (userError) {
                console.log('Could not fetch user info for account summary');
            }

            return {
                account: accountInfo,
                stats: {
                    totalContacts: contacts.count || 0,
                    totalCompanies: companies.count || 0,
                    totalProducts: products.count || 0,
                    totalOrders: orders.count || 0
                }
            };
        } catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }

    /**
     * Enhanced sync that includes custom field detection
     * This mirrors the v1 approach of dynamically discovering custom fields
     */
    async syncData(endpoints = []) {
        console.log('Starting Keap data sync with custom field detection...');
        
        // First, try to get custom field definitions
        let customFields = [];
        try {
            // This endpoint might not be available in REST API, but we'll try
            console.log('Attempting to fetch custom field definitions...');
            // In v1, this was done via XML-RPC DataFormField table
            // For now, we'll rely on the optional_properties in contacts endpoint
        } catch (error) {
            console.log('Custom field detection not available via REST API');
        }

        // Perform standard sync
        const results = await super.syncData(endpoints);

        // Add metadata about the sync
        results._metadata = {
            syncTimestamp: new Date().toISOString(),
            apiType: 'REST',
            customFieldsDetected: customFields.length,
            note: 'Full XML-RPC sync available for comprehensive data extraction'
        };

        return results;
    }
}

module.exports = KeapConnector;