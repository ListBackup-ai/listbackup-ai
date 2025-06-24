import { LandingLayout } from '@/components/landing/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TermsOfServicePage() {
  return (
    <LandingLayout>
      <div className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-4 py-1 bg-red-500/10 text-red-600 border-red-500/20">
                Legal Agreement
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <Card>
              <CardContent className="p-8 prose prose-gray max-w-none">
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By accessing and using ListBackup.ai ("Service"), you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>

                <h2>2. Description of Service</h2>
                <p>
                  ListBackup.ai provides automated data backup and synchronization services for various business platforms 
                  and applications. Our service includes:
                </p>
                <ul>
                  <li>Automated data backup from connected integrations</li>
                  <li>Secure cloud storage of backed-up data</li>
                  <li>Data retrieval and export capabilities</li>
                  <li>Analytics and reporting on backed-up data</li>
                  <li>Customer support and maintenance services</li>
                </ul>

                <h2>3. User Account and Registration</h2>
                <p>
                  To use our Service, you must create an account and provide accurate, complete information. 
                  You are responsible for:
                </p>
                <ul>
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Ensuring your account information remains current and accurate</li>
                </ul>

                <h2>4. Acceptable Use Policy</h2>
                <p>You agree not to use the Service to:</p>
                <ul>
                  <li>Violate any laws, regulations, or third-party rights</li>
                  <li>Transmit harmful, offensive, or illegal content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use the Service for competitive intelligence or benchmarking</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                </ul>

                <h2>5. Data Ownership and Backup</h2>
                <p>
                  You retain ownership of all data backed up through our Service. We act as a data processor 
                  and custodian. Our responsibilities include:
                </p>
                <ul>
                  <li>Securely storing your data with industry-standard encryption</li>
                  <li>Maintaining data integrity and availability</li>
                  <li>Providing data export and retrieval capabilities</li>
                  <li>Following your data retention preferences</li>
                </ul>
                <p>
                  You are responsible for the accuracy and legality of data you backup through our Service.
                </p>

                <h2>6. Third-Party Integrations</h2>
                <p>
                  Our Service integrates with third-party platforms. By connecting these integrations:
                </p>
                <ul>
                  <li>You grant us permission to access specified data for backup purposes</li>
                  <li>You confirm you have the authority to authorize such access</li>
                  <li>You understand we only read data and do not modify your source systems</li>
                  <li>You acknowledge third-party terms may also apply</li>
                </ul>

                <h2>7. Payment Terms</h2>
                <p>
                  Payment terms vary by subscription plan:
                </p>
                <ul>
                  <li>Subscription fees are billed in advance</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>We may change pricing with 30 days advance notice</li>
                  <li>Failure to pay may result in service suspension</li>
                  <li>Taxes are your responsibility unless otherwise stated</li>
                </ul>

                <h2>8. Service Level Agreement</h2>
                <p>
                  We strive to provide reliable service with:
                </p>
                <ul>
                  <li>99.9% uptime SLA for paid plans</li>
                  <li>Regular automated backups according to your plan</li>
                  <li>Data recovery capabilities within specified timeframes</li>
                  <li>Support response times based on your plan level</li>
                </ul>
                <p>
                  Service credits may be available for SLA failures as outlined in your plan details.
                </p>

                <h2>9. Data Security and Privacy</h2>
                <p>
                  We implement comprehensive security measures:
                </p>
                <ul>
                  <li>AES-256 encryption for data at rest and in transit</li>
                  <li>Industry-standard security practices</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Access controls and audit logs</li>
                  <li>Incident response procedures</li>
                </ul>

                <h2>10. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, ListBackup.ai shall not be liable for:
                </p>
                <ul>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Service interruptions beyond our reasonable control</li>
                  <li>Third-party integrations or their availability</li>
                  <li>Data corruption due to source system issues</li>
                </ul>
                <p>
                  Our total liability shall not exceed the amount paid by you in the preceding 12 months.
                </p>

                <h2>11. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless ListBackup.ai from any claims, damages, or expenses 
                  arising from your use of the Service, violation of these terms, or infringement of third-party rights.
                </p>

                <h2>12. Termination</h2>
                <p>
                  Either party may terminate this agreement:
                </p>
                <ul>
                  <li>With 30 days written notice</li>
                  <li>Immediately for material breach</li>
                  <li>Immediately for non-payment</li>
                </ul>
                <p>
                  Upon termination, we will provide 30 days to export your data before deletion.
                </p>

                <h2>13. Intellectual Property</h2>
                <p>
                  The Service and its original content, features, and functionality are owned by ListBackup.ai 
                  and are protected by intellectual property laws. You may not:
                </p>
                <ul>
                  <li>Copy, modify, or distribute our proprietary technology</li>
                  <li>Use our trademarks without permission</li>
                  <li>Reverse engineer our systems or algorithms</li>
                  <li>Create derivative works based on our Service</li>
                </ul>

                <h2>14. Modifications to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify you of material changes 
                  via email or through the Service. Continued use after changes constitutes acceptance of new terms.
                </p>

                <h2>15. Governing Law and Disputes</h2>
                <p>
                  These terms are governed by the laws of the State of California, without regard to conflict 
                  of law principles. Disputes will be resolved through binding arbitration in San Francisco, California.
                </p>

                <h2>16. Force Majeure</h2>
                <p>
                  We shall not be liable for any failure to perform due to circumstances beyond our reasonable 
                  control, including natural disasters, government actions, or third-party service failures.
                </p>

                <h2>17. Entire Agreement</h2>
                <p>
                  These terms constitute the entire agreement between you and ListBackup.ai regarding the Service 
                  and supersede all prior agreements and understandings.
                </p>

                <h2>18. Contact Information</h2>
                <p>
                  For questions about these Terms of Service, please contact us:
                </p>
                <ul>
                  <li>Email: legal@listbackup.ai</li>
                  <li>Address: 123 Market Street, Suite 400, San Francisco, CA 94105</li>
                  <li>Phone: +1 (555) 123-4567</li>
                </ul>

                <h2>19. Severability</h2>
                <p>
                  If any provision of these terms is found to be unenforceable, the remaining provisions 
                  will remain in full force and effect.
                </p>

                <h2>20. Assignment</h2>
                <p>
                  You may not assign these terms without our written consent. We may assign our rights 
                  and obligations under these terms without restriction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
  )
}