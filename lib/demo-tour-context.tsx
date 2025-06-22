'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useDemoTour } from '@/hooks/use-demo-tour'

/**
 * Demo Tour Context Provider
 * 
 * Provides a single, shared instance of the demo tour state across the entire application.
 * This prevents multiple hook instances that can cause conflicting state updates.
 */

type DemoTourContextType = ReturnType<typeof useDemoTour> & {
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
  
  // Add shouldShowDemo function
  const shouldShowDemo = async (): Promise<boolean> => {
    // For now, return false - this can be implemented later
    // This function should check if a user should see the demo
    return false
  }

  const contextValue = {
    ...demoTour,
    shouldShowDemo
  }

  return (
    <DemoTourContext.Provider value={contextValue}>
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
    isOpen: context.isOpen,
    currentStep: context.currentStep,
    isCompleted: context.isCompleted
  })
  
  return context
} 