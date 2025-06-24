'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientPortalLogout() {
  const router = useRouter()

  useEffect(() => {
    // Clear the client token cookie
    document.cookie = 'client-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    // Redirect to login page
    router.push('/portal/login')
  }, [router])

  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <p className="text-muted-foreground">Logging out...</p>
    </div>
  )
}