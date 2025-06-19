'use client'

import { UserMenu } from './user-menu'
import { AISidebarToggle } from './ai-sidebar-toggle'
import { WritingGoalsButton } from './writing-goals-button'
import { Separator } from '@/components/ui/separator'
import { PenTool } from 'lucide-react'
import type { User } from '@/types/navigation'
import type { Document } from '@/types/document'
import type { WritingGoals } from '@/types/writing-goals'
import { ThemeToggle } from './theme-toggle'
import { DistractionFreeToggle } from './distraction-free-toggle'
import { EnhancedDocumentList } from './enhanced-document-list'
import { VersionHistoryButton } from './version-history-button'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NavigationBarProps {
  user: User
  documents: Document[]
  displayMode?: 'editor' | 'settings'
  activeDocumentId?: string
  isAISidebarOpen?: boolean
  aiSuggestionCount?: number
  writingGoals: WritingGoals
  isDistractionFree: boolean
  onDocumentSelect?: (documentId: string) => void
  onNewDocument?: () => void
  onUserAction?: (action: string) => void
  onAISidebarToggle?: () => void
  onWritingGoalsClick?: () => void
  onDistractionFreeToggle?: () => void
  onVersionHistoryClick?: () => void
  onDeleteDocument?: (documentId: string) => Promise<void>
}

export function NavigationBar({
  user,
  documents,
  displayMode = 'editor',
  activeDocumentId,
  isAISidebarOpen = false,
  aiSuggestionCount = 0,
  writingGoals,
  isDistractionFree,
  onDocumentSelect,
  onNewDocument,
  onUserAction,
  onAISidebarToggle,
  onWritingGoalsClick,
  onDistractionFreeToggle,
  onVersionHistoryClick,
  onDeleteDocument,
}: NavigationBarProps) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleUserAction = (action: string) => {
    onUserAction?.(action)
    console.log(`[NavigationBar] User action: ${action}`)

    if (action === 'settings') {
      router.push('/settings')
    }
  }

  const handleSignOut = async () => {
    console.log('[NavigationBar] User signing out')
    await logout()
    router.push('/sign-in')
  }

  return (
    <div className="relative z-50 flex h-16 items-center justify-between border-b border-retro-accent/20 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        {/* Logo/Brand with retro tech styling */}
        <Link 
          href="/" 
          className="group flex items-center gap-3 transition-all duration-300 hover:text-retro-accent"
        >
          <PenTool className="h-6 w-6 text-retro-accent transition-all duration-300 group-hover:text-glow-soft" />
          <div className="flex flex-col">
            <span className="text-xl font-bold font-terminal tracking-tight">WordWise</span>
            <span className="text-xs text-muted-foreground font-terminal uppercase tracking-widest">AI Assistant</span>
          </div>
        </Link>

        <Separator orientation="vertical" className="hidden h-6 bg-retro-accent/30 lg:block" />

        {/* Document List */}
        <div className="hidden lg:block">
          <EnhancedDocumentList
            documents={documents}
            activeDocumentId={activeDocumentId}
            onDocumentSelect={onDocumentSelect}
            onNewDocument={onNewDocument}
            onDeleteDocument={onDeleteDocument}
          />
        </div>

        <Separator orientation="vertical" className="hidden h-6 bg-retro-accent/30 lg:block" />

        {/* Writing Goals */}
        {displayMode === 'editor' && (
          <div className="hidden md:block">
            <WritingGoalsButton
              currentGoals={writingGoals}
              onClick={onWritingGoalsClick || (() => {})}
            />
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Document List */}
        <div className="lg:hidden">
          <EnhancedDocumentList
            documents={documents}
            activeDocumentId={activeDocumentId}
            onDocumentSelect={onDocumentSelect}
            onNewDocument={onNewDocument}
            onDeleteDocument={onDeleteDocument}
          />
        </div>

        {/* Mobile Writing Goals */}
        {displayMode === 'editor' && (
          <div className="md:hidden">
            <WritingGoalsButton
              currentGoals={writingGoals}
              onClick={onWritingGoalsClick || (() => {})}
            />
          </div>
        )}

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-6 bg-retro-accent/30" />}

        {/* AI Sidebar Toggle */}
        {displayMode === 'editor' && (
          <AISidebarToggle
            isOpen={isAISidebarOpen}
            onToggle={onAISidebarToggle || (() => {})}
            suggestionCount={aiSuggestionCount}
          />
        )}

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-6 bg-retro-accent/30" />}

        {/* Theme Toggle with enhanced styling */}
        {displayMode === 'editor' && (
          <div className="relative">
            <ThemeToggle />
          </div>
        )}

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-6 bg-retro-accent/30" />}

        {/* Distraction Free Toggle */}
        {displayMode === 'editor' && (
          <DistractionFreeToggle
            isDistractionFree={isDistractionFree}
            onToggle={onDistractionFreeToggle || (() => {})}
          />
        )}

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-6 bg-retro-accent/30" />}
        
        {displayMode === 'editor' && (
          <VersionHistoryButton onClick={onVersionHistoryClick || (() => {})} />
        )}

        <Separator orientation="vertical" className="h-6 bg-retro-accent/30" />

        {/* User Menu */}
        <UserMenu
          user={user}
          onSettingsClick={() => handleUserAction('settings')}
          onSignOut={handleSignOut}
        />
      </div>
      
      {/* Subtle retro tech glow line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-retro-accent/50 to-transparent"></div>
    </div>
  )
}
