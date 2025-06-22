'use client'

import { useEffect } from 'react'
import { DocumentContainer } from '@/components/document-container'
import { DemoTourProvider, useDemoTourContext } from '@/lib/demo-tour-context'
import { DemoModal } from '@/components/demo-modal'

/**
 * Dedicated Demo Page
 * 
 * This page provides a simplified demo experience where all users
 * (authenticated or anonymous) get the same demo tour experience.
 * No auto-triggering complexity, just a clean demo environment.
 */
export default function DemoPage() {
  return (
    <DemoTourProvider>
      <DemoPageContent />
    </DemoTourProvider>
  )
}

function DemoPageContent() {
  const demoTour = useDemoTourContext()

  // Auto-start demo when page loads
  useEffect(() => {
    console.log('🎯 [DemoPage] Auto-starting demo tour')
    demoTour.openDemo()
  }, [demoTour])

  return (
    <div className="min-h-screen bg-background">
      <DocumentContainer />
      <DemoModal />
    </div>
  )
} 