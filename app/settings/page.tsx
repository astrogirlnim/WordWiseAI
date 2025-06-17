'use client'

import { UserPreferencesForm } from '@/components/user-preferences-form'
import { NavigationBar } from '@/components/navigation-bar'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in')
    }
  }, [user, loading, router])

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
        documents={[]}
        isAISidebarOpen={false}
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