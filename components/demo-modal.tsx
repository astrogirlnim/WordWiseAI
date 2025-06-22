'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  SkipForward, 
  X, 
  Check,
  Target,
  PenTool,
  Lightbulb,
  Bot,
  History,
  Settings,
  Share2,
  FolderOpen,
  Sparkles,
  Crown,
  Users,
  Eye,
  MessageSquare,
  Edit,
  FileText
} from 'lucide-react'
import { useDemoTourContext } from '@/lib/demo-tour-context'
import { type DemoStep } from '@/hooks/use-demo-tour'
import { cn } from '@/lib/utils'

/**
 * Demo Modal Component
 * 
 * Provides a comprehensive 8-step guided tour through WordWise AI features:
 * 1. Document Creation & Goal Setting
 * 2. Writing/Copy-Paste Markdown (Sales Funnel)  
 * 3. Grammar Suggestions & Markdown Preview
 * 4. AI Funnel Suggestions
 * 5. Version Control History
 * 6. Settings & Glossary Upload
 * 7. Document Management
 * 8. Document Sharing
 * 
 * Features:
 * - Responsive design with mobile-first approach
 * - Full keyboard navigation and accessibility support
 * - Progress tracking with visual indicators
 * - Extensive logging for analytics
 * - Skip/complete functionality
 * - Professional WordWise AI branding
 */

interface DemoStepConfig {
  id: DemoStep
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
  actionText?: string
  completionText?: string
}

/**
 * Step content components for each demo step
 * Each component provides rich educational content with visuals
 */
const StepContent = {
  Step1: () => {
    const { user } = useAuth()
    const demoTour = useDemoTourContext()
    const [isLoading, setIsLoading] = useState(false)

    const userType = !user && window.location.search.includes('demo=true')
      ? 'demo_mode'
      : 'authenticated_user';

    const handleAction = () => {
      setIsLoading(true);
      // Centralized logic is now in the hook
      demoTour.handleInteractiveStepAction(1);
      
      // Spinner display timeout
      setTimeout(() => setIsLoading(false), 1500);
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                Welcome to WordWise AI!
              </h4>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-200">
                This tour will guide you through creating a document and setting writing goals.
              </p>
            </div>
          </div>
        </div>

        {/* User Type Specific Instructions */}
        {userType === 'demo_mode' ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Demo Mode Active
                </p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                  We&apos;ll create a sample document with pre-filled writing goals to show you how everything works.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <Eye className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Guided Tour
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-200">
                  We&apos;ll highlight parts of the UI to show you how everything works without changing your data.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <h5 className="font-medium">What you&apos;ll learn:</h5>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {userType === 'demo_mode' 
                ? 'How to create documents with sample data' 
                : 'How to navigate to the writing goals feature'}
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {userType === 'demo_mode' 
                ? 'See pre-filled writing goals with example content' 
                : 'How to set writing goals for your documents'}
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {userType === 'demo_mode' 
                ? 'Experience the complete document creation flow' 
                : 'Understanding the writing goals interface'}
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleAction}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
                {userType === 'demo_mode' ? 'Creating Sample Document...' : 'Highlighting UI...'}
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Set Writing Goals
              </>
            )}
          </Button>
        </div>
      </div>
    );
  },

  Step2: () => {
    const { user } = useAuth()
    const demoTour = useDemoTourContext()
    const [isLoading, setIsLoading] = useState(false)
    const [isComplete, setIsComplete] = useState(false)

    // Consistent user type detection: demo mode only for anonymous users
    const userType = !user ? 'demo_mode' : 'authenticated_user'

    // Enhanced logging for Step 2
    useEffect(() => {
      console.log('🎯 [Demo Step 2] Rendering with user type:', userType, {
        hasUser: !!user,
        userId: user?.uid,
        interactionStep: demoTour.interactionStep
      })
    }, [userType, user, demoTour.interactionStep])

    useEffect(() => {
      // Listen for content added signal for demo mode
      if (demoTour.interactionStep === 'showContentAdded') {
        console.log('🎯 [Demo Step 2] Content added signal received - completing step')
        setIsLoading(false);
        setIsComplete(true);
        setTimeout(() => {
          console.log('🎯 [Demo Step 2] Auto-advancing to Step 3')
          demoTour.completeStep(2);
          demoTour.nextStep();
          demoTour.setInteractionStep('idle');
        }, 2000);
      }
    }, [demoTour.interactionStep, demoTour]);

    const handleAction = () => {
      console.log('🎯 [Demo Step 2] Start Writing action triggered for user type:', userType)
      setIsLoading(true);
      demoTour.handleInteractiveStepAction(2);

      // For authenticated users, the spotlight will be shown.
      // We can turn off the loading state after a short delay.
      if (userType === 'authenticated_user') {
        console.log('🎯 [Demo Step 2] Authenticated user - will highlight editor after delay')
        setTimeout(() => {
          console.log('🎯 [Demo Step 2] Clearing loading state for authenticated user')
          setIsLoading(false)
        }, 1500);
      } else {
        console.log('🎯 [Demo Step 2] Demo mode - will simulate content paste')
      }
    };

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
          <div className="flex items-start gap-3">
            <PenTool className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
            <div>
              <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                Write & Import Content
              </h4>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-200">
                Use our powerful editor to write directly or paste existing content.
              </p>
            </div>
          </div>
        </div>

        {/* User Type Specific Instructions */}
        {userType === 'demo_mode' ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Demo Mode Active
                </p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                  We&apos;ll simulate adding a sample sales funnel document into the editor for you.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <Eye className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Guided Tour
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-200">
                  We&apos;ll highlight the editor area to show you where to start writing.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h5 className="font-medium">Editor features:</h5>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Rich markdown support with live preview
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Smart pagination for large documents
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Auto-save with conflict resolution
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleAction}
            className="w-full"
            size="lg"
            disabled={isLoading || isComplete}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
                {userType === 'demo_mode' ? 'Adding Sample Content...' : 'Highlighting Editor...'}
              </>
            ) : isComplete ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Content Added!
              </>
            ) : (
              <>
                <PenTool className="mr-2 h-4 w-4" />
                Start Writing
              </>
            )}
          </Button>
           {isComplete && (
            <p className="text-center text-sm text-green-600 dark:text-green-400">
              Sample content added! Moving to the next step...
            </p>
          )}
        </div>
      </div>
    )
  },

  Step3: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-100">
              Grammar & Style Checking
            </h4>
            <p className="mt-1 text-sm text-red-700 dark:text-red-200">
              Our advanced grammar engine (powered by Harper.js) provides real-time suggestions and markdown preview capabilities.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium">Grammar features:</h5>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Real-time grammar and spelling correction
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Style improvements and readability analysis
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Context-aware suggestions with explanations
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Live markdown preview with formatting
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
        <p className="text-xs text-purple-700 dark:text-purple-200">
          <Check className="mr-1 inline h-3 w-3" />
          Right-click any underlined text to see contextual grammar suggestions
        </p>
      </div>
    </div>
  ),

  Step4: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
              AI-Powered Suggestions
            </h4>
            <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-200">
              Generate targeted marketing copy based on your writing goals. Our AI creates headlines, CTAs, and complete sections.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium">AI capabilities:</h5>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Audience-specific headline generation
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Compelling call-to-action suggestions
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Content outline and structure recommendations
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Tone alignment and consistency checking
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
        <p className="text-xs text-green-700 dark:text-green-200">
          <Sparkles className="mr-1 inline h-3 w-3" />
          AI suggestions improve conversion rates by up to 25% for marketing content
        </p>
      </div>
    </div>
  ),

  Step5: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/20">
        <div className="flex items-start gap-3">
          <History className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600 dark:text-teal-400" />
          <div>
            <h4 className="font-semibold text-teal-900 dark:text-teal-100">
              Version Control & History
            </h4>
            <p className="mt-1 text-sm text-teal-700 dark:text-teal-200">
              Track every change with our comprehensive version control system. Never lose work and easily compare different drafts.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium">Version features:</h5>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Automatic version saving with timestamps
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Visual diff viewer for comparing changes
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            One-click restore to any previous version
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Author tracking and collaboration history
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800 dark:bg-cyan-950/20">
        <p className="text-xs text-cyan-700 dark:text-cyan-200">
          <History className="mr-1 inline h-3 w-3" />
          We&apos;ll show you multiple versions to demonstrate the comparison features
        </p>
      </div>
    </div>
  ),

  Step6: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/20">
        <div className="flex items-start gap-3">
          <Settings className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-600 dark:text-violet-400" />
          <div>
            <h4 className="font-semibold text-violet-900 dark:text-violet-100">
              Settings & Glossary
            </h4>
            <p className="mt-1 text-sm text-violet-700 dark:text-violet-200">
              Customize your experience and upload company glossaries for consistent terminology across all documents.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium">Customization options:</h5>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Upload CSV glossaries for brand consistency
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Configure auto-save intervals and preferences
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Set default writing goals and target audiences
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Manage account and team settings
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-pink-200 bg-pink-50 p-3 dark:border-pink-800 dark:bg-pink-950/20">
        <p className="text-xs text-pink-700 dark:text-pink-200">
          <Settings className="mr-1 inline h-3 w-3" />
          We&apos;ll demonstrate uploading a sample glossary file
        </p>
      </div>
    </div>
  ),

  Step7: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Document Management
            </h4>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              Organize and manage multiple documents with our powerful document dropdown. See owned documents, shared documents, and collaboration status at a glance.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium">Management features:</h5>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Crown className="h-3 w-3 text-yellow-500" />
            <span className="text-xs">Owned documents with full control</span>
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-3 w-3 text-blue-500" />
            <span className="text-xs">Shared documents with role indicators</span>
          </li>
          <li className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-gray-500" />
            <span className="text-xs">Permission levels: viewer, commenter, editor</span>
          </li>
          <li className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-green-500" />
            <span className="text-xs">Document metadata and status tracking</span>
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <h5 className="font-medium text-sm">Sample Document Library:</h5>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded border bg-background">
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">Sales Funnel Strategy</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="default" className="text-xs">owner</Badge>
              <Badge variant="outline" className="text-xs">final</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded border bg-background">
            <div className="flex items-center gap-2">
              <Edit className="h-3 w-3 text-blue-500" />
              <span className="font-medium">Marketing Campaign Draft</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">editor</Badge>
              <Badge variant="secondary" className="text-xs">draft</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded border bg-background">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3 text-green-500" />
              <span className="font-medium">Content Guidelines</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">commenter</Badge>
              <Badge variant="default" className="text-xs">review</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
        <p className="text-xs text-purple-700 dark:text-purple-200">
          <FolderOpen className="mr-1 inline h-3 w-3" />
          Click the document dropdown in the navigation to explore your document library
        </p>
      </div>
    </div>
  ),

  Step8: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <Share2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Document Sharing & Collaboration
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
              Share documents securely with team members, clients, or stakeholders with granular permission controls.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium">Sharing features:</h5>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Role-based permissions (viewer, commenter, editor)
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Secure token-based sharing links
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Email invitations with access management
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Real-time collaboration presence indicators
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
        <p className="text-xs text-emerald-700 dark:text-emerald-200">
          <Check className="mr-1 inline h-3 w-3" />
          Congratulations! You&apos;ve completed the WordWise AI tour
        </p>
      </div>
    </div>
  )
}

/**
 * Demo step configuration with all content and metadata
 */
const DEMO_STEPS: DemoStepConfig[] = [
  {
    id: 1,
    title: "Document Creation & Goals",
    description: "Start with clear writing objectives",
    icon: Target,
    content: <StepContent.Step1 />,
    actionText: "Set Writing Goals",
    completionText: "Goals configured!"
  },
  {
    id: 2,
    title: "Writing & Content Import", 
    description: "Use our powerful editor features",
    icon: PenTool,
    content: <StepContent.Step2 />,
    actionText: "Add Sample Content",
    completionText: "Content added!"
  },
  {
    id: 3,
    title: "Grammar & Preview",
    description: "Real-time suggestions and formatting",
    icon: Lightbulb,
    content: <StepContent.Step3 />,
    actionText: "Check Grammar",
    completionText: "Grammar checked!"
  },
  {
    id: 4,
    title: "AI Suggestions",
    description: "Generate targeted marketing copy",
    icon: Bot,
    content: <StepContent.Step4 />,
    actionText: "Generate Suggestions",
    completionText: "Suggestions generated!"
  },
  {
    id: 5,
    title: "Version Control",
    description: "Track and manage document changes",
    icon: History,
    content: <StepContent.Step5 />,
    actionText: "View History",
    completionText: "History reviewed!"
  },
  {
    id: 6,
    title: "Settings & Glossary",
    description: "Customize your experience",
    icon: Settings,
    content: <StepContent.Step6 />,
    actionText: "Upload Glossary",
    completionText: "Settings configured!"
  },
  {
    id: 7,
    title: "Document Management",
    description: "Organize and manage your documents",
    icon: FolderOpen,
    content: <StepContent.Step7 />,
    actionText: "Explore Documents",
    completionText: "Documents explored!"
  },
  {
    id: 8,
    title: "Document Sharing",
    description: "Collaborate with your team",
    icon: Share2,
    content: <StepContent.Step8 />,
    actionText: "Share Document",
    completionText: "Document shared!"
  }
]

/**
 * Step indicator component for visual progress tracking
 */
interface StepIndicatorProps {
  currentStep: DemoStep
  totalSteps: number
  completedSteps: number[]
  onStepClick?: (step: DemoStep) => void
  className?: string
}

function StepIndicator({ 
  currentStep, 
  totalSteps, 
  completedSteps, 
  onStepClick,
  className 
}: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => (i + 1) as DemoStep)

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {steps.map((stepNumber) => {
        const isCompleted = completedSteps.includes(stepNumber)
        const isCurrent = stepNumber === currentStep
        const isPast = stepNumber < currentStep

        return (
          <button
            key={stepNumber}
            onClick={() => onStepClick?.(stepNumber)}
            disabled={!onStepClick}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              {
                "bg-primary text-primary-foreground shadow-md": isCurrent,
                "bg-green-500 text-white": isCompleted && !isCurrent,
                "bg-muted text-muted-foreground hover:bg-muted/80": !isCurrent && !isCompleted && !isPast,
                "bg-muted/60 text-muted-foreground/60": isPast && !isCompleted,
                "cursor-pointer hover:scale-105": onStepClick && !isCurrent,
                "cursor-not-allowed": !onStepClick
              }
            )}
            aria-label={`Step ${stepNumber}: ${DEMO_STEPS[stepNumber - 1].title}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {isCompleted && !isCurrent ? (
              <Check className="h-4 w-4" />
            ) : (
              stepNumber
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Main Demo Modal Component
 */
export function DemoModal() {
  const demoTour = useDemoTourContext()
  const { user } = useAuth()
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)

  console.log('[DemoModal] Rendering with state:', {
    isOpen: demoTour.isOpen,
    currentStep: demoTour.currentStep,
    isCompleted: demoTour.isCompleted,
    completedSteps: demoTour.completedSteps
  })

  // Additional debugging for modal visibility
  useEffect(() => {
    console.log('🎯 [DemoModal] State changed:', {
      isOpen: demoTour.isOpen,
      currentStep: demoTour.currentStep,
      isCompleted: demoTour.isCompleted,
      canGoBack: demoTour.canGoBack,
      canGoForward: demoTour.canGoForward
    })
  }, [demoTour.isOpen, demoTour.currentStep, demoTour.isCompleted])

  // Handle demo trigger from URL parameters and auto-trigger for new users
  useEffect(() => {
    const checkAndTriggerDemo = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const demoParam = urlParams.get('demo')
      
      // Priority 1: URL parameter demo request - always start fresh
      if (demoParam === 'true' && !demoTour.isOpen) {
        console.log('🎯 [DemoModal] URL demo parameter detected - starting demo fresh')
        setTimeout(() => {
          demoTour.startDemo()
        }, 500)
        return
      }
      
      // Priority 2: Auto-trigger for new users (only if authenticated and not completed)
      if (user && !demoTour.isOpen && !demoTour.isCompleted) {
        try {
          console.log('🔍 [DemoModal] Checking if new user should see demo...', {
            userId: user.uid,
            isOpen: demoTour.isOpen,
            isCompleted: demoTour.isCompleted
          })
          const shouldShow = await demoTour.shouldShowDemo()
          
          if (shouldShow) {
            console.log('🎯 [DemoModal] New user detected - starting demo fresh from step 1')
            setTimeout(() => {
              demoTour.startDemo()
            }, 1000) // Slightly longer delay for new users to let page load
          } else {
            console.log('📝 [DemoModal] User has already seen demo - not triggering')
          }
        } catch (error) {
          console.error('❌ [DemoModal] Error checking demo status:', error)
        }
      }
    }
    
    checkAndTriggerDemo()
  }, [user, demoTour.isOpen, demoTour.isCompleted, demoTour.shouldShowDemo]) // Removed actions dependency to prevent multiple calls

  // Current step data
  const currentStepData = DEMO_STEPS.find(step => step.id === demoTour.currentStep) || DEMO_STEPS[0]
  const progressPercentage = ((demoTour.currentStep - 1) / (demoTour.totalSteps - 1)) * 100

  /**
   * Handle step navigation with animation prevention
   */
  const handleStepNavigation = useCallback((navigationFn: () => void) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    navigationFn()
    
    // Allow time for step transition
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }, [isAnimating])

  /**
   * Handle manual step jumping from step indicator
   */
  const handleStepJump = (targetStep: DemoStep) => {
    if (isAnimating || targetStep === demoTour.currentStep) return
    
    console.log('[DemoModal] Jumping to step:', targetStep)
    setIsAnimating(true)
    demoTour.goToStep(targetStep)
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  /**
   * Handle demo completion
   */
  const handleComplete = () => {
    console.log('[DemoModal] Completing demo')
    demoTour.completDemo()
    clearDemoUrlParameter()
  }

  /**
   * Handle demo skip with proper redirects
   */
  const handleSkipDemo = () => {
    console.log('[DemoModal] Skipping demo')
    demoTour.skipDemo()
    clearDemoUrlParameter()
    
    // Redirect based on authentication status
    if (!user) {
      console.log('[DemoModal] Unauthenticated user - redirecting to sign-in')
      router.push('/sign-in')
    } else {
      console.log('[DemoModal] Authenticated user - staying on main page')
      // Stay on current page, modal will close
    }
  }

  /**
   * Clear demo URL parameter to prevent re-opening
   */
  const clearDemoUrlParameter = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('demo')
    window.history.replaceState({}, '', url.pathname + url.search)
    console.log('[DemoModal] Cleared demo URL parameter')
  }

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!demoTour.isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent navigation during animations
      if (isAnimating) return

      switch (event.key) {
        case 'ArrowLeft':
          if (demoTour.canGoBack) {
            event.preventDefault()
            handleStepNavigation(demoTour.previousStep)
          }
          break
        case 'ArrowRight':
          if (demoTour.canGoForward) {
            event.preventDefault()
            handleStepNavigation(demoTour.nextStep)
          }
          break
        case 'Escape':
          event.preventDefault()
          handleSkipDemo()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [demoTour.isOpen, demoTour.canGoBack, demoTour.canGoForward, isAnimating, demoTour, handleStepNavigation])

  if (!demoTour.isOpen) {
    return null
  }

  return (
    <Dialog open={demoTour.isOpen} onOpenChange={(open) => !open && handleSkipDemo()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0"
        aria-describedby="demo-modal-description"
      >
        {/* Header with progress and step indicators */}
        <DialogHeader className="p-6 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <currentStepData.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {currentStepData.title}
                </DialogTitle>
                <DialogDescription id="demo-modal-description" className="text-sm">
                  {currentStepData.description}
                </DialogDescription>
              </div>
            </div>
            
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs font-medium">
                Step {demoTour.currentStep} of {demoTour.totalSteps}
              </span>
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <Progress 
              value={progressPercentage} 
              className="h-2"
              aria-label={`Demo progress: ${Math.round(progressPercentage)}% complete`}
            />
            
            {/* Step indicator dots */}
            <StepIndicator
              currentStep={demoTour.currentStep}
              totalSteps={demoTour.totalSteps}
              completedSteps={demoTour.completedSteps}
              onStepClick={handleStepJump}
              className="pt-1"
            />
          </div>
        </DialogHeader>

        <Separator />

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isAnimating && "opacity-50 scale-95"
          )}>
            {currentStepData.content}
          </div>
        </div>

        <Separator />

        {/* Footer with navigation buttons */}
        <DialogFooter className="p-6 pt-4">
          <div className="flex w-full items-center justify-between">
            {/* Left side - Skip button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipDemo}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Skip Demo
            </Button>

            {/* Right side - Navigation buttons */}
            <div className="flex items-center gap-2">
              {/* Back button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStepNavigation(demoTour.previousStep)}
                disabled={!demoTour.canGoBack || isAnimating}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {/* Next/Complete button */}
              {demoTour.currentStep === demoTour.totalSteps ? (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={isAnimating}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Complete Demo
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleStepNavigation(demoTour.nextStep)}
                  disabled={!demoTour.canGoForward || isAnimating}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {/* Skip step button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStepNavigation(demoTour.skipStep)}
                disabled={isAnimating}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DemoModal 