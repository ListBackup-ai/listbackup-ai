import { Metadata } from 'next'

export const siteConfig = {
  name: 'ListBackup.ai',
  url: 'https://listbackup.ai',
  description: 'AI-powered data backup and integration platform. Automatically backup, sync, and protect data from 50+ business tools including Stripe, Keap, HubSpot, and more.',
  keywords: [
    'data backup',
    'business data protection',
    'SaaS backup',
    'API data backup',
    'Stripe backup',
    'Keap backup',
    'HubSpot backup',
    'GoHighLevel backup',
    'Mailchimp backup',
    'ActiveCampaign backup',
    'Shopify backup',
    'Zendesk backup',
    'data integration',
    'automated backup',
    'cloud backup',
    'business continuity',
    'data migration',
    'CRM backup',
    'payment data backup',
    'PCI compliance backup',
    'GDPR compliant backup',
    'SOC 2 backup',
    'enterprise data protection',
    'white label backup',
    'agency data backup',
    'real-time data sync',
    'disaster recovery',
    'data archival',
    'backup automation',
    'API integration backup'
  ],
  author: 'ListBackup.ai',
  ogImage: 'https://listbackup.ai/og-image.png',
  links: {
    twitter: 'https://twitter.com/listbackupai',
    linkedin: 'https://linkedin.com/company/listbackupai',
    github: 'https://github.com/listbackupai'
  },
  businessInfo: {
    name: 'ListBackup.ai',
    address: {
      streetAddress: '',
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
      addressCountry: 'US'
    },
    contact: {
      email: 'support@listbackup.ai',
      phone: '',
      supportUrl: 'https://listbackup.ai/support'
    },
    foundingDate: '2024',
    industry: 'Software as a Service (SaaS)',
    services: [
      'Data Backup Services',
      'API Integration',
      'Data Migration',
      'Compliance Management',
      'Disaster Recovery'
    ]
  }
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - AI-Powered Data Backup Platform`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - AI-Powered Data Backup Platform`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - AI-Powered Data Backup Platform`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@listbackupai'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code'
  }
}

// Page-specific metadata generators
export function generatePageMetadata(
  title: string,
  description: string,
  path: string = '/',
  keywords?: string[],
  image?: string
): Metadata {
  const url = `${siteConfig.url}${path}`
  const ogImage = image || siteConfig.ogImage
  
  return {
    title,
    description,
    keywords: keywords || siteConfig.keywords,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      type: 'website',
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [ogImage]
    },
    alternates: {
      canonical: url
    }
  }
}

// Schema.org structured data generators
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteConfig.businessInfo.name,
    "url": siteConfig.url,
    "logo": `${siteConfig.url}/images/logo.png`,
    "description": siteConfig.description,
    "foundingDate": siteConfig.businessInfo.foundingDate,
    "industry": siteConfig.businessInfo.industry,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": siteConfig.businessInfo.address.addressCountry
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": siteConfig.businessInfo.contact.email,
      "url": siteConfig.businessInfo.contact.supportUrl
    },
    "sameAs": [
      siteConfig.links.twitter,
      siteConfig.links.linkedin,
      siteConfig.links.github
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Data Backup Services",
      "itemListElement": siteConfig.businessInfo.services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service
        }
      }))
    }
  }
}

export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": siteConfig.name,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": siteConfig.description,
    "url": siteConfig.url,
    "screenshot": siteConfig.ogImage,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31",
      "name": "14-day Free Trial",
      "description": "Free trial with full access to all features"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "50+ Platform Integrations",
      "Real-time Data Synchronization", 
      "Enterprise-grade Security",
      "AI-powered Analytics",
      "Automated Backup Workflows",
      "Data Migration Tools",
      "Compliance Management",
      "White-label Solutions"
    ],
    "creator": {
      "@type": "Organization",
      "name": siteConfig.businessInfo.name
    }
  }
}

export function generateArticleSchema(
  title: string,
  description: string,
  publishedDate: string,
  modifiedDate: string,
  authorName: string = siteConfig.author,
  image?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image || siteConfig.ogImage,
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    "author": {
      "@type": "Organization",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.businessInfo.name,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteConfig.url}/images/logo.png`
      }
    }
  }
}

export function generateFAQSchema(faqs: Array<{question: string, answer: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  }
}

export function generateServiceSchema(
  serviceName: string,
  description: string,
  provider: string = siteConfig.businessInfo.name
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": provider
    },
    "serviceType": "Data Backup and Integration",
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": serviceName,
      "itemListElement": [{
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": serviceName
        }
      }]
    }
  }
}