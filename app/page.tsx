'use client'

import { useAuth } from '@/lib/auth-context'
import { DocumentContainer } from '@/components/document-container'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in')
    }
  }, [user, loading, router])

  if (loading) {
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
