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

/** The sub-step for interactive UI guidance */
export type DemoInteractionStep = 'idle' | 'highlightNewDocument' | 'showCreatedDocument' | 'highlightWritingGoals' | 'openWritingGoalsModal';

/**
 * Demo tour state interface for complete state management
 */
export interface DemoTourState {
  /** Whether the demo modal is currently open */
  isOpen: boolean
  /** Whether the demo modal is VISIBLE (can be open but not visible during UI interaction) */
  isDemoModalVisible: boolean;
  /** Current step in an interactive UI sequence */
  interactionStep: DemoInteractionStep;
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
  /** Hide the demo modal for UI interaction */
  hideDemoModal: () => void;
  /** Show the demo modal after UI interaction */
  showDemoModal: () => void;
  /** Set the current step for UI interaction */
  setInteractionStep: (step: DemoInteractionStep) => void;
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

  /** Sample writing goals for demo - compatible with WritingGoals interface */
  sampleGoals: {
    audience: 'stakeholders' as const,
    formality: 'professional' as const,
    domain: 'marketing-copy' as const,
    intent: 'convert' as const
  },

  /** Sample writing goals data for display purposes */
  sampleGoalsDisplay: {
    targetAudience: "B2B decision-makers aged 35-55",
    primaryObjective: "Generate qualified leads and drive conversions",
    toneGuidelines: "Professional yet approachable",
    keyMessages: ["ROI-focused solutions", "Proven results", "Expert guidance"],
    callToAction: "Schedule a consultation"
  },

  /** Sample document title for demo */
  sampleDocumentTitle: "Sales Funnel Strategy - Demo Document",

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
    isDemoModalVisible: false,
    interactionStep: 'idle',
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
   * Save demo progress to Firebase and localStorage
   */
  const saveDemoProgress = useCallback((progressData: Partial<DemoProgress>) => {
    if (!user?.uid) return

    const currentProgressState: DemoProgress = {
      hasSeenDemo: true,
      completedSteps: state.completedSteps,
      lastStepReached: state.currentStep,
      skipCount: state.skippedSteps.length,
      isCompleted: state.isCompleted,
      totalTimeSpent: state.totalTimeSpent,
      firstStartedAt: startTimeRef.current,
    };

    const finalProgress = { ...currentProgressState, ...progressData };

    logDemoAction('SAVE_PROGRESS_START', finalProgress)

    // Save to localStorage immediately for offline support
    const localData = { ...state, ...finalProgress }
    localStorage.setItem(`demoProgress_${user.uid}`, JSON.stringify(localData))

    // Save to Firebase (don't await, let it run in background)
    userService.updateUserProfile(user.uid, { demoProgress: finalProgress })
      .then(() => logDemoAction('SAVE_PROGRESS_SUCCESS', { dest: 'firebase', progress: finalProgress }))
      .catch(err => {
        logDemoAction('SAVE_PROGRESS_ERROR', { dest: 'firebase', error: err instanceof Error ? err.message : 'Unknown error' })
      })
  }, [user?.uid, state, logDemoAction])

  /**
   * Actions to control the demo tour
   */

  const openDemo = useCallback(() => {
    setState(prev => {
      if (prev.isOpen) return prev // Already open
      
      const timeNow = Date.now()
      const newTotalTime = prev.isCompleted ? 0 : prev.totalTimeSpent
      
      const newState = {
        ...prev,
        isOpen: true,
        isDemoModalVisible: true,
        interactionStep: 'idle' as DemoInteractionStep,
        currentStep: prev.isCompleted ? 1 : prev.currentStep,
        isCompleted: false,
        completedSteps: prev.isCompleted ? [] : prev.completedSteps,
        skippedSteps: prev.isCompleted ? [] : prev.skippedSteps,
        totalTimeSpent: newTotalTime,
        stepStartTime: timeNow
      }
      
      logDemoAction('OPEN_DEMO', { fromStep: prev.currentStep, totalTime: newTotalTime }, newState)
      
      return newState
    })
  }, [logDemoAction])

  const startDemo = useCallback(() => {
    logDemoAction('START_DEMO_MANUAL')
    openDemo()
  }, [openDemo, logDemoAction])

  const closeDemo = useCallback(() => {
    setState(prev => {
      if (!prev.isOpen) return prev; // Already closed
      
      const timeNow = Date.now()
      const stepDuration = (timeNow - prev.stepStartTime) / 1000
      const newTotalTimeSpent = prev.totalTimeSpent + stepDuration

      const newState = { 
        ...prev, 
        isOpen: false, 
        isDemoModalVisible: false,
        interactionStep: 'idle' as DemoInteractionStep,
        totalTimeSpent: newTotalTimeSpent 
      }
      
      logDemoAction('CLOSE_DEMO', { atStep: prev.currentStep, totalTime: newTotalTimeSpent }, newState)
      
      // Persist final time on close
      saveDemoProgress({ 
        lastStepReached: prev.currentStep,
        totalTimeSpent: newTotalTimeSpent
      })
      
      return newState
    })
  }, [saveDemoProgress, logDemoAction])

  const hideDemoModal = useCallback(() => {
    setState(prev => {
      if (!prev.isDemoModalVisible) return prev;
      logDemoAction('HIDE_DEMO_MODAL', { atStep: prev.currentStep });
      return { ...prev, isDemoModalVisible: false };
    });
  }, [logDemoAction]);

  const showDemoModal = useCallback(() => {
    setState(prev => {
      if (prev.isDemoModalVisible) return prev;
      logDemoAction('SHOW_DEMO_MODAL', { atStep: prev.currentStep });
      return { ...prev, isDemoModalVisible: true };
    });
  }, [logDemoAction]);

  const setInteractionStep = useCallback((step: DemoInteractionStep) => {
    setState(prev => {
      logDemoAction('SET_INTERACTION_STEP', { interactionStep: step, atStep: prev.currentStep });
      return { ...prev, interactionStep: step };
    });
  }, [logDemoAction]);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (!prev.canGoForward || prev.currentStep >= prev.totalSteps) return prev

      const timeNow = Date.now()
      const stepDuration = (timeNow - prev.stepStartTime) / 1000
      const newTotalTimeSpent = prev.totalTimeSpent + stepDuration
      const newStep = (prev.currentStep + 1) as DemoStep

      const newCompletedSteps = [...prev.completedSteps]
      if (!newCompletedSteps.includes(prev.currentStep)) {
        newCompletedSteps.push(prev.currentStep)
      }

      const newState = {
        ...prev,
        currentStep: newStep,
        canGoBack: true,
        canGoForward: newStep < prev.totalSteps,
        completedSteps: newCompletedSteps,
        stepStartTime: timeNow,
        totalTimeSpent: newTotalTimeSpent,
        interactionStep: 'idle' as DemoInteractionStep,
        isDemoModalVisible: true,
      }
      
      logDemoAction('NEXT_STEP', { from: prev.currentStep, to: newStep, totalTime: newTotalTimeSpent }, newState)
      
      saveDemoProgress({
        lastStepReached: newStep,
        completedSteps: newCompletedSteps,
        totalTimeSpent: newTotalTimeSpent
      })
      
      return newState
    })
  }, [saveDemoProgress, logDemoAction])

  const previousStep = useCallback(() => {
    setState(prev => {
      if (!prev.canGoBack)
        return prev

      const timeNow = Date.now()
      const stepDuration = (timeNow - prev.stepStartTime) / 1000
      const newTotalTimeSpent = prev.totalTimeSpent + stepDuration
      const newStep = (prev.currentStep - 1) as DemoStep

      const newState = {
        ...prev,
        currentStep: newStep,
        canGoBack: newStep > 1,
        canGoForward: true,
        stepStartTime: timeNow,
        totalTimeSpent: newTotalTimeSpent,
        interactionStep: 'idle' as DemoInteractionStep,
        isDemoModalVisible: true,
      }
      
      logDemoAction('PREVIOUS_STEP', { from: prev.currentStep, to: newStep, totalTime: newTotalTimeSpent }, newState)
      
      saveDemoProgress({
        lastStepReached: newStep,
        totalTimeSpent: newTotalTimeSpent
      })

      return newState
    })
  }, [saveDemoProgress, logDemoAction])

  const goToStep = useCallback((step: DemoStep) => {
    setState(prev => {
      if (step === prev.currentStep) return prev

      const timeNow = Date.now()
      const stepDuration = (timeNow - prev.stepStartTime) / 1000
      const newTotalTimeSpent = prev.totalTimeSpent + stepDuration
      
      const newCompletedSteps = [...prev.completedSteps]
      if (!newCompletedSteps.includes(prev.currentStep)) {
        newCompletedSteps.push(prev.currentStep)
      }

      const newState = {
        ...prev,
        currentStep: step,
        canGoBack: step > 1,
        canGoForward: step < prev.totalSteps,
        completedSteps: newCompletedSteps,
        stepStartTime: timeNow,
        totalTimeSpent: newTotalTimeSpent,
        interactionStep: 'idle' as DemoInteractionStep,
        isDemoModalVisible: true,
      }
      
      logDemoAction('GOTO_STEP', { from: prev.currentStep, to: step, totalTime: newTotalTimeSpent }, newState)
      
      saveDemoProgress({
        lastStepReached: step,
        completedSteps: newCompletedSteps,
        totalTimeSpent: newTotalTimeSpent
      })

      return newState
    })
  }, [saveDemoProgress, logDemoAction])

  const skipStep = useCallback(() => {
    setState(prev => {
      const newSkippedSteps = [...prev.skippedSteps]
      if (!newSkippedSteps.includes(prev.currentStep)) {
        newSkippedSteps.push(prev.currentStep)
      }
      logDemoAction('SKIP_STEP', { step: prev.currentStep, skipped: newSkippedSteps })
      
      if (prev.currentStep >= prev.totalSteps) {
        // If on the last step, skipping completes the demo
        const isDemoNowCompleted = true
        saveDemoProgress({
          isCompleted: isDemoNowCompleted,
          completedSteps: prev.completedSteps,
          skipCount: newSkippedSteps.length
        })
        return { ...prev, isOpen: false, isDemoModalVisible: false, isCompleted: isDemoNowCompleted, skippedSteps: newSkippedSteps }
      }
      
      // Otherwise, just go to the next step
      nextStep()
      // The state update will be handled by nextStep, but we need to pass the skipped steps
      return { ...prev, skippedSteps: newSkippedSteps }
    })
  }, [nextStep, logDemoAction, saveDemoProgress])

  const skipDemo = useCallback(() => {
    setState(prev => {
      logDemoAction('SKIP_DEMO', { fromStep: prev.currentStep })
      
      const isDemoNowCompleted = true
      const newSkippedSteps = [...prev.skippedSteps]
      for (let i = prev.currentStep; i <= prev.totalSteps; i++) {
        if (!newSkippedSteps.includes(i)) {
          newSkippedSteps.push(i)
        }
      }

      saveDemoProgress({ 
        isCompleted: isDemoNowCompleted,
        skipCount: newSkippedSteps.length
      })
      
      return { ...prev, isOpen: false, isDemoModalVisible: false, isCompleted: isDemoNowCompleted, skippedSteps: newSkippedSteps }
    })
  }, [saveDemoProgress, logDemoAction])

  const completeStep = useCallback((step: DemoStep) => {
    setState(prev => {
      const newCompletedSteps = [...prev.completedSteps]
      if (!newCompletedSteps.includes(step)) {
        newCompletedSteps.push(step)
      }
      logDemoAction('COMPLETE_STEP', { step, completed: newCompletedSteps })
      saveDemoProgress({ completedSteps: newCompletedSteps })
      return { ...prev, completedSteps: newCompletedSteps }
    })
  }, [logDemoAction, saveDemoProgress])

  const completDemo = useCallback(() => {
    setState(prev => {
      logDemoAction('COMPLETE_DEMO', { fromStep: prev.currentStep })
      const isDemoNowCompleted = true
      const newCompletedSteps = [...prev.completedSteps]
      if (!newCompletedSteps.includes(prev.currentStep)) {
        newCompletedSteps.push(prev.currentStep)
      }
      
      saveDemoProgress({
        isCompleted: isDemoNowCompleted,
        completedSteps: newCompletedSteps
      })
      
      return { ...prev, isOpen: false, isDemoModalVisible: false, isCompleted: isDemoNowCompleted, completedSteps: newCompletedSteps }
    })
  }, [saveDemoProgress, logDemoAction])
  
  const resetDemo = useCallback(() => {
    const resetState = {
      isOpen: true,
      isDemoModalVisible: true,
      interactionStep: 'idle' as DemoInteractionStep,
      currentStep: 1 as DemoStep,
      totalSteps: 8 as const,
      isCompleted: false,
      canGoBack: false,
      canGoForward: true,
      completedSteps: [],
      skippedSteps: [],
      stepStartTime: Date.now(),
      totalTimeSpent: 0
    }
    setState(resetState)
    logDemoAction('RESET_DEMO')
    saveDemoProgress({
      isCompleted: false,
      completedSteps: [],
      skipCount: 0,
      lastStepReached: 1,
      totalTimeSpent: 0
    })
  }, [saveDemoProgress, logDemoAction])

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
   * Automatically trigger demo for new users or based on query param
   */
  useEffect(() => {
    const shouldAutoTrigger = new URLSearchParams(window.location.search).get('demo') === 'true'
    if (shouldAutoTrigger && !state.isOpen) {
      logDemoAction('AUTO_TRIGGER_DEMO', { reason: 'query_param' })
      openDemo()
    }
  }, [state.isOpen, openDemo, logDemoAction])

  // Effect to load progress when user is available
  useEffect(() => {
    loadDemoProgress()
  }, [loadDemoProgress])
  
  // New user detection logic
  const isNewUser = user?.metadata.creationTime === user?.metadata.lastSignInTime;

  // Effect to auto-trigger demo for new users
  useEffect(() => {
    if (user?.uid && isNewUser && !state.isOpen) {
      const timer = setTimeout(() => {
        logDemoAction('AUTO_TRIGGER_DEMO', { userId: user.uid, isNewUser })
        openDemo()
      }, 3000) // 3-second delay

      return () => clearTimeout(timer)
    }
  }, [user, isNewUser, state.isOpen, openDemo, logDemoAction])


  return { 
    ...state,
    isLoading, 
    error,
    openDemo,
    startDemo,
    closeDemo,
    hideDemoModal,
    showDemoModal,
    setInteractionStep,
    nextStep,
    previousStep,
    goToStep,
    skipStep,
    skipDemo,
    completeStep,
    completDemo,
    resetDemo 
  }
} 