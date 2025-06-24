import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Client Portal - ListBackup.ai',
  description: 'Access your backup reports and data exports',
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if client is authenticated
  const cookieStore = await cookies()
  const clientToken = cookieStore.get('client-token')
  
  if (!clientToken) {
    redirect('/portal/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Client Portal</h1>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/portal" className="text-sm font-medium hover:text-primary">
                Dashboard
              </a>
              <a href="/portal/accounts" className="text-sm font-medium hover:text-primary">
                Accounts
              </a>
              <a href="/portal/reports" className="text-sm font-medium hover:text-primary">
                Reports
              </a>
              <a href="/portal/exports" className="text-sm font-medium hover:text-primary">
                Data Exports
              </a>
              <a href="/portal/logout" className="text-sm font-medium text-red-600 hover:text-red-700">
                Logout
              </a>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Portal Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}