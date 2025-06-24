/**
 * Base Data Connector Class
 * Follows the v1 pattern for data extraction and API handling
 */

const https = require('https');
const http = require('http');
const { GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { secretsManager } = require('../utils/aws-clients');

class BaseConnector {
    constructor(config) {
        this.config = config;
        this.baseUrl = config.baseUrl;
        this.headersPromise = null; // Will be built lazily
        this.rateLimitDelay = 100; // Start with 100ms delay
        this.maxRetries = 3;
    }
    
    /**
     * Get headers, building them if necessary
     */
    async getHeaders() {
        if (!this.headersPromise) {
            this.headersPromise = this.buildHeaders(this.config.auth || this.config);
        }
        return this.headersPromise;
    }

    /**
     * Build authentication headers based on auth type
     */
    async buildHeaders(auth) {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ListBackup.ai/2.0'
        };

        switch (auth.type) {
            case 'api_key':
                if (auth.header_name && auth.api_key) {
                    headers[auth.header_name] = auth.api_key;
                } else if (auth.authorization_type === 'Bearer') {
                    headers['Authorization'] = `Bearer ${auth.api_key}`;
                } else if (auth.authorization_type === 'Basic') {
                    headers['Authorization'] = `Basic ${Buffer.from(auth.api_key + ':').toString('base64')}`;
                }
                break;
            
            case 'oauth2':
                // Check if we have a token secret name (stored in AWS Secrets Manager)
                if (this.config.tokenSecretName) {
                    try {
                        const secretResult = await secretsManager.send(new GetSecretValueCommand({
                            SecretId: this.config.tokenSecretName
                        }));
                        const tokens = JSON.parse(secretResult.SecretString);
                        headers['Authorization'] = `Bearer ${tokens.access_token}`;
                    } catch (error) {
                        console.error('Error retrieving OAuth token from Secrets Manager:', error);
                        throw new Error('Failed to retrieve OAuth token');
                    }
                } else if (auth.access_token) {
                    headers['Authorization'] = `Bearer ${auth.access_token}`;
                }
                break;
            
            case 'custom':
                // Allow custom headers
                Object.assign(headers, auth.custom_headers || {});
                break;
        }

        return headers;
    }

    /**
     * Replace URL placeholders with actual values
     */
    replaceUrlPlaceholders(url, placeholders = {}) {
        let processedUrl = url;
        
        // Replace config placeholders
        Object.keys(this.config).forEach(key => {
            const placeholder = `{${key}}`;
            if (processedUrl.includes(placeholder)) {
                processedUrl = processedUrl.replace(new RegExp(placeholder, 'g'), this.config[key]);
            }
        });

        // Replace additional placeholders
        Object.keys(placeholders).forEach(key => {
            const placeholder = `{${key}}`;
            if (processedUrl.includes(placeholder)) {
                processedUrl = processedUrl.replace(new RegExp(placeholder, 'g'), placeholders[key]);
            }
        });

        return processedUrl;
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(url, options = {}) {
        const processedUrl = this.replaceUrlPlaceholders(url, options.placeholders);
        const headers = await this.getHeaders();
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`Making request to: ${processedUrl} (attempt ${attempt})`);
                
                const data = await this.httpRequest(processedUrl, {
                    headers: { ...headers, ...options.headers },
                    method: options.method || 'GET'
                });

                return data;
            } catch (error) {
                console.error(`Request failed (attempt ${attempt}):`, error.message);
                
                if (attempt === this.maxRetries) {
                    throw error;
                }

                // Handle rate limiting
                if (error.statusCode === 429 || error.statusCode === 503) {
                    const delay = this.rateLimitDelay * Math.pow(2, attempt);
                    console.log(`Rate limited, waiting ${delay}ms before retry...`);
                    await this.sleep(delay);
                } else {
                    // For other errors, wait before retry
                    await this.sleep(1000 * attempt);
                }
            }
        }
    }

    /**
     * HTTP request wrapper
     */
    httpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;

            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            const result = data ? JSON.parse(data) : {};
                            resolve(result);
                        } else {
                            const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
                            error.statusCode = res.statusCode;
                            error.response = data;
                            reject(error);
                        }
                    } catch (parseError) {
                        reject(new Error(`JSON parse error: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (options.body) {
                req.write(JSON.stringify(options.body));
            }

            req.end();
        });
    }

    /**
     * Fetch paginated data from an endpoint
     */
    async fetchPaginatedData(endpoint, options = {}) {
        const {
            entityKey = 'data',
            limitParam = 'limit',
            offsetParam = 'offset',
            limit = 100,
            maxPages = null
        } = options;

        let allData = [];
        let page = 0;
        let hasMore = true;

        while (hasMore && (maxPages === null || page < maxPages)) {
            const offset = page * limit;
            const url = `${endpoint}?${limitParam}=${limit}&${offsetParam}=${offset}`;
            
            console.log(`Fetching page ${page + 1}, offset: ${offset}`);
            
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

                // Rate limiting delay
                await this.sleep(this.rateLimitDelay);
                
            } catch (error) {
                console.error(`Error fetching page ${page + 1}:`, error);
                throw error;
            }
        }

        console.log(`Total ${entityKey} fetched: ${allData.length}`);
        return allData;
    }

    /**
     * Extract data from API response based on the entity key
     */
    extractDataFromResponse(response, entityKey) {
        if (Array.isArray(response)) {
            return response;
        }
        
        if (typeof response === 'object' && response[entityKey]) {
            return response[entityKey];
        }
        
        // For responses that don't match expected format
        return response;
    }

    /**
     * Test connection to the data source
     */
    async testConnection() {
        try {
            const testEndpoint = this.getTestEndpoint();
            await this.makeRequest(testEndpoint);
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { 
                success: false, 
                message: `Connection failed: ${error.message}`,
                error: error.statusCode || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * Get endpoint for testing connection (override in subclasses)
     */
    getTestEndpoint() {
        throw new Error('getTestEndpoint must be implemented by subclass');
    }

    /**
     * Get available endpoints for this connector (override in subclasses)
     */
    getAvailableEndpoints() {
        throw new Error('getAvailableEndpoints must be implemented by subclass');
    }

    /**
     * Sync data from specified endpoints
     */
    async syncData(endpoints = []) {
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Syncing data from endpoint: ${endpoint.name}`);
                const data = await this.fetchPaginatedData(endpoint.url, endpoint.options);
                results[endpoint.name] = {
                    success: true,
                    count: data.length,
                    data: data
                };
            } catch (error) {
                console.error(`Error syncing ${endpoint.name}:`, error);
                results[endpoint.name] = {
                    success: false,
                    error: error.message,
                    count: 0
                };
            }
        }
        
        return results;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = BaseConnector;