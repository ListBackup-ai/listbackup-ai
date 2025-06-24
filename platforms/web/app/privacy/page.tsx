import { LandingLayout } from '@/components/landing/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PrivacyPolicyPage() {
  return (
    <LandingLayout>
      <div className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                Legal Document
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <Card>
              <CardContent className="p-8 prose prose-gray max-w-none">
                <h2>1. Information We Collect</h2>
                <p>
                  ListBackup.ai ("we," "our," or "us") collects information you provide directly to us, 
                  information we collect automatically when you use our services, and information from third parties.
                </p>

                <h3>Information You Provide</h3>
                <ul>
                  <li>Account information (name, email address, company name)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Support communications and feedback</li>
                  <li>Integration credentials and configurations</li>
                </ul>

                <h3>Information We Collect Automatically</h3>
                <ul>
                  <li>Usage data and analytics</li>
                  <li>Log files and technical information</li>
                  <li>Device and browser information</li>
                  <li>IP addresses and location data</li>
                </ul>

                <h3>Information from Third Parties</h3>
                <ul>
                  <li>Data from connected integrations (with your explicit permission)</li>
                  <li>Authentication information from OAuth providers</li>
                  <li>Payment information from payment processors</li>
                </ul>

                <h2>2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Provide, maintain, and improve our backup services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and security alerts</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze usage patterns</li>
                  <li>Detect, investigate, and prevent fraudulent activities</li>
                </ul>

                <h2>3. Data Security and Backup</h2>
                <p>
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul>
                  <li>AES-256 encryption for data at rest and in transit</li>
                  <li>Enterprise-grade security controls</li>
                  <li>Multi-factor authentication and access controls</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Data redundancy across multiple geographic regions</li>
                </ul>

                <h2>4. Data Sharing and Disclosure</h2>
                <p>We do not sell, trade, or rent your personal information. We may share information in these limited circumstances:</p>
                <ul>
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With service providers who assist in operations (under strict confidentiality)</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                </ul>

                <h2>5. Data Retention</h2>
                <p>
                  We retain your information for as long as your account is active or as needed to provide services. 
                  Backup data is retained according to your plan's retention policy. You can request deletion of 
                  your data at any time, subject to legal and contractual obligations.
                </p>

                <h2>6. Your Rights and Choices</h2>
                <p>You have the right to:</p>
                <ul>
                  <li>Access and review your personal information</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt out of marketing communications</li>
                  <li>Request restrictions on processing</li>
                </ul>

                <h2>7. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place for international transfers, including 
                  standard contractual clauses and adequacy decisions.
                </p>

                <h2>8. Cookies and Tracking Technologies</h2>
                <p>
                  We use cookies and similar technologies to enhance your experience, analyze usage, 
                  and provide personalized content. You can control cookie settings through your browser.
                </p>

                <h2>9. Third-Party Integrations</h2>
                <p>
                  When you connect third-party services, we access only the data necessary for backup purposes. 
                  We do not modify or delete data in your connected accounts. Each integration's permissions 
                  are clearly disclosed during the connection process.
                </p>

                <h2>10. Children's Privacy</h2>
                <p>
                  Our services are not directed to children under 13. We do not knowingly collect personal 
                  information from children under 13. If we become aware of such collection, we will delete 
                  the information promptly.
                </p>

                <h2>11. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy periodically. We will notify you of material changes 
                  via email or through our service. Continued use after changes constitutes acceptance 
                  of the updated policy.
                </p>

                <h2>12. Contact Information</h2>
                <p>
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <ul>
                  <li>Email: privacy@listbackup.ai</li>
                  <li>Address: 123 Market Street, Suite 400, San Francisco, CA 94105</li>
                  <li>Phone: +1 (555) 123-4567</li>
                </ul>

                <h2>13. California Privacy Rights (CCPA)</h2>
                <p>
                  California residents have additional rights under the California Consumer Privacy Act, including:
                </p>
                <ul>
                  <li>Right to know what personal information is collected</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of the sale of personal information</li>
                  <li>Right to non-discrimination for exercising privacy rights</li>
                </ul>

                <h2>14. European Privacy Rights (GDPR)</h2>
                <p>
                  For users in the European Economic Area, we comply with GDPR requirements, including:
                </p>
                <ul>
                  <li>Lawful basis for processing personal data</li>
                  <li>Data protection by design and by default</li>
                  <li>Right to data portability</li>
                  <li>Right to be forgotten</li>
                  <li>Data Protection Officer contact: dpo@listbackup.ai</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
  )
}