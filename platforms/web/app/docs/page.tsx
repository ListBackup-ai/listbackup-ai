import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ListBackup.ai Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to integrate with our backup and synchronization platform
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* API Reference */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                API Reference
              </CardTitle>
              <CardDescription>
                Complete REST API documentation with examples and schemas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/docs/api">
                <Button className="w-full">
                  View API Docs
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Start
              </CardTitle>
              <CardDescription>
                Get up and running with the ListBackup.ai API in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Integration Guides */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Integration Guides
              </CardTitle>
              <CardDescription>
                Step-by-step guides for popular platforms and frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2m0 0V7a2 2 0 012-2m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2" />
                </svg>
                Authentication
              </CardTitle>
              <CardDescription>
                Learn how to authenticate with JWT tokens and OAuth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* SDKs & Libraries */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                SDKs & Libraries
              </CardTitle>
              <CardDescription>
                Official and community SDKs for various programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Support
              </CardTitle>
              <CardDescription>
                Get help from our team and community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/help">
                <Button variant="outline" className="w-full">
                  Get Support
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

        {/* Quick Links Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">API Endpoints</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/docs/api#tag/User-Management" className="hover:text-blue-600">User Management</Link></li>
                <li><Link href="/docs/api#tag/Platforms" className="hover:text-blue-600">Available Platforms</Link></li>
                <li><Link href="/docs/api#tag/Platform-Connections" className="hover:text-blue-600">Platform Connections</Link></li>
                <li><Link href="/docs/api#tag/Sources" className="hover:text-blue-600">Data Sources</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Integration Examples</h3>
              <ul className="space-y-2 text-gray-600">
                <li><span className="text-gray-400">• JavaScript/Node.js (Coming Soon)</span></li>
                <li><span className="text-gray-400">• Python (Coming Soon)</span></li>
                <li><span className="text-gray-400">• PHP (Coming Soon)</span></li>
                <li><span className="text-gray-400">• cURL Examples (Coming Soon)</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}