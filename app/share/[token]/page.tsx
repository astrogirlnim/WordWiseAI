'use client'

import { useAuth } from '@/lib/auth-context'
import { DocumentSharingService } from '@/services/document-sharing-service'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { validateUserEmail } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Loader2, ExternalLink, ArrowRight } from 'lucide-react'

export default function SharePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const token = Array.isArray(params.token) ? params.token[0] : params.token

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentTitle, setDocumentTitle] = useState<string | null>(null)

  console.log('[SharePage] Component initialized:', {
    token,
    userId: user?.uid,
    userEmail: user?.email,
    authLoading,
    loading
  })

  // Authentication and token validation
  const validateShareAccess = useCallback(() => {
    console.log('[SharePage] Validating share access')
    
    // Check if token is present
    if (!token) {
      setError('Invalid share link. The token is missing or malformed.')
      setLoading(false)
      return false
    }

    // Check if user is authenticated
    if (authLoading) {
      console.log('[SharePage] Authentication still loading')
      return null // Keep loading
    }

    if (!user) {
      console.log('[SharePage] No authenticated user')
      setError('You must be signed in to accept this share invitation.')
      setLoading(false)
      return false
    }

    // Validate user email
    const emailValidation = validateUserEmail(user.email)
    if (!emailValidation.isValid) {
      console.log('[SharePage] User email validation failed:', emailValidation.error)
      setError(`Your account has an invalid email address: ${emailValidation.error}`)
      setLoading(false)
      return false
    }

    return true
  }, [token, user, authLoading])

  const processShareInvitation = useCallback(async () => {
    const validationResult = validateShareAccess()
    
    // Still loading auth state
    if (validationResult === null) {
      return
    }
    
    // Validation failed
    if (!validationResult) {
      return
    }

    console.log('[SharePage] Processing share invitation for token:', token)
    setLoading(true)
    setError(null)

    try {
      const result = await DocumentSharingService.acceptShareInvitation(
        token!,
        user!.uid,
        user!.email!
      )
      
             console.log('[SharePage] Invitation accepted successfully:', result)
       setDocumentTitle(result.document?.title || 'Document')
      
      // Give user a moment to see success message before redirecting
      setTimeout(() => {
        // Correct routing to the main page with document ID
        console.log('[SharePage] Redirecting to document:', result.documentId)
        router.push(`/?documentId=${result.documentId}`)
      }, 1500)
      
    } catch (err) {
      console.error('[SharePage] Error accepting invitation:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while accepting the invitation.'
      setError(errorMessage)
      setLoading(false)
    }
  }, [token, user, router, validateShareAccess])

  useEffect(() => {
    console.log('[SharePage] useEffect triggered:', {
      authLoading,
      hasUser: !!user,
      hasToken: !!token
    })
    
    processShareInvitation()
  }, [processShareInvitation, authLoading, user, token])

  // Show loading state while processing
  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg font-medium text-muted-foreground">
                {authLoading ? 'Checking authentication...' : 'Accepting invitation...'}
              </p>
              {documentTitle && (
                               <p className="text-sm text-muted-foreground">
                 Document: &ldquo;{documentTitle}&rdquo;
               </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success state (briefly before redirect)
  if (!error && !loading && documentTitle) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Invitation Accepted!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
                         <p className="text-lg">
               Welcome to &ldquo;{documentTitle}&rdquo;
             </p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the document...
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <span className="text-sm">Opening document</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to Accept Invitation</AlertTitle>
              <AlertDescription className="mt-2">
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                What you can do:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                {error.includes('revoked') || error.includes('no longer valid') ? (
                  <>
                    <li>• The document owner may have revoked this share link</li>
                    <li>• Ask the document owner to send you a new share link</li>
                    <li>• Make sure you&apos;re using the most recent link they sent</li>
                  </>
                ) : error.includes('email') ? (
                  <>
                    <li>• Sign in with the email address the link was sent to</li>
                    <li>• Check if you have multiple accounts and use the correct one</li>
                    <li>• Contact the document owner if you need the link resent</li>
                  </>
                ) : error.includes('expired') ? (
                  <>
                    <li>• This link has passed its expiration date</li>
                    <li>• Ask the document owner for a new share link</li>
                    <li>• Share links may have time limits for security</li>
                  </>
                ) : error.includes('already been used') ? (
                  <>
                    <li>• This link can only be used once for security</li>
                    <li>• If you need access again, ask for a new link</li>
                    <li>• Check if you already have access to the document</li>
                  </>
                ) : (
                  <>
                    <li>• Make sure you&apos;re signed in with the correct email address</li>
                    <li>• Check that the share link hasn&apos;t expired or been revoked</li>
                    <li>• Contact the document owner if you continue having issues</li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="flex gap-2 pt-2">
              {!user ? (
                <>
                  <Button onClick={() => router.push('/sign-in')} className="flex-1">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                  <Button onClick={() => router.push('/sign-up')} variant="outline" className="flex-1">
                    Sign Up
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => router.push('/')} className="flex-1">
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback state (shouldn't be reached)
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Alert variant="default" className="max-w-md">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Processing...</AlertTitle>
        <AlertDescription>
          Please wait while we process your invitation.
        </AlertDescription>
      </Alert>
    </div>
  )
}