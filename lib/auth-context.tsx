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

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (name: string) => Promise<void>
  acceptInvitation: (token: string) => Promise<{ success: boolean; documentId?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check for a pending invitation when user logs in
        const pendingToken = localStorage.getItem('pendingInviteToken')
        if (pendingToken) {
          localStorage.removeItem('pendingInviteToken')
          await acceptInvitation(pendingToken)
        }
      }
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
    // The onAuthStateChanged effect will handle the invitation acceptance
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    // The onAuthStateChanged effect will handle the invitation acceptance
  }

  const logout = async () => {
    await signOut(auth)
  }

  const updateUserProfile = async (name: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name })
      setUser(auth.currentUser ? { ...auth.currentUser } : null)
    } else {
      throw new Error('No user is currently signed in.')
    }
  }

  const acceptInvitation = async (token: string) => {
    try {
      const acceptInviteFunction = httpsCallable(functions, 'acceptInvite')
      const result = await acceptInviteFunction({ token })
      const data = result.data as { success: boolean, documentId: string }
      if (data.success) {
        toast({
          title: 'Invitation Accepted!',
          description: 'You now have access to the document.',
        })
        return { success: true, documentId: data.documentId }
      }
    } catch (error: any) {
      console.error('Failed to accept invitation:', error)
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
