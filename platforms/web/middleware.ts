import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that don't require authentication
const publicPaths = [
  '/login', 
  '/signup', 
  '/forgot-password', 
  '/reset-password', 
  '/',
  '/pricing',
  '/features',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/integrations',
  '/demo',
  '/help',
  '/status',
  '/security',
  '/blog'
]

export function middleware(request: NextRequest) {
  const token = request.cookies.get('serviceToken')?.value
  const { pathname } = request.nextUrl

  console.log('Middleware - Path:', pathname, 'Token exists:', !!token)

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // If the path is not public and there's no token, redirect to login
  if (!isPublicPath && !token) {
    console.log('Redirecting to login - no token for protected path')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If the user is authenticated and trying to access login/signup, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/signup')) {
    console.log('Redirecting to dashboard - already authenticated')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If authenticated and accessing root, redirect to dashboard
  if (token && pathname === '/') {
    console.log('Redirecting to dashboard from root')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}