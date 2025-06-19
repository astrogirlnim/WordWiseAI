'use client'

import { useAuth } from '@/lib/auth-context'
import { DocumentContainer } from '@/components/document-container'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, use } from 'react'

export default function DocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { user, loading, acceptInvitation } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  const resolvedParams = use(params);

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const inviteToken = searchParams.get('inviteToken')

    if (inviteToken) {
      if (!loading && user) {
        // User is logged in, try to accept the invitation
        acceptInvitation(inviteToken).then(result => {
          // Clean the URL to remove the token
          window.history.replaceState(null, '', `/doc/${resolvedParams.documentId}`)
        })
      } else if (!loading && !user) {
        // User is not logged in, store token and redirect
        localStorage.setItem('pendingInviteToken', inviteToken)
        router.push('/sign-in')
      }
    } else {
      // Default behavior if no token is present
      if (!loading && !user) {
        router.push('/sign-in')
      }
    }
  }, [user, loading, router, searchParams, acceptInvitation, resolvedParams.documentId])

  if (loading || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // If there's an invite token, we might be redirecting, so show loading
  if (searchParams.get('inviteToken') && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Accepting invitation...</p>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary ml-4"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <DocumentContainer documentId={resolvedParams.documentId} />
}
