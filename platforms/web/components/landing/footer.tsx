import Link from 'next/link'
import { LogoMain } from '@/components/logo/logo-main'
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Mail,
  ArrowUpRight
} from 'lucide-react'

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Integrations', href: '/features#integrations' },
      { name: 'API Documentation', href: '/docs' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Data Security', href: '/security' },
      { name: 'GDPR', href: '/gdpr' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { name: 'Help Center', href: '/help' },
      { name: 'Status', href: '/status' },
      { name: 'API Status', href: '/api-status' },
      { name: 'Contact Support', href: '/support' },
    ],
  },
}

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/listbackupai' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/listbackupai' },
  { name: 'GitHub', icon: Github, href: 'https://github.com/listbackupai' },
  { name: 'Email', icon: Mail, href: 'mailto:support@listbackup.ai' },
]

export function LandingFooter() {
  return (
    <footer className="relative mt-24 bg-gradient-to-b from-background to-muted/30">
      {/* Decorative top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Logo and description */}
          <div className="col-span-2">
            <LogoMain className="mb-4" />
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered data backup and integration platform for modern businesses. 
              Secure, intelligent, and scalable.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="group"
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <span className="sr-only">{social.name}</span>
                  <div className="rounded-lg bg-muted p-2 transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110">
                    <social.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.name}
                      {link.href.startsWith('http') && (
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ListBackup.ai. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Built with</span>
              <span className="text-red-500">❤️</span>
              <span>for data security</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}