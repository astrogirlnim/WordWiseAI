'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useDemoTour, type DemoTourState, type DemoTourActions } from '@/hooks/use-demo-tour'

/**
 * Demo Tour Context Provider
 * 
 * Provides a single, shared instance of the demo tour state across the entire application.
 * This prevents multiple hook instances that can cause conflicting state updates.
 */

interface DemoTourContextType {
  state: DemoTourState
  actions: DemoTourActions
  shouldShowDemo: () => Promise<boolean>
}

const DemoTourContext = createContext<DemoTourContextType | null>(null)

interface DemoTourProviderProps {
  children: ReactNode
}

/**
 * Demo Tour Provider component
 * Wraps the application to provide shared demo tour state
 */
export function DemoTourProvider({ children }: DemoTourProviderProps) {
  console.log('🔧 [DemoTourProvider] Provider instantiated')
  
  const demoTour = useDemoTour()

  return (
    <DemoTourContext.Provider value={demoTour}>
      {children}
    </DemoTourContext.Provider>
  )
}

/**
 * Hook to access the demo tour context
 * This should be used instead of calling useDemoTour directly
 */
export function useDemoTourContext() {
  const context = useContext(DemoTourContext)
  
  if (!context) {
    throw new Error('useDemoTourContext must be used within a DemoTourProvider')
  }
  
  console.log('🔧 [useDemoTourContext] Context accessed, state:', {
    isOpen: context.state.isOpen,
    currentStep: context.state.currentStep,
    isCompleted: context.state.isCompleted
  })
  
  return context
} 