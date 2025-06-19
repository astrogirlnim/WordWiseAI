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
import { CollaborationPresence } from './collaboration-presence'
import { Button } from '@/components/ui/button'
import { Target } from 'lucide-react'

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
    console.log(`User action: ${action}`)

    if (action === 'settings') {
      router.push('/settings')
    }
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/sign-in')
  }

  return (
    <div className="relative z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-2">
          <PenTool className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">WordWise AI</span>
        </Link>

        <Separator orientation="vertical" className="hidden h-4 lg:block" />

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

        <Separator orientation="vertical" className="hidden h-4 lg:block" />

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

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-4" />}

        {/* AI Sidebar Toggle */}
        {displayMode === 'editor' && (
          <AISidebarToggle
            isOpen={isAISidebarOpen}
            onToggle={onAISidebarToggle || (() => {})}
            suggestionCount={aiSuggestionCount}
          />
        )}

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-4" />}

        {/* Theme Toggle */}
        {displayMode === 'editor' && <ThemeToggle />}

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-4" />}

        {/* Distraction Free Toggle */}
        {displayMode === 'editor' && (
          <DistractionFreeToggle
            isDistractionFree={isDistractionFree}
            onToggle={onDistractionFreeToggle || (() => {})}
          />
        )}

        {displayMode === 'editor' && <Separator orientation="vertical" className="h-4" />}
        
        {displayMode === 'editor' && (
          <VersionHistoryButton onClick={onVersionHistoryClick || (() => {})} />
        )}

        <Separator orientation="vertical" className="h-4" />

        {/* Collaboration Presence */}
        <CollaborationPresence 
          documentId={activeDocumentId}
          className="hidden md:flex"
        />
        
        {/* Divider */}
        {activeDocumentId && (
          <div className="hidden md:block h-4 w-px bg-border" />
        )}

        {/* Writing Goals Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onWritingGoalsClick}
          className="hidden md:flex items-center gap-1"
        >
          <Target className="h-4 w-4" />
          Goals
        </Button>

        <Separator orientation="vertical" className="h-4" />

        {/* User Menu */}
        <UserMenu
          user={user}
          onSettingsClick={() => handleUserAction('settings')}
          onSignOut={handleSignOut}
        />
      </div>
    </div>
  )
}
