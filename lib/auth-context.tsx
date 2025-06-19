'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, functions } from './firebase'
import { httpsCallable } from 'firebase/functions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { CollaborationService } from '@/services/collaboration-service'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: (activeDocumentId?: string) => Promise<void>
  updateUserProfile: (name: string) => Promise<void>
  acceptInvitation: (token: string) => Promise<{ success: boolean; documentId?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] Auth state changed, user:', user?.uid)
      
      if (user) {
        // Check for a pending invitation when user logs in
        const pendingToken = localStorage.getItem('pendingInviteToken')
        const pendingDocumentId = localStorage.getItem('pendingDocumentId')
        
        console.log('[AuthContext] Checking for pending invitation:', { pendingToken, pendingDocumentId })
        
        if (pendingToken) {
          console.log('[AuthContext] Processing pending invitation token:', pendingToken)
          localStorage.removeItem('pendingInviteToken')
          
          try {
            const result = await acceptInvitation(pendingToken)
            if (result.success && result.documentId) {
              console.log('[AuthContext] Invitation accepted, redirecting to document:', result.documentId)
              // Clean up any stored document ID since we got it from the invitation
              localStorage.removeItem('pendingDocumentId')
              // Redirect to the document
              router.push(`/doc/${result.documentId}`)
            } else if (pendingDocumentId) {
              console.log('[AuthContext] Invitation failed but document ID available, redirecting to:', pendingDocumentId)
              localStorage.removeItem('pendingDocumentId')
              router.push(`/doc/${pendingDocumentId}`)
            }
          } catch (error) {
            console.error('[AuthContext] Error processing pending invitation:', error)
            // If invitation fails but we have a document ID, still try to navigate
            if (pendingDocumentId) {
              console.log('[AuthContext] Using fallback document ID for navigation:', pendingDocumentId)
              localStorage.removeItem('pendingDocumentId')
              router.push(`/doc/${pendingDocumentId}`)
            }
          }
        }
      }
      
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [router])

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] Signing in user with email:', email)
    await signInWithEmailAndPassword(auth, email, password)
    // The onAuthStateChanged effect will handle the invitation acceptance and redirect
  }

  const signUp = async (email: string, password: string) => {
    console.log('[AuthContext] Signing up new user with email:', email)
    await createUserWithEmailAndPassword(auth, email, password)
    // The onAuthStateChanged effect will handle the invitation acceptance and redirect
  }

  const signInWithGoogle = async () => {
    console.log('[AuthContext] Signing in with Google')
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    // The onAuthStateChanged effect will handle the invitation acceptance and redirect
  }

  const logout = async (activeDocumentId?: string) => {
    console.log('[AuthContext] Logging out user. Active document:', activeDocumentId)
    
    // Gracefully leave collaboration session before signing out
    if (activeDocumentId && auth.currentUser) {
      try {
        await CollaborationService.leaveDocumentSession(activeDocumentId, auth.currentUser.uid)
        console.log('[AuthContext] Successfully left collaboration session for document:', activeDocumentId)
      } catch (error) {
        console.error('[AuthContext] Error leaving collaboration session during logout:', error)
      }
    }
    
    await signOut(auth)
    // Redirect to home or sign-in page after logout
    router.push('/sign-in') 
  }

  const updateUserProfile = async (name: string) => {
    console.log('[AuthContext] Updating user profile with name:', name)
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name })
      setUser(auth.currentUser ? { ...auth.currentUser } : null)
    } else {
      throw new Error('No user is currently signed in.')
    }
  }

  const acceptInvitation = async (token: string) => {
    console.log('[AuthContext] Accepting invitation with token:', token)
    try {
      const acceptInviteFunction = httpsCallable(functions, 'acceptInvite')
      const result = await acceptInviteFunction({ token })
      const data = result.data as { success: boolean, documentId: string }
      
      console.log('[AuthContext] Invitation acceptance result:', data)
      
      if (data.success) {
        toast({
          title: 'Invitation Accepted!',
          description: 'You now have access to the document.',
        })
        return { success: true, documentId: data.documentId }
      }
    } catch (error: any) {
      console.error('[AuthContext] Failed to accept invitation:', error)
      toast({
        title: 'Invitation Failed',
        description: error.message || 'Could not accept the invitation. It may be invalid or expired.',
        variant: 'destructive',
      })
    }
    return { success: false }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
    acceptInvitation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
