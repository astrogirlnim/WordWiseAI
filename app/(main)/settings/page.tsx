'use client'

import { UserPreferencesForm } from '@/components/user-preferences-form'
import { NavigationBar } from '@/components/navigation-bar'
import { useAuth } from '@/lib/auth-context'
import { useDocuments } from '@/hooks/use-documents'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Document } from '@/types/document'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { documents, loading: docsLoading } = useDocuments()
  const router = useRouter()
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  const handleDocumentSelect = (documentId: string) => {
    setActiveDocumentId(documentId)
    router.push(`/?documentId=${documentId}`)
  }
  
  const handleNewDocument = () => {
    // This could be more sophisticated, e.g. creating a doc and then routing
    router.push('/')
  }

  const loading = authLoading || docsLoading;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <NavigationBar
        user={{
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          avatar: user.photoURL || '',
          plan: 'free', // Assuming a default plan
        }}
        documents={documents}
        activeDocumentId={activeDocumentId}
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
        displayMode="settings"
        writingGoals={{
          audience: 'consumers',
          formality: 'casual',
          domain: 'marketing-copy',
          intent: 'persuade',
        }}
        isDistractionFree={false}
      />
      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <UserPreferencesForm />
      </main>
    </div>
  )
} 