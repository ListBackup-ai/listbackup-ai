import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata(
  'Contact Us - Get in Touch',
  'Have questions about ListBackup.ai? Contact our sales or support team. We\'re here to help you protect your business data.',
  '/contact'
)

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}