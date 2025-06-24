const BaseConnector = require('./base-connector');

class HubSpotConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.baseUrl = 'https://api.hubapi.com';
    this.apiVersion = 'v3';
  }

  async validateConfig() {
    if (!this.config.apiKey && !this.config.accessToken && !this.config.tokenSecretName) {
      throw new Error('HubSpot API key, OAuth access token, or token secret name is required');
    }
  }

  async testConnection() {
    try {
      const response = await this.makeRequest('/account-info/v3/details');
      return {
        success: true,
        accountInfo: {
          portalId: response.portalId,
          companyName: response.companyName,
          timeZone: response.timeZone,
          currency: response.currency,
          utcOffset: response.utcOffset
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async *fetchContacts(options = {}) {
    let after = null;
    const limit = options.limit || 100;
    const properties = options.properties || [
      'firstname', 'lastname', 'email', 'phone', 'company', 
      'website', 'lifecyclestage', 'createdate', 'lastmodifieddate',
      'hs_lead_status', 'hs_analytics_source', 'hs_email_domain'
    ];

    do {
      const params = {
        limit,
        properties: properties.join(','),
        associations: 'companies,deals,tickets'
      };

      if (after) {
        params.after = after;
      }

      const response = await this.makeRequest(`/crm/${this.apiVersion}/objects/contacts`, { params });
      
      yield response.results || [];

      after = response.paging?.next?.after || null;
    } while (after);
  }

  async *fetchCompanies(options = {}) {
    let after = null;
    const limit = options.limit || 100;
    const properties = options.properties || [
      'name', 'domain', 'industry', 'phone', 'city', 'state', 'country',
      'numberofemployees', 'annualrevenue', 'createdate', 'lastmodifieddate',
      'hs_object_id', 'website', 'description'
    ];

    do {
      const params = {
        limit,
        properties: properties.join(','),
        associations: 'contacts,deals'
      };

      if (after) {
        params.after = after;
      }

      const response = await this.makeRequest(`/crm/${this.apiVersion}/objects/companies`, { params });
      
      yield response.results || [];

      after = response.paging?.next?.after || null;
    } while (after);
  }

  async *fetchDeals(options = {}) {
    let after = null;
    const limit = options.limit || 100;
    const properties = options.properties || [
      'dealname', 'amount', 'closedate', 'dealstage', 'pipeline',
      'createdate', 'hs_lastmodifieddate', 'hs_object_id',
      'hs_deal_stage_probability', 'hs_is_closed', 'hs_is_closed_won'
    ];

    do {
      const params = {
        limit,
        properties: properties.join(','),
        associations: 'contacts,companies,line_items'
      };

      if (after) {
        params.after = after;
      }

      const response = await this.makeRequest(`/crm/${this.apiVersion}/objects/deals`, { params });
      
      yield response.results || [];

      after = response.paging?.next?.after || null;
    } while (after);
  }

  async *fetchTickets(options = {}) {
    let after = null;
    const limit = options.limit || 100;

    do {
      const params = {
        limit,
        associations: 'contacts,companies'
      };

      if (after) {
        params.after = after;
      }

      const response = await this.makeRequest(`/crm/${this.apiVersion}/objects/tickets`, { params });
      
      yield response.results || [];

      after = response.paging?.next?.after || null;
    } while (after);
  }

  async *fetchProducts(options = {}) {
    let after = null;
    const limit = options.limit || 100;

    do {
      const params = { limit };

      if (after) {
        params.after = after;
      }

      const response = await this.makeRequest(`/crm/${this.apiVersion}/objects/products`, { params });
      
      yield response.results || [];

      after = response.paging?.next?.after || null;
    } while (after);
  }

  async *fetchEngagements(options = {}) {
    let after = null;
    const limit = options.limit || 100;

    do {
      const params = {
        limit,
        associations: 'contacts,companies,deals,tickets'
      };

      if (after) {
        params.after = after;
      }

      const response = await this.makeRequest(`/crm/${this.apiVersion}/objects/engagements`, { params });
      
      yield response.results || [];

      after = response.paging?.next?.after || null;
    } while (after);
  }

  async *fetchForms(options = {}) {
    // Marketing API endpoint
    const response = await this.makeRequest('/marketing/v3/forms');
    yield response.results || [];
  }

  async *fetchLists(options = {}) {
    let offset = 0;
    const count = options.limit || 250;
    let hasMore = true;

    while (hasMore) {
      const params = {
        count,
        offset
      };

      const response = await this.makeRequest('/contacts/v1/lists', { params });
      
      yield response.lists || [];

      hasMore = response['has-more'] || false;
      offset = response.offset || 0;
    }
  }

  async *fetchWorkflows(options = {}) {
    // Automation API endpoint
    const response = await this.makeRequest('/automation/v3/workflows');
    yield response.workflows || [];
  }

  async *fetchEmailTemplates(options = {}) {
    let offset = 0;
    const limit = options.limit || 100;
    let hasMore = true;

    while (hasMore) {
      const params = {
        limit,
        offset
      };

      const response = await this.makeRequest('/marketing/v3/emails', { params });
      
      yield response.results || [];

      hasMore = response.hasMore || false;
      offset += limit;
    }
  }

  async *fetchOwners(options = {}) {
    const response = await this.makeRequest('/crm/v3/owners');
    yield response.results || [];
  }

  async *fetchPipelines(options = {}) {
    const objectTypes = ['deals', 'tickets'];
    
    for (const objectType of objectTypes) {
      const response = await this.makeRequest(`/crm/v3/pipelines/${objectType}`);
      yield response.results || [];
    }
  }

  async *fetchProperties(objectType, options = {}) {
    const response = await this.makeRequest(`/crm/v3/properties/${objectType}`);
    yield response.results || [];
  }

  // Override makeRequest to handle HubSpot's authentication
  async makeRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Use API key if available, otherwise use OAuth token
    if (this.config.apiKey) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint = `${endpoint}${separator}hapikey=${this.config.apiKey}`;
    } else if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    return super.makeRequest(endpoint, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
  }

  // HubSpot-specific rate limiting
  getRateLimitDelay() {
    // HubSpot has different rate limits based on subscription
    // Default to 10 requests per second (100ms delay)
    return 100;
  }

  // Helper method to fetch all object types
  async *fetchAllObjects(objectType, options = {}) {
    let after = null;
    const limit = options.limit || 100;

    do {
      const params = {
        limit,
        associations: options.associations || []
      };

      if (after) {
        params.after = after;
      }

      if (options.properties) {
        params.properties = options.properties.join(',');
      }

      const response = await this.makeRequest(`/crm/${this.apiVersion}/objects/${objectType}`, { params });
      
      yield response.results || [];

      after = response.paging?.next?.after || null;
    } while (after);
  }
}

module.exports = HubSpotConnector;