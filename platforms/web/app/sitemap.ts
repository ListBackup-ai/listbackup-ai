import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://listbackup.ai'
  
  // Define all public pages
  const pages = [
    '',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/integrations',
    '/demo',
    '/help',
    '/status',
    '/security',
    '/privacy',
    '/terms',
    '/blog',
    // Integration pages
    '/integrations/keap',
    '/integrations/stripe',
    '/integrations/gohighlevel',
    '/integrations/activecampaign',
    '/integrations/mailchimp',
    '/integrations/hubspot',
    '/integrations/shopify',
    '/integrations/request'
  ]

  // Generate sitemap entries
  const routes = pages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page === '' ? 1 : page.includes('/integrations/') ? 0.8 : 0.7
  }))

  return routes
}