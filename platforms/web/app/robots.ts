import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
          '/admin/',
          '/*.json$',
          '/*/admin'
        ]
      }
    ],
    sitemap: 'https://listbackup.ai/sitemap.xml',
    host: 'https://listbackup.ai'
  }
}