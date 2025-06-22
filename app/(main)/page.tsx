'use client'

import { useAuth } from '@/lib/auth-context'
import { DocumentContainer } from '@/components/document-container'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useDemoTour } from '@/hooks/use-demo-tour'

/**
 * Main application content component with demo auto-trigger logic
 * Separated to handle useSearchParams with proper Suspense boundary
 */
function MainContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { actions: demoActions, shouldShowDemo } = useDemoTour()
  const [isClient, setIsClient] = useState(false)
  const [hasCheckedDemo, setHasCheckedDemo] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in')
    }
  }, [user, loading, router])

  /**
   * Auto-trigger demo for first-time users or when demo=true in URL
   * This provides an onboarding experience for new users
   */
  useEffect(() => {
    const checkAndTriggerDemo = async () => {
      if (!isClient || hasCheckedDemo || loading) return

      try {
        console.log('🔍 Checking if demo should be auto-triggered...')
        
        // Check if demo was requested via URL parameter (from sign-in page)
        const demoParam = searchParams.get('demo')
        if (demoParam === 'true') {
          console.log('🎯 Demo requested via URL parameter - opening demo')
          demoActions.openDemo()
          setHasCheckedDemo(true)
          return
        }

        // Check if user is authenticated and should see demo
        if (user) {
          const shouldShow = await shouldShowDemo()
          console.log('📊 Should show demo for authenticated user:', shouldShow)
          
          if (shouldShow) {
            console.log('🚀 Auto-triggering demo for first-time user')
            // Small delay to ensure DocumentContainer is fully loaded
            setTimeout(() => {
              demoActions.openDemo()
            }, 1000)
          }
          setHasCheckedDemo(true)
        }
      } catch (error) {
        console.error('❌ Error checking demo trigger conditions:', error)
        setHasCheckedDemo(true)
      }
    }

    checkAndTriggerDemo()
  }, [isClient, hasCheckedDemo, loading, user, searchParams, shouldShowDemo, demoActions])

  if (loading || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
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
