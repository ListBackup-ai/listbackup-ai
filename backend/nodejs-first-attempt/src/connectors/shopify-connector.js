const BaseConnector = require('./base-connector');

class ShopifyConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.apiVersion = '2024-01';
    this.baseUrl = `https://${config.shopName}.myshopify.com/admin/api/${this.apiVersion}`;
  }

  async validateConfig() {
    if (!this.config.shopName) {
      throw new Error('Shopify shop name is required');
    }
    if (!this.config.apiKey) {
      throw new Error('Shopify API key is required');
    }
    if (!this.config.apiSecret) {
      throw new Error('Shopify API secret is required');
    }
  }

  async testConnection() {
    try {
      const response = await this.makeRequest('/shop.json');
      return {
        success: true,
        shopInfo: {
          name: response.shop.name,
          email: response.shop.email,
          domain: response.shop.domain,
          plan: response.shop.plan_name,
          currency: response.shop.currency,
          timezone: response.shop.timezone
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async *fetchProducts(options = {}) {
    let hasMore = true;
    let pageInfo = null;
    const limit = options.limit || 250;

    while (hasMore) {
      const params = {
        limit,
        fields: 'id,title,handle,vendor,product_type,created_at,updated_at,published_at,tags,status,variants,images,options'
      };

      if (pageInfo) {
        params.page_info = pageInfo;
      }

      const response = await this.makeRequest('/products.json', { params });
      
      yield response.products || [];

      // Check for pagination
      const linkHeader = response.headers?.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/page_info=([^>]+).*?rel="next"/);
        pageInfo = matches ? matches[1] : null;
        hasMore = !!pageInfo;
      } else {
        hasMore = false;
      }
    }
  }

  async *fetchOrders(options = {}) {
    let hasMore = true;
    let pageInfo = null;
    const limit = options.limit || 250;
    const status = options.status || 'any';

    while (hasMore) {
      const params = {
        limit,
        status,
        fields: 'id,email,created_at,updated_at,number,note,token,gateway,total_price,subtotal_price,currency,financial_status,fulfillment_status,customer,line_items,shipping_address,billing_address,shipping_lines'
      };

      if (pageInfo) {
        params.page_info = pageInfo;
      }

      if (options.created_at_min) {
        params.created_at_min = options.created_at_min;
      }

      const response = await this.makeRequest('/orders.json', { params });
      
      yield response.orders || [];

      // Check for pagination
      const linkHeader = response.headers?.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/page_info=([^>]+).*?rel="next"/);
        pageInfo = matches ? matches[1] : null;
        hasMore = !!pageInfo;
      } else {
        hasMore = false;
      }
    }
  }

  async *fetchCustomers(options = {}) {
    let hasMore = true;
    let pageInfo = null;
    const limit = options.limit || 250;

    while (hasMore) {
      const params = {
        limit,
        fields: 'id,email,first_name,last_name,phone,created_at,updated_at,state,total_spent,orders_count,tags,currency,addresses,default_address'
      };

      if (pageInfo) {
        params.page_info = pageInfo;
      }

      const response = await this.makeRequest('/customers.json', { params });
      
      yield response.customers || [];

      // Check for pagination
      const linkHeader = response.headers?.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/page_info=([^>]+).*?rel="next"/);
        pageInfo = matches ? matches[1] : null;
        hasMore = !!pageInfo;
      } else {
        hasMore = false;
      }
    }
  }

  async *fetchInventory(options = {}) {
    let hasMore = true;
    let pageInfo = null;
    const limit = options.limit || 250;

    while (hasMore) {
      const params = { limit };

      if (pageInfo) {
        params.page_info = pageInfo;
      }

      const response = await this.makeRequest('/inventory_items.json', { params });
      
      yield response.inventory_items || [];

      // Check for pagination
      const linkHeader = response.headers?.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/page_info=([^>]+).*?rel="next"/);
        pageInfo = matches ? matches[1] : null;
        hasMore = !!pageInfo;
      } else {
        hasMore = false;
      }
    }
  }

  async *fetchCollections(options = {}) {
    // Fetch both smart and custom collections
    const smartCollections = await this.fetchSmartCollections(options);
    const customCollections = await this.fetchCustomCollections(options);
    
    yield [...smartCollections, ...customCollections];
  }

  async fetchSmartCollections(options = {}) {
    const params = {
      limit: options.limit || 250,
      fields: 'id,title,handle,published_at,updated_at,body_html,sort_order,disjunctive,rules'
    };

    const response = await this.makeRequest('/smart_collections.json', { params });
    return response.smart_collections || [];
  }

  async fetchCustomCollections(options = {}) {
    const params = {
      limit: options.limit || 250,
      fields: 'id,title,handle,published_at,updated_at,body_html,sort_order'
    };

    const response = await this.makeRequest('/custom_collections.json', { params });
    return response.custom_collections || [];
  }

  async *fetchMetafields(resourceType, resourceId, options = {}) {
    const params = {
      limit: options.limit || 250
    };

    const endpoint = `/${resourceType}/${resourceId}/metafields.json`;
    const response = await this.makeRequest(endpoint, { params });
    
    yield response.metafields || [];
  }

  async *fetchDiscounts(options = {}) {
    // Note: Discount API requires specific permissions
    try {
      const params = {
        limit: options.limit || 250
      };

      const response = await this.makeRequest('/price_rules.json', { params });
      yield response.price_rules || [];
    } catch (error) {
      console.warn('Unable to fetch discounts:', error.message);
      yield [];
    }
  }

  // Override makeRequest to handle Shopify's authentication
  async makeRequest(endpoint, options = {}) {
    const headers = {
      'X-Shopify-Access-Token': this.config.accessToken || this.config.apiKey,
      'Content-Type': 'application/json'
    };

    return super.makeRequest(endpoint, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
  }

  // Shopify-specific rate limiting
  getRateLimitDelay() {
    // Shopify allows 2 requests per second for private apps
    // 4 requests per second for public apps
    return this.config.appType === 'public' ? 250 : 500;
  }
}

module.exports = ShopifyConnector;