'use client'

import { DocumentList } from './document-list'
import { UserMenu } from './user-menu'
import { AISidebarToggle } from './ai-sidebar-toggle'
import { WritingGoalsButton } from './writing-goals-button'
import { Separator } from '@/components/ui/separator'
import { PenTool } from 'lucide-react'
import type { User, DocumentListItem } from '@/types/navigation'
import type { WritingGoals } from '@/types/writing-goals'
import { ThemeToggle } from './theme-toggle'
import { DistractionFreeToggle } from './distraction-free-toggle'

interface NavigationBarProps {
  user: User
  documents: DocumentListItem[]
  activeDocumentId?: string
  isAISidebarOpen: boolean
  aiSuggestionCount?: number
  writingGoals: WritingGoals
  isDistractionFree: boolean
  onDocumentSelect?: (documentId: string) => void
  onNewDocument?: () => void
  onUserAction?: (action: string) => void
  onAISidebarToggle?: () => void
  onWritingGoalsClick?: () => void
  onDistractionFreeToggle?: () => void
}

export function NavigationBar({
  user,
  documents,
  activeDocumentId,
  isAISidebarOpen,
  aiSuggestionCount = 0,
  writingGoals,
  isDistractionFree,
  onDocumentSelect,
  onNewDocument,
  onUserAction,
  onAISidebarToggle,
  onWritingGoalsClick,
  onDistractionFreeToggle,
}: NavigationBarProps) {
  const handleUserAction = (action: string) => {
    onUserAction?.(action)
    console.log(`User action: ${action}`)
  }

  return (
    <div className="relative z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <PenTool className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">WordWise AI</span>
        </div>

        <Separator orientation="vertical" className="hidden h-4 lg:block" />

        {/* Document List */}
        <div className="hidden lg:block">
          <DocumentList
            documents={documents}
            activeDocumentId={activeDocumentId}
            onDocumentSelect={onDocumentSelect}
            onNewDocument={onNewDocument}
          />
        </div>

        <Separator orientation="vertical" className="hidden h-4 lg:block" />

        {/* Writing Goals */}
        <div className="hidden md:block">
          <WritingGoalsButton
            currentGoals={writingGoals}
            onClick={onWritingGoalsClick || (() => {})}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Document List */}
        <div className="lg:hidden">
          <DocumentList
            documents={documents}
            activeDocumentId={activeDocumentId}
            onDocumentSelect={onDocumentSelect}
            onNewDocument={onNewDocument}
          />
        </div>

        {/* Mobile Writing Goals */}
        <div className="md:hidden">
          <WritingGoalsButton
            currentGoals={writingGoals}
            onClick={onWritingGoalsClick || (() => {})}
          />
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* AI Sidebar Toggle */}
        <AISidebarToggle
          isOpen={isAISidebarOpen}
          onToggle={onAISidebarToggle || (() => {})}
          suggestionCount={aiSuggestionCount}
        />

        <Separator orientation="vertical" className="h-4" />

        {/* Theme Toggle */}
        <ThemeToggle />

        <Separator orientation="vertical" className="h-4" />

        {/* Distraction Free Toggle */}
        <DistractionFreeToggle
          isDistractionFree={isDistractionFree}
          onToggle={onDistractionFreeToggle || (() => {})}
        />

        <Separator orientation="vertical" className="h-4" />

        {/* User Menu */}
        <UserMenu
          user={user}
          onProfileClick={() => handleUserAction('profile')}
          onSettingsClick={() => handleUserAction('settings')}
          onBillingClick={() => handleUserAction('billing')}
          onHelpClick={() => handleUserAction('help')}
          onSignOut={() => handleUserAction('signout')}
        />
      </div>
    </div>
  )
}
