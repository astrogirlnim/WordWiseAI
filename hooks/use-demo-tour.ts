/**
 * Demo Tour State Management Hook
 * 
 * Manages the complete demo onboarding flow with:
 * - 7-step guided tour through WordWise AI features
 * - Persistent state management via Firebase and localStorage
 * - Comprehensive logging for analytics and debugging
 * - Accessibility and mobile-responsive support
 * 
 * Features covered in demo:
 * 1. Document Creation & Goal Setting
 * 2. Writing/Copy-Paste Markdown (Sales Funnel)
 * 3. Grammar Suggestions & Markdown Preview
 * 4. AI Funnel Suggestions
 * 5. Version Control History
 * 6. Settings & Glossary Upload
 * 7. Document Sharing
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { userService } from '@/services/user-service'
import type { DemoProgress } from '@/types/user'

/** Current step in the demo tour (1-7) */
export type DemoStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * Demo tour state interface for complete state management
 */
export interface DemoTourState {
  /** Whether the demo modal is currently open */
  isOpen: boolean
  /** Current step in the demo (1-8) */
  currentStep: DemoStep
  /** Total number of steps in the demo */
  totalSteps: 8
  /** Whether demo has been completed */
  isCompleted: boolean
  /** Whether user can navigate backward */
  canGoBack: boolean
  /** Whether user can navigate forward */
  canGoForward: boolean
  /** Steps that have been completed */
  completedSteps: number[]
  /** Array of steps user has skipped */
  skippedSteps: number[]
  /** Time when current step was started (for analytics) */
  stepStartTime: number
  /** Total time spent in demo */
  totalTimeSpent: number
}

/**
 * Demo tour actions interface for state mutations
 */
export interface DemoTourActions {
  /** Open the demo modal and start/resume tour */
  openDemo: () => void
  /** Manually trigger demo for existing users (bypasses auto-trigger logic) */
  startDemo: () => void
  /** Close the demo modal */
  closeDemo: () => void
  /** Navigate to next step */
  nextStep: () => void
  /** Navigate to previous step */
  previousStep: () => void
  /** Jump to specific step */
  goToStep: (step: DemoStep) => void
  /** Skip current step */
  skipStep: () => void
  /** Skip entire demo */
  skipDemo: () => void
  /** Mark current step as completed */
  completeStep: () => void
  /** Complete entire demo */
  completDemo: () => void
  /** Reset demo progress (for testing/debugging) */
  resetDemo: () => void
}

/**
 * Sample data for demo tour
 */
export const DEMO_SAMPLE_DATA = {
  /** Sample sales funnel document content */
  sampleDocument: `# Sales Funnel Strategy Document

## Executive Summary

This document outlines a comprehensive sales funnel strategy designed to guide prospects through a systematic journey from initial awareness to loyal customers. The funnel framework presented here focuses on maximizing conversion rates at each stage while building sustainable relationships that drive long-term revenue growth.

Our multi-stage approach addresses the modern buyer's journey, incorporating digital touchpoints, personalized messaging, and data-driven optimization.

## Stage 1: Awareness (Top of Funnel)

**Objective:** Generate 10,000 monthly visitors and build brand recognition among target demographics.

**Tactics:**
- Content marketing through industry-specific blog posts and whitepapers
- Search engine optimization targeting high-intent keywords  
- Social media presence on LinkedIn and Twitter
- Paid advertising campaigns with educational focus

## Stage 2: Interest (Middle of Funnel)

**Objective:** Convert 20% of website visitors into engaged prospects through valuable content offers.

**Tactics:**
- Lead magnets including detailed case studies and ROI calculators
- Email nurture sequences delivered over 6-8 weeks
- Retargeting campaigns for engaged visitors
- Interactive assessments and quizzes`,

  /** Sample writing goals for demo */
  sampleGoals: {
    targetAudience: "B2B decision-makers aged 35-55",
    primaryObjective: "Generate qualified leads and drive conversions",
    toneGuidelines: "Professional yet approachable",
    keyMessages: ["ROI-focused solutions", "Proven results", "Expert guidance"],
    callToAction: "Schedule a consultation"
  },

  /** Sample email for sharing demo */
  sampleShareEmail: "colleague@company.com"
}

/**
 * Hook for managing demo tour state and progression
 * Integrates with Firebase for persistence and localStorage for offline support
 */
export function useDemoTour() {
  const { user } = useAuth()
  const startTimeRef = useRef<number>(Date.now())
  
  // Debug: Log hook instantiation (only once now that we use context)
  // console.log('🔍 [useDemoTour] Hook instantiated for user:', user?.uid || 'anonymous')
  
  // Core demo state
  const [state, setState] = useState<DemoTourState>({
    isOpen: false,
    currentStep: 1,
    totalSteps: 8,
    isCompleted: false,
    canGoBack: false,
    canGoForward: true,
    completedSteps: [],
    skippedSteps: [],
    stepStartTime: Date.now(),
    totalTimeSpent: 0
  })

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Comprehensive logging utility for demo analytics
   */
  const logDemoAction = useCallback((action: string, data?: any, stateSnapshot?: Partial<DemoTourState>) => {
    const logData = {
      timestamp: new Date().toISOString(),
      userId: user?.uid || 'anonymous',
      action,
      ...data
    }
    
    console.log('🎯 Demo Tour Action:', logData)
    
    // Store in localStorage for analytics
    const existingLogs = JSON.parse(localStorage.getItem('demoTourLogs') || '[]')
    existingLogs.push(logData)
    // Keep only last 100 log entries
    if (existingLogs.length > 100) {
      existingLogs.shift()
    }
    localStorage.setItem('demoTourLogs', JSON.stringify(existingLogs))
  }, [user?.uid])

  /**
   * Load demo progress from Firebase and localStorage
   */
  const loadDemoProgress = useCallback(async () => {
    if (!user?.uid) return

    try {
      setIsLoading(true)
      logDemoAction('LOAD_PROGRESS_START')

      // Try loading from Firebase first
      const userProfile = await userService.getUserProfile(user.uid)
      const demoProgress = userProfile?.demoProgress

      if (demoProgress) {
        console.log('📊 Loading demo progress from Firebase:', demoProgress)
        setState(prev => ({
          ...prev,
          isCompleted: demoProgress.isCompleted,
          completedSteps: demoProgress.completedSteps,
          totalTimeSpent: demoProgress.totalTimeSpent,
          currentStep: Math.max(demoProgress.lastStepReached, 1) as DemoStep,
          canGoBack: demoProgress.lastStepReached > 1,
          canGoForward: !demoProgress.isCompleted
        }))
        logDemoAction('LOAD_PROGRESS_SUCCESS', { source: 'firebase', progress: demoProgress })
      } else {
        // Fallback to localStorage
        const localProgress = localStorage.getItem(`demoProgress_${user.uid}`)
        if (localProgress) {
          const parsed = JSON.parse(localProgress)
          console.log('💾 Loading demo progress from localStorage:', parsed)
          setState(prev => ({ ...prev, ...parsed }))
          logDemoAction('LOAD_PROGRESS_SUCCESS', { source: 'localStorage', progress: parsed })
        } else {
          logDemoAction('LOAD_PROGRESS_SUCCESS', { source: 'none', message: 'No existing progress found' })
        }
      }
    } catch (error) {
      console.error('❌ Error loading demo progress:', error)
      setError('Failed to load demo progress')
      logDemoAction('LOAD_PROGRESS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }, [user?.uid, logDemoAction])

  /**
   * Save demo progress to Firebase and localStorage
   */
  const saveDemoProgress = useCallback(async (progressData: Partial<DemoProgress>) => {
    if (!user?.uid) return

    try {
      logDemoAction('SAVE_PROGRESS_START', progressData)

      // Save to localStorage immediately for offline support
      const localData = { ...state, ...progressData }
      localStorage.setItem(`demoProgress_${user.uid}`, JSON.stringify(localData))

      // Save to Firebase for persistence
      const demoProgress: DemoProgress = {
        hasSeenDemo: true,
        completedSteps: state.completedSteps,
        lastStepReached: state.currentStep,
        skipCount: state.skippedSteps.length,
        isCompleted: state.isCompleted,
        firstStartedAt: startTimeRef.current,
        totalTimeSpent: state.totalTimeSpent + (Date.now() - state.stepStartTime),
        ...progressData
      }

      await userService.updateUserProfile(user.uid, { demoProgress })
      console.log('✅ Demo progress saved successfully:', demoProgress)
      logDemoAction('SAVE_PROGRESS_SUCCESS', demoProgress)
    } catch (error) {
      console.error('❌ Error saving demo progress:', error)
      logDemoAction('SAVE_PROGRESS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }, [user?.uid, state, logDemoAction])

  /**
   * Check if user should see demo (first-time user detection)
   * ONLY auto-shows for truly new users who have never seen the demo
   */
  const shouldShowDemo = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) return false

    try {
      const userProfile = await userService.getUserProfile(user.uid)
      const demoProgress = userProfile?.demoProgress
      
      // Only show demo for truly new users who have NEVER seen the demo
      // Once a user has seen the demo (completed OR skipped), they must manually trigger it
      const shouldShow = !demoProgress?.hasSeenDemo && !demoProgress?.isCompleted
      
      logDemoAction('SHOULD_SHOW_DEMO_CHECK', { 
        shouldShow, 
        hasSeenDemo: demoProgress?.hasSeenDemo,
        isCompleted: demoProgress?.isCompleted,
        skipCount: demoProgress?.skipCount,
        reasoning: shouldShow ? 'New user - never seen demo' : 'Existing user - manual trigger required'
      })
      
      return shouldShow
    } catch (error) {
      console.error('❌ Error checking if should show demo:', error)
      logDemoAction('SHOULD_SHOW_DEMO_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }, [user?.uid, logDemoAction])

  // Load progress when user changes
  useEffect(() => {
    if (user?.uid) {
      loadDemoProgress()
    }
  }, [user?.uid, loadDemoProgress])

  /**
   * Demo tour actions implementation
   */
  const actions: DemoTourActions = {
    openDemo: useCallback(() => {
      logDemoAction('OPEN_DEMO')
      setState(prev => ({ 
        ...prev, 
        isOpen: true, 
        stepStartTime: Date.now() 
      }))
      saveDemoProgress({ hasSeenDemo: true, firstStartedAt: Date.now() })
    }, [logDemoAction, saveDemoProgress]),

    startDemo: useCallback(() => {
      logDemoAction('START_DEMO_MANUAL', { triggeredBy: 'user_button' })
      setState(prev => ({ 
        ...prev, 
        isOpen: true, 
        currentStep: 1,
        isCompleted: false, // Reset completion status for manual restart
        stepStartTime: Date.now(),
        canGoBack: false,
        canGoForward: true,
        completedSteps: [],
        skippedSteps: [],
        totalTimeSpent: 0 // Reset timer for fresh start
      }))
      saveDemoProgress({ 
        hasSeenDemo: true, 
        isCompleted: false, // Reset completion status for manual restart
        firstStartedAt: Date.now(),
        lastStepReached: 1,
        completedSteps: [],
        skipCount: 0 // Reset skip count for manual start
      })
    }, [logDemoAction, saveDemoProgress]),

    closeDemo: useCallback(() => {
      setState(prev => {
        logDemoAction('CLOSE_DEMO', { 
          timeSpentOnStep: Date.now() - prev.stepStartTime,
          currentStep: prev.currentStep 
        })
        
        return { 
          ...prev, 
          isOpen: false,
          totalTimeSpent: prev.totalTimeSpent + (Date.now() - prev.stepStartTime)
        }
      })
    }, [logDemoAction]),

    nextStep: useCallback(() => {
      setState(prev => {
        if (prev.currentStep < prev.totalSteps) {
          const nextStep = (prev.currentStep + 1) as DemoStep
          const timeSpent = Date.now() - prev.stepStartTime
          
          logDemoAction('NEXT_STEP', { 
            fromStep: prev.currentStep, 
            toStep: nextStep,
            timeSpentOnStep: timeSpent 
          })
          
          // Save progress with current state
          saveDemoProgress({ 
            lastStepReached: Math.max(prev.currentStep, nextStep),
            totalTimeSpent: prev.totalTimeSpent + timeSpent
          })
          
          return {
            ...prev,
            currentStep: nextStep,
            canGoBack: nextStep > 1,
            canGoForward: nextStep < prev.totalSteps,
            stepStartTime: Date.now(),
            totalTimeSpent: prev.totalTimeSpent + timeSpent
          }
        }
        return prev
      })
    }, [logDemoAction, saveDemoProgress]),

    previousStep: useCallback(() => {
      setState(prev => {
        if (prev.currentStep > 1) {
          const prevStep = (prev.currentStep - 1) as DemoStep
          const timeSpent = Date.now() - prev.stepStartTime
          
          logDemoAction('PREVIOUS_STEP', { 
            fromStep: prev.currentStep, 
            toStep: prevStep,
            timeSpentOnStep: timeSpent 
          })
          
          return {
            ...prev,
            currentStep: prevStep,
            canGoBack: prevStep > 1,
            canGoForward: true,
            stepStartTime: Date.now(),
            totalTimeSpent: prev.totalTimeSpent + timeSpent
          }
        }
        return prev
      })
    }, [logDemoAction]),

    goToStep: useCallback((step: DemoStep) => {
      setState(prev => {
        const timeSpent = Date.now() - prev.stepStartTime
        
        logDemoAction('GO_TO_STEP', { 
          fromStep: prev.currentStep, 
          toStep: step,
          timeSpentOnStep: timeSpent 
        })
        
        // Save progress with current state
        saveDemoProgress({ 
          lastStepReached: Math.max(prev.currentStep, step),
          totalTimeSpent: prev.totalTimeSpent + timeSpent
        })
        
        return {
          ...prev,
          currentStep: step,
          canGoBack: step > 1,
          canGoForward: step < prev.totalSteps,
          stepStartTime: Date.now(),
          totalTimeSpent: prev.totalTimeSpent + timeSpent
        }
      })
    }, [logDemoAction, saveDemoProgress]),

    skipStep: useCallback(() => {
      setState(prev => {
        const timeSpent = Date.now() - prev.stepStartTime
        
        logDemoAction('SKIP_STEP', { 
          skippedStep: prev.currentStep,
          timeSpentOnStep: timeSpent 
        })
        
        // Auto-advance to next step if not on last step
        if (prev.currentStep < prev.totalSteps) {
          const nextStep = (prev.currentStep + 1) as DemoStep
          
          // Save progress with updated state
          saveDemoProgress({ 
            lastStepReached: Math.max(prev.currentStep, nextStep),
            totalTimeSpent: prev.totalTimeSpent + timeSpent
          })
          
          return {
            ...prev,
            skippedSteps: [...prev.skippedSteps, prev.currentStep],
            currentStep: nextStep,
            canGoBack: nextStep > 1,
            canGoForward: nextStep < prev.totalSteps,
            stepStartTime: Date.now(),
            totalTimeSpent: prev.totalTimeSpent + timeSpent
          }
        } else {
          // If on last step, just mark as skipped without advancing
          return {
            ...prev,
            skippedSteps: [...prev.skippedSteps, prev.currentStep],
            totalTimeSpent: prev.totalTimeSpent + timeSpent
          }
        }
      })
    }, [logDemoAction, saveDemoProgress]),

    skipDemo: useCallback(() => {
      const timeSpent = Date.now() - state.stepStartTime
      
      logDemoAction('SKIP_DEMO', { 
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        totalTimeSpent: state.totalTimeSpent + timeSpent
      })
      
      setState(prev => ({ 
        ...prev, 
        isOpen: false,
        totalTimeSpent: prev.totalTimeSpent + timeSpent
      }))
      
      // Mark demo as seen and skipped so it doesn't show again
      saveDemoProgress({ 
        hasSeenDemo: true,
        isCompleted: true, // Mark as completed to prevent re-showing
        skipCount: (state.skippedSteps.length + 1),
        totalTimeSpent: state.totalTimeSpent + timeSpent,
        completionDate: Date.now() // Mark when it was skipped
      })
    }, [state, logDemoAction, saveDemoProgress]),

    completeStep: useCallback(() => {
      if (!state.completedSteps.includes(state.currentStep)) {
        const timeSpent = Date.now() - state.stepStartTime
        
        logDemoAction('COMPLETE_STEP', { 
          completedStep: state.currentStep,
          timeSpentOnStep: timeSpent 
        })
        
        setState(prev => ({
          ...prev,
          completedSteps: [...prev.completedSteps, state.currentStep],
          totalTimeSpent: prev.totalTimeSpent + timeSpent
        }))
        
        saveDemoProgress({ 
          completedSteps: [...state.completedSteps, state.currentStep],
          totalTimeSpent: state.totalTimeSpent + timeSpent
        })
      }
    }, [state, logDemoAction, saveDemoProgress]),

    completDemo: useCallback(() => {
      const timeSpent = Date.now() - state.stepStartTime
      
      logDemoAction('COMPLETE_DEMO', { 
        completedSteps: state.completedSteps,
        skippedSteps: state.skippedSteps,
        totalTimeSpent: state.totalTimeSpent + timeSpent
      })
      
      setState(prev => ({ 
        ...prev, 
        isCompleted: true, 
        isOpen: false,
        totalTimeSpent: prev.totalTimeSpent + timeSpent
      }))
      
      saveDemoProgress({ 
        isCompleted: true,
        completionDate: Date.now(),
        totalTimeSpent: state.totalTimeSpent + timeSpent
      })
    }, [state, logDemoAction, saveDemoProgress]),

    resetDemo: useCallback(() => {
      logDemoAction('RESET_DEMO')
      
      setState({
        isOpen: false,
        currentStep: 1,
        totalSteps: 8,
        isCompleted: false,
        canGoBack: false,
        canGoForward: true,
        completedSteps: [],
        skippedSteps: [],
        stepStartTime: Date.now(),
        totalTimeSpent: 0
      })
      
      if (user?.uid) {
        localStorage.removeItem(`demoProgress_${user.uid}`)
        saveDemoProgress({ 
          hasSeenDemo: false,
          completedSteps: [],
          lastStepReached: 1,
          skipCount: 0,
          isCompleted: false,
          totalTimeSpent: 0
        })
      }
    }, [user?.uid, logDemoAction, saveDemoProgress])
  }

  return {
    state,
    actions,
    isLoading,
    error,
    shouldShowDemo,
    DEMO_SAMPLE_DATA
  }
} 