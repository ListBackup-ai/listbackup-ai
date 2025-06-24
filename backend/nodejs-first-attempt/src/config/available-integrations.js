// Available integrations configuration based on v1 patterns
// This defines the connector configurations for each supported platform

const AVAILABLE_INTEGRATIONS = {
  keap: {
    appIntegrationId: "keap",
    title: "Keap Integration", 
    company: "Keap",
    shortDescription: "Comprehensive backup of your Keap CRM data including contacts, orders, campaigns, and custom fields.",
    categories: ["CRM", "Marketing Automation", "E-Commerce"],
    logo: "https://logo.clearbit.com/keap.com",
    popularityScore: 98,
    auth_config: {
      type: "api_key",
      base_url: "https://api.infusionsoft.com/crm/rest/v1",
      headers: {
        Authorization: "Bearer {auth_token}"
      },
      fields: [
        {
          name: "auth_token",
          label: "Keap API Token",
          type: "password",
          placeholder: "KeapAK-...",
          required: true,
          description: "Your Keap API token from Developer > API Access. Should start with 'KeapAK-'."
        }
      ]
    },
    job_config: {
      api_endpoints: {
        rest: [
          { name: "contacts", url: "https://api.infusionsoft.com/crm/rest/v1/contacts" },
          { name: "companies", url: "https://api.infusionsoft.com/crm/rest/v1/companies" },
          { name: "opportunities", url: "https://api.infusionsoft.com/crm/rest/v1/opportunities" },
          { name: "orders", url: "https://api.infusionsoft.com/crm/rest/v1/orders" },
          { name: "products", url: "https://api.infusionsoft.com/crm/rest/v1/products" },
          { name: "tags", url: "https://api.infusionsoft.com/crm/rest/v1/tags" },
          { name: "tasks", url: "https://api.infusionsoft.com/crm/rest/v1/tasks" },
          { name: "notes", url: "https://api.infusionsoft.com/crm/rest/v1/notes" },
          { name: "emails", url: "https://api.infusionsoft.com/crm/rest/v1/emails" },
          { name: "transactions", url: "https://api.infusionsoft.com/crm/rest/v1/transactions" },
          { name: "subscriptions", url: "https://api.infusionsoft.com/crm/rest/v1/subscriptions" },
          { name: "users", url: "https://api.infusionsoft.com/crm/rest/v1/users" },
          { name: "files", url: "https://api.infusionsoft.com/crm/rest/v1/files" },
          { name: "affiliates", url: "https://api.infusionsoft.com/crm/rest/v1/affiliates" },
          { name: "affiliate_commissions", url: "https://api.infusionsoft.com/crm/rest/v1/affiliates/commissions" },
          { name: "affiliate_programs", url: "https://api.infusionsoft.com/crm/rest/v1/affiliates/programs" }
        ]
      }
    }
  },

  stripe: {
    appIntegrationId: "stripe",
    title: "Stripe Integration",
    company: "Stripe",
    shortDescription: "Backup your Stripe transaction data, customers, invoices, and payouts to ListBackup.ai.",
    categories: ["Payments", "Finance", "Subscriptions"],
    logo: "https://logo.clearbit.com/stripe.com",
    popularityScore: 97,
    auth_config: {
      type: "api_key",
      base_url: "https://api.stripe.com/v1",
      headers: {
        Authorization: "Bearer {api_key}"
      },
      fields: [
        {
          name: "api_key",
          label: "Stripe Secret Key",
          type: "password",
          placeholder: "sk_test_...",
          required: true,
          description: "You can find your API key in your Stripe dashboard under Developers > API keys."
        }
      ]
    },
    job_config: {
      api_endpoints: {
        rest: [
          { name: "customers", url: "https://api.stripe.com/v1/customers" },
          { name: "charges", url: "https://api.stripe.com/v1/charges" },
          { name: "invoices", url: "https://api.stripe.com/v1/invoices" },
          { name: "subscriptions", url: "https://api.stripe.com/v1/subscriptions" },
          { name: "payouts", url: "https://api.stripe.com/v1/payouts" },
          { name: "products", url: "https://api.stripe.com/v1/products" },
          { name: "prices", url: "https://api.stripe.com/v1/prices" },
          { name: "payment_intents", url: "https://api.stripe.com/v1/payment_intents" },
          { name: "refunds", url: "https://api.stripe.com/v1/refunds" },
          { name: "events", url: "https://api.stripe.com/v1/events" }
        ]
      }
    }
  },

  mailchimp: {
    appIntegrationId: "mailchimp",
    title: "MailChimp Integration",
    company: "MailChimp",
    shortDescription: "Backup your MailChimp campaigns, subscribers, and reports to ListBackup.ai or export them effortlessly.",
    categories: ["Email Marketing", "Automation"],
    logo: "https://logo.clearbit.com/mailchimp.com",
    popularityScore: 89,
    auth_config: {
      type: "api_key",
      base_url: "https://{server_prefix}.api.mailchimp.com/3.0",
      headers: {
        Authorization: "Basic anystring:{api_key}"
      },
      fields: [
        {
          name: "server_prefix",
          label: "Server Prefix",
          type: "text",
          placeholder: "us1",
          required: true,
          description: "Enter your MailChimp server prefix (e.g., 'us1', 'us2')."
        },
        {
          name: "api_key",
          label: "API Key",
          type: "password",
          placeholder: "Enter your MailChimp API Key",
          required: true,
          description: "Enter your MailChimp API Key available in your MailChimp account settings."
        }
      ]
    },
    job_config: {
      api_endpoints: {
        rest: [
          { name: "lists", url: "https://{server_prefix}.api.mailchimp.com/3.0/lists" },
          { name: "campaigns", url: "https://{server_prefix}.api.mailchimp.com/3.0/campaigns" },
          { name: "subscribers", url: "https://{server_prefix}.api.mailchimp.com/3.0/lists/{list_id}/members" },
          { name: "segments", url: "https://{server_prefix}.api.mailchimp.com/3.0/lists/{list_id}/segments" },
          { name: "reports", url: "https://{server_prefix}.api.mailchimp.com/3.0/reports" },
          { name: "automations", url: "https://{server_prefix}.api.mailchimp.com/3.0/automations" },
          { name: "templates", url: "https://{server_prefix}.api.mailchimp.com/3.0/templates" }
        ]
      }
    }
  },

  zendesk: {
    appIntegrationId: "zendesk",
    title: "Zendesk Integration",
    company: "Zendesk",
    shortDescription: "Ensure reliable backups of your Zendesk tickets, customer interactions, and settings with ListBackup.ai.",
    categories: ["Customer Support", "CRM"],
    logo: "https://logo.clearbit.com/zendesk.com",
    popularityScore: 93,
    auth_config: {
      type: "api_key",
      base_url: "https://{subdomain}.zendesk.com/api/v2",
      headers: {
        Authorization: "Bearer {api_token}"
      },
      fields: [
        {
          name: "subdomain",
          label: "Zendesk Subdomain",
          type: "text",
          placeholder: "company",
          required: true,
          description: "Enter your Zendesk subdomain (e.g., 'company' for 'company.zendesk.com')."
        },
        {
          name: "api_token",
          label: "Zendesk API Token",
          type: "password",
          placeholder: "Enter your Zendesk API Token",
          required: true,
          description: "Generate an API token from Zendesk Admin Center under Apps and Integrations > API > API Tokens."
        }
      ]
    },
    job_config: {
      api_endpoints: {
        rest: [
          { name: "tickets", url: "https://{subdomain}.zendesk.com/api/tickets.json" },
          { name: "users", url: "https://{subdomain}.zendesk.com/api/users.json" },
          { name: "organizations", url: "https://{subdomain}.zendesk.com/api/organizations.json" },
          { name: "groups", url: "https://{subdomain}.zendesk.com/api/groups.json" },
          { name: "ticket_fields", url: "https://{subdomain}.zendesk.com/api/ticket_fields.json" },
          { name: "satisfaction_ratings", url: "https://{subdomain}.zendesk.com/api/satisfaction_ratings.json" },
          { name: "macros", url: "https://{subdomain}.zendesk.com/api/macros.json" },
          { name: "views", url: "https://{subdomain}.zendesk.com/api/views.json" }
        ]
      }
    }
  },

  shopify: {
    appIntegrationId: "shopify",
    title: "Shopify Integration",
    company: "Shopify",
    shortDescription: "Backup your Shopify store data, including orders, customers, products, and transactions, with ListBackup.ai.",
    categories: ["E-Commerce", "Sales", "Inventory Management"],
    logo: "https://logo.clearbit.com/shopify.com",
    popularityScore: 94,
    auth_config: {
      type: "api_key",
      base_url: "https://{store_name}.myshopify.com/admin/api/2023-04",
      headers: {
        "X-Shopify-Access-Token": "{access_token}"
      },
      fields: [
        {
          name: "store_name",
          label: "Store Name",
          type: "text",
          placeholder: "mystore",
          required: true,
          description: "Enter your Shopify store name (e.g., 'mystore' for 'mystore.myshopify.com')."
        },
        {
          name: "access_token",
          label: "Access Token",
          type: "password",
          placeholder: "Enter your Shopify Access Token",
          required: true,
          description: "Create a private app in Shopify Admin to get your access token."
        }
      ]
    },
    job_config: {
      api_endpoints: {
        rest: [
          { name: "orders", url: "https://{store_name}.myshopify.com/admin/api/2023-04/orders.json" },
          { name: "customers", url: "https://{store_name}.myshopify.com/admin/api/2023-04/customers.json" },
          { name: "products", url: "https://{store_name}.myshopify.com/admin/api/2023-04/products.json" },
          { name: "collections", url: "https://{store_name}.myshopify.com/admin/api/2023-04/collections.json" },
          { name: "inventory_levels", url: "https://{store_name}.myshopify.com/admin/api/2023-04/inventory_levels.json" },
          { name: "transactions", url: "https://{store_name}.myshopify.com/admin/api/2023-04/transactions.json" },
          { name: "fulfillments", url: "https://{store_name}.myshopify.com/admin/api/2023-04/fulfillments.json" }
        ]
      }
    }
  },

  gohighlevel: {
    appIntegrationId: "gohighlevel",
    title: "GoHighLevel Integration",
    company: "GoHighLevel",
    shortDescription: "Backup your GoHighLevel CRM data, contacts, opportunities, campaigns, and automation workflows.",
    categories: ["CRM", "Marketing Automation", "Sales"],
    logo: "https://logo.clearbit.com/gohighlevel.com",
    popularityScore: 95,
    auth_config: {
      type: "api_key",
      base_url: "https://services.leadconnectorhq.com",
      headers: {
        Authorization: "Bearer {api_key}"
      },
      fields: [
        {
          name: "api_key",
          label: "GoHighLevel API Key",
          type: "password",
          placeholder: "Enter your GHL API Key",
          required: true,
          description: "Your GoHighLevel API key from Settings > Integrations > API."
        },
        {
          name: "location_id",
          label: "Location ID",
          type: "text",
          placeholder: "Enter your Location ID",
          required: true,
          description: "Your GoHighLevel Location ID (found in URL or Settings)."
        }
      ]
    },
    job_config: {
      api_endpoints: {
        rest: [
          { name: "contacts", url: "https://services.leadconnectorhq.com/contacts/" },
          { name: "opportunities", url: "https://services.leadconnectorhq.com/opportunities/search" },
          { name: "calendars", url: "https://services.leadconnectorhq.com/calendars/" },
          { name: "appointments", url: "https://services.leadconnectorhq.com/calendars/events" },
          { name: "campaigns", url: "https://services.leadconnectorhq.com/campaigns/" },
          { name: "forms", url: "https://services.leadconnectorhq.com/forms/" },
          { name: "surveys", url: "https://services.leadconnectorhq.com/surveys/" },
          { name: "workflows", url: "https://services.leadconnectorhq.com/workflows/" },
          { name: "conversations", url: "https://services.leadconnectorhq.com/conversations/search" },
          { name: "users", url: "https://services.leadconnectorhq.com/users/" },
          { name: "custom_fields", url: "https://services.leadconnectorhq.com/custom-fields/" },
          { name: "tags", url: "https://services.leadconnectorhq.com/tags/" },
          { name: "pipelines", url: "https://services.leadconnectorhq.com/opportunities/pipelines" }
        ]
      }
    }
  },

  activecampaign: {
    appIntegrationId: "activecampaign",
    title: "ActiveCampaign Integration",
    company: "ActiveCampaign",
    shortDescription: "Backup your ActiveCampaign contacts, campaigns, automations, deals, and custom field data.",
    categories: ["Email Marketing", "CRM", "Marketing Automation"],
    logo: "https://logo.clearbit.com/activecampaign.com",
    popularityScore: 94,
    auth_config: {
      type: "api_key",
      base_url: "{api_url}",
      headers: {
        "Api-Token": "{api_key}"
      },
      fields: [
        {
          name: "api_url",
          label: "API URL",
          type: "text",
          placeholder: "https://youraccountname.api-us1.com",
          required: true,
          description: "Your ActiveCampaign API URL (found in Settings > Developer)."
        },
        {
          name: "api_key",
          label: "API Key",
          type: "password",
          placeholder: "Enter your API Key",
          required: true,
          description: "Your ActiveCampaign API key from Settings > Developer."
        }
      ]
    },
    job_config: {
      api_endpoints: {
        rest: [
          { name: "contacts", url: "{api_url}/api/3/contacts" },
          { name: "lists", url: "{api_url}/api/3/lists" },
          { name: "campaigns", url: "{api_url}/api/3/campaigns" },
          { name: "automations", url: "{api_url}/api/3/automations" },
          { name: "deals", url: "{api_url}/api/3/deals" },
          { name: "accounts", url: "{api_url}/api/3/accounts" },
          { name: "tags", url: "{api_url}/api/3/tags" },
          { name: "custom_fields", url: "{api_url}/api/3/fields" },
          { name: "messages", url: "{api_url}/api/3/messages" },
          { name: "forms", url: "{api_url}/api/3/forms" },
          { name: "users", url: "{api_url}/api/3/users" },
          { name: "groups", url: "{api_url}/api/3/groups" },
          { name: "contact_automations", url: "{api_url}/api/3/contactAutomations" },
          { name: "deal_stages", url: "{api_url}/api/3/dealStages" },
          { name: "pipelines", url: "{api_url}/api/3/dealGroups" },
          { name: "notes", url: "{api_url}/api/3/notes" },
          { name: "tasks", url: "{api_url}/api/3/dealTasks" }
        ]
      }
    }
  },

  hubspot: {
    appIntegrationId: "hubspot",
    title: "HubSpot Integration",
    company: "HubSpot",
    shortDescription: "Complete backup of your HubSpot CRM, Marketing, Sales, and Service Hub data including contacts, companies, deals, tickets, and marketing assets.",
    categories: ["CRM", "Marketing Automation", "Sales", "Service"],
    logo: "https://logo.clearbit.com/hubspot.com",
    popularityScore: 95,
    auth_config: {
      type: "oauth2",
      base_url: "https://api.hubapi.com",
      oauth_url: "https://app.hubspot.com/oauth/authorize",
      token_url: "https://api.hubapi.com/oauth/v1/token",
      headers: {
        Authorization: "Bearer {auth_token}"
      },
      fields: [
        {
          name: "api_key",
          label: "HubSpot API Key (or use OAuth)",
          type: "text",
          required: false,
          placeholder: "Your HubSpot API Key"
        },
        {
          name: "access_token",
          label: "OAuth Access Token",
          type: "text",
          required: false,
          placeholder: "OAuth access token"
        }
      ],
      endpoints: [
        { name: "contacts", url: "{api_url}/crm/v3/objects/contacts" },
        { name: "companies", url: "{api_url}/crm/v3/objects/companies" },
        { name: "deals", url: "{api_url}/crm/v3/objects/deals" },
        { name: "tickets", url: "{api_url}/crm/v3/objects/tickets" },
        { name: "products", url: "{api_url}/crm/v3/objects/products" },
        { name: "line_items", url: "{api_url}/crm/v3/objects/line_items" },
        { name: "quotes", url: "{api_url}/crm/v3/objects/quotes" },
        { name: "forms", url: "{api_url}/marketing/v3/forms" },
        { name: "emails", url: "{api_url}/marketing/v3/emails" },
        { name: "lists", url: "{api_url}/contacts/v1/lists" },
        { name: "workflows", url: "{api_url}/automation/v3/workflows" },
        { name: "pipelines", url: "{api_url}/crm/v3/pipelines" },
        { name: "owners", url: "{api_url}/crm/v3/owners" },
        { name: "properties", url: "{api_url}/crm/v3/properties" },
        { name: "engagements", url: "{api_url}/crm/v3/objects/engagements" }
      ]
    }
  }
};

module.exports = { AVAILABLE_INTEGRATIONS };