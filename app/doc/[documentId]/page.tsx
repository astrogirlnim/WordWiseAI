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

  console.log('[DocumentPage] Rendering with documentId:', resolvedParams.documentId)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const inviteToken = searchParams.get('inviteToken')

    console.log('[DocumentPage] Effect triggered with:', { 
      inviteToken, 
      loading, 
      user: user?.uid, 
      documentId: resolvedParams.documentId 
    })

    if (inviteToken) {
      if (!loading && user) {
        console.log('[DocumentPage] User is logged in, accepting invitation immediately')
        // User is logged in, try to accept the invitation
        acceptInvitation(inviteToken).then(result => {
          console.log('[DocumentPage] Invitation acceptance result:', result)
          // Clean the URL to remove the token
          window.history.replaceState(null, '', `/doc/${resolvedParams.documentId}`)
        })
      } else if (!loading && !user) {
        console.log('[DocumentPage] User not logged in, storing token and document ID for later')
        // User is not logged in, store token and document ID for later use
        localStorage.setItem('pendingInviteToken', inviteToken)
        localStorage.setItem('pendingDocumentId', resolvedParams.documentId)
        router.push('/sign-in')
      }
    } else {
      // Default behavior if no token is present
      if (!loading && !user) {
        console.log('[DocumentPage] No token, user not logged in, redirecting to sign-in')
        router.push('/sign-in')
      }
    }
  }, [user, loading, router, searchParams, acceptInvitation, resolvedParams.documentId])

  if (loading || !isClient) {
    console.log('[DocumentPage] Showing loading state')
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // If there's an invite token, we might be redirecting, so show loading
  if (searchParams.get('inviteToken') && !user) {
    console.log('[DocumentPage] Showing invitation acceptance loading state')
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Accepting invitation...</p>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary ml-4"></div>
      </div>
    )
  }

  if (!user) {
    console.log('[DocumentPage] No user, returning null')
    return null
  }

  console.log('[DocumentPage] Rendering DocumentContainer for user:', user.uid)
  return <DocumentContainer documentId={resolvedParams.documentId} />
}
