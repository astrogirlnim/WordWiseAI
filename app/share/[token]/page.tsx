'use client'

import { useAuth } from '@/lib/auth-context'
import { DocumentSharingService } from '@/services/document-sharing-service'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, PartyPopper } from 'lucide-react'

export default function SharePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const token = Array.isArray(params.token) ? params.token[0] : params.token

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const processShareInvitation = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to accept a share invitation.')
      setLoading(false)
      return
    }

    if (!user.email) {
      setError('Your user profile does not have an email address associated with it.')
      setLoading(false)
      return
    }

    if (!token) {
      setError('Invalid share link. The token is missing.')
      setLoading(false)
      return
    }

    try {
      console.log('[SharePage] Processing share invitation for token:', token)
      const { documentId } = await DocumentSharingService.acceptShareInvitation(
        token,
        user.uid,
        user.email
      )
      console.log('[SharePage] Invitation accepted, redirecting to document:', documentId)
      router.push(`/documents/${documentId}`)
    } catch (err) {
      console.error('[SharePage] Error accepting invitation:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
      setLoading(false)
    }
  }, [token, user, router])

  useEffect(() => {
    // We need to wait for the user state to be resolved
    if (!authLoading) {
      if (user) {
        processShareInvitation()
      } else {
        // If user is not logged in after auth state is resolved, show an error.
        setError('Please sign in or create an account to accept this invitation.')
        setLoading(false)
      }
    }
  }, [authLoading, user, processShareInvitation])

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg font-medium text-muted-foreground">
            Accepting Invitation...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invitation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => router.push('/sign-in')} variant="secondary">
              Sign In
            </Button>
            <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
          </div>
        </Alert>
      </div>
    )
  }

  // This state should ideally not be reached as the page redirects on success.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Alert variant="default" className="max-w-md">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>
          You should be redirected to the document shortly.
        </AlertDescription>
      </Alert>
    </div>
  )
}