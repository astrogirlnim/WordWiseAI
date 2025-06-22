'use client'

import { useAuth } from '@/lib/auth-context'
import { DocumentContainer } from '@/components/document-container'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

/**
 * Main application content component with demo auto-trigger logic
 * Separated to handle useSearchParams with proper Suspense boundary
 */
function MainContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle authentication redirects (but allow demo mode for unauthenticated users)
  useEffect(() => {
    if (!loading && !user && searchParams.get('demo') !== 'true') {
      console.log('🔒 No user found and not in demo mode - redirecting to sign-in')
      router.push('/sign-in')
    }
  }, [user, loading, router, searchParams])

  // Demo triggering is now handled directly by the DemoModal component

  if (loading || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // Allow demo mode for unauthenticated users
  const isDemoMode = searchParams.get('demo') === 'true'
  
  if (!user && !isDemoMode) {
    console.log('🔒 No user and not in demo mode - showing nothing while redirect happens')
    return null
  }

  if (!user && isDemoMode) {
    console.log('🎯 Demo mode for unauthenticated user - showing DocumentContainer')
  }

  return <DocumentContainer />
}

/**
 * Main page component with Suspense boundary for useSearchParams
 * Ensures proper handling of search parameters during SSR/client hydration
 */
export default function Page() {
  return (
    <Suspense 
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      }
    >
      <MainContent />
    </Suspense>
  )
}
