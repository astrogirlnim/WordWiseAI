'use client'

import { UserMenu } from './user-menu'
import { AISidebarToggle } from './ai-sidebar-toggle'
import { WritingGoalsButton } from './writing-goals-button'

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6 lg:px-8">
        {/* Brand Section - Award-winning logo treatment */}
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="group flex items-center gap-3 transition-all duration-300 hover:text-retro-primary"
          >
            <div className="relative flex h-9 w-9 items-center justify-center">
              {/* Gradient background with subtle animation */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-retro-primary to-retro-sunset opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110" />
              {/* Icon placeholder - using CSS for geometric shape */}
              <div className="relative z-10 h-4 w-4 rounded-full bg-white/90 shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-retro-primary to-retro-sunset bg-clip-text text-transparent">
                WordWise
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Assistant
              </span>
            </div>
          </Link>

          {/* Professional separator */}
          <div className="hidden h-6 w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

          {/* Document Navigation - Hidden on mobile for cleaner layout */}
          <div className="hidden lg:flex items-center gap-6">
            <EnhancedDocumentList
              documents={documents}
              activeDocumentId={activeDocumentId}
              onDocumentSelect={onDocumentSelect}
              onNewDocument={onNewDocument}
              onDeleteDocument={onDeleteDocument}
            />

            {displayMode === 'editor' && (
              <>
                <div className="h-4 w-px bg-border/50" />
                <WritingGoalsButton
                  currentGoals={writingGoals}
                  onClick={onWritingGoalsClick || (() => {})}
                />
              </>
            )}
          </div>
        </div>

        {/* Action Center - Sophisticated controls layout */}
        <div className="flex items-center gap-2">
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

          {/* Editor Tools - Professional spacing and grouping */}
          {displayMode === 'editor' && (
            <div className="flex items-center gap-2 ml-2">
              <div className="h-6 w-px bg-border/30" />
              
              <AISidebarToggle
                isOpen={isAISidebarOpen}
                onToggle={onAISidebarToggle || (() => {})}
                suggestionCount={aiSuggestionCount}
              />

              <ThemeToggle />

              <DistractionFreeToggle
                isDistractionFree={isDistractionFree}
                onToggle={onDistractionFreeToggle || (() => {})}
              />
              
              <VersionHistoryButton onClick={onVersionHistoryClick || (() => {})} />

              <div className="h-6 w-px bg-border/30 ml-1" />
            </div>
          )}

          {/* User Menu - Elegant final touch */}
          <UserMenu
            user={user}
            onSettingsClick={() => handleUserAction('settings')}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
      
      {/* Sophisticated bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-retro-primary/30 via-retro-sunset/20 to-transparent" />
    </header>
  )
}
