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
export type DemoInteractionStep = 
  | 'idle' 
  | 'highlightNewDocument' 
  | 'showCreatedDocument' 
  | 'highlightWritingGoals' 
  | 'openWritingGoalsModal'
  | 'highlightEditor'
  | 'pasteContent'
  | 'showContentAdded';

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
  /** Handle the primary action for the current interactive step */
  handleInteractiveStepAction: (step: DemoStep) => void;
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
  /** Sample sales funnel document content - imported from test-files/sales_funnel_document.md */
  sampleDocument: `# Sales Funnel Strategy Document

## Executive Summary

This document outlines a comprehensive sales funnel strategy designed to guide prospects through a systematic journey from initial awareness to loyal customers. The funnel framework presented here focuses on maximizing conversion rates at each stage while building sustainable relationships that drive long-term revenue growth.

Our multi-stage approach addresses the modern buyer's journey, incorporating digital touchpoints, personalized messaging, and data-driven optimization to ensure prospects receive the right message at the right time through their preferred channels.

## Funnel Overview & Objectives

**Primary Objective:** Convert 15% of top-of-funnel traffic into qualified leads and achieve a 8% lead-to-customer conversion rate within the next 12 months.

**Target Audience:** B2B decision-makers aged 35-55 in mid-market companies with 100-500 employees, primarily in technology, manufacturing, and professional services sectors.

**Revenue Goal:** Generate $2.4M in new revenue with an average deal size of $15,000 and customer lifetime value of $45,000.

## Stage-by-Stage Breakdown

### Stage 1: Awareness (Top of Funnel)

**Objective:** Generate 10,000 monthly visitors and build brand recognition among target demographics.

**Tactics:**
- Content marketing through industry-specific blog posts, whitepapers, and research reports
- Search engine optimization targeting high-intent keywords with monthly search volumes of 1,000+
- Social media presence on LinkedIn and Twitter with thought leadership content
- Paid advertising campaigns on Google Ads and LinkedIn with a focus on educational content
- Podcast appearances and speaking engagements at industry conferences

**Key Metrics:** Website traffic, social media reach, brand mention tracking, organic search rankings, cost per click, and impression share.

**Content Examples:** "The Complete Guide to Digital Transformation," industry trend reports, comparison guides, and educational webinars addressing common pain points.

### Stage 2: Interest (Middle of Funnel)

**Objective:** Convert 20% of website visitors into engaged prospects through valuable content offers.

**Tactics:**
- Lead magnets including detailed case studies, ROI calculators, and implementation templates
- Email nurture sequences with educational content delivered over 6-8 weeks
- Retargeting campaigns for website visitors who engaged with specific content pieces
- Interactive content such as assessments, quizzes, and configurators
- Personalized content recommendations based on browsing behavior and demographics

**Key Metrics:** Email open rates (target: 25%), click-through rates (target: 4%), content engagement time, lead magnet conversion rates, and nurture sequence progression.

**Content Examples:** "30-Day Implementation Roadmap," personalized assessment results, exclusive industry insights, and invitation-only virtual roundtables.

### Stage 3: Consideration (Middle of Funnel)

**Objective:** Qualify leads and move 40% of engaged prospects to sales-ready status.

**Tactics:**
- Product demonstrations and personalized consultations
- Free trial offerings with guided onboarding experiences
- Comparison guides highlighting competitive advantages
- Customer success stories and detailed case studies with ROI metrics
- Sales development representative outreach with value-driven messaging

**Key Metrics:** Demo request rates, trial sign-up conversion, lead scoring advancement, sales qualified lead (SQL) conversion rate, and pipeline velocity.

**Content Examples:** Interactive product tours, ROI calculators with industry benchmarks, peer review platforms, and reference customer testimonials.

### Stage 4: Purchase (Bottom of Funnel)

**Objective:** Close 25% of sales-qualified leads within a 45-day sales cycle.

**Tactics:**
- Consultative selling approach with needs-based solution presentations
- Proposal customization addressing specific business requirements and ROI projections
- Limited-time offers and seasonal promotions to create urgency
- Multiple payment options and flexible contract terms
- Executive briefings and stakeholder alignment sessions

**Key Metrics:** Proposal acceptance rate, average deal size, sales cycle length, win rate by lead source, and revenue per customer.

**Sales Tools:** CRM integration, proposal automation, e-signature capabilities, and real-time pricing configurators.

### Stage 5: Retention & Advocacy (Post-Purchase)

**Objective:** Achieve 90% customer retention and generate 30% of new leads through referrals within 18 months.

**Tactics:**
- Comprehensive onboarding program with dedicated success managers
- Regular check-ins and performance reviews with actionable insights
- Loyalty programs and exclusive access to new features or services
- Customer advisory boards and co-marketing opportunities
- Referral incentive programs with meaningful rewards for both parties

**Key Metrics:** Customer satisfaction scores (target: 8.5/10), net promoter score (target: 50+), retention rate, upsell revenue, and referral conversion rates.

**Retention Tools:** Customer success platforms, usage analytics, satisfaction surveys, and automated renewal processes.

## Technology Stack & Tools

**Customer Relationship Management:** Salesforce or HubSpot for lead tracking, pipeline management, and customer data centralization.

**Marketing Automation:** Marketo or Pardot for email nurturing, lead scoring, and campaign attribution.

**Analytics Platform:** Google Analytics 4 and Adobe Analytics for comprehensive funnel performance tracking and conversion optimization.

**Content Management:** WordPress or Drupal for website management, with integrated A/B testing capabilities.

**Communication Tools:** Slack for internal coordination, Zoom for customer interactions, and Calendly for meeting scheduling.

## Key Performance Indicators

**Funnel Metrics:**
- Overall conversion rate from visitor to customer: 1.2%
- Cost per acquisition: $1,250
- Customer lifetime value to acquisition cost ratio: 36:1
- Average sales cycle: 42 days
- Monthly recurring revenue growth: 15%

**Stage-Specific Metrics:**
- Awareness to Interest: 18% conversion rate
- Interest to Consideration: 35% conversion rate  
- Consideration to Purchase: 22% conversion rate
- Customer retention rate: 88%
- Referral rate: 28%

## Budget Allocation & Resource Requirements

**Total Monthly Budget:** $85,000

**Resource Distribution:**
- Paid advertising: 40% ($34,000)
- Content creation and marketing: 25% ($21,250)
- Marketing technology and tools: 15% ($12,750)
- Personnel and contractor costs: 15% ($12,750)
- Events and partnerships: 5% ($4,250)

**Team Requirements:** Marketing manager, content strategist, paid advertising specialist, marketing operations analyst, and sales development representative.

## Optimization & Testing Strategy

**Continuous Improvement Process:** Monthly funnel analysis with quarterly strategic reviews and annual comprehensive audits.

**A/B Testing Focus Areas:**
- Landing page headlines and call-to-action buttons
- Email subject lines and send times
- Ad creative and targeting parameters
- Lead magnet formats and presentation
- Pricing page layouts and proposal templates

**Data Collection:** Multi-touch attribution modeling, cohort analysis, and customer journey mapping to identify optimization opportunities and budget reallocation needs.

**Success Measurement:** Weekly performance reviews, monthly cross-functional alignment meetings, and quarterly business reviews with executive stakeholders to ensure funnel performance aligns with overall business objectives.`,

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

  const handleInteractiveStepAction = useCallback((step: DemoStep) => {
    // Simplified demo-only logic - all users get the same demo experience
    logDemoAction('HANDLE_INTERACTIVE_STEP', { step, userType: 'demo_mode' });

    switch (step) {
      case 1:
        logDemoAction('INTERACTIVE_STEP_1_DEMO');
        setInteractionStep('openWritingGoalsModal');
        hideDemoModal();
        break;
      case 2:
        logDemoAction('INTERACTIVE_STEP_2_DEMO');
        setInteractionStep('pasteContent');
        hideDemoModal();
        break;
      default:
        logDemoAction('INTERACTIVE_STEP_UNKNOWN', { step });
    }
  }, [logDemoAction, hideDemoModal]);

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
    handleInteractiveStepAction,
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