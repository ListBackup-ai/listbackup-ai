import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { AuthInitializer } from '@/components/auth-initializer'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { Toaster } from '@/components/ui/toast'
import { BrandingLoader } from '@/components/branding/branding-loader'
import { defaultMetadata } from '@/lib/seo/metadata'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = defaultMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AnalyticsProvider>
            <BrandingLoader />
            <AuthInitializer />
            {children}
            <CookieConsent />
            <Toaster />
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  )
}