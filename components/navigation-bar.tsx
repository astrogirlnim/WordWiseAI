'use client'

import { UserMenu } from './user-menu'
import { AISidebarToggle } from './ai-sidebar-toggle'
import { WritingGoalsButton } from './writing-goals-button'
import { DocumentSharingButton } from './document-sharing-button'
import { VersionHistoryButton } from './version-history-button'

import type { User } from '@/types/navigation'
import type { Document } from '@/types/document'
import type { WritingGoals } from '@/types/writing-goals'
import { ThemeToggle } from './theme-toggle'
import { DistractionFreeToggle } from './distraction-free-toggle'
import { EnhancedDocumentList } from './enhanced-document-list'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NavigationBarProps {
  user: User
  documents: Document[]
  ownedDocuments?: Document[]
  sharedDocuments?: Document[]
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
  ownedDocuments = [],
  sharedDocuments = [],
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

  console.log('[NavigationBar] Rendered with:', {
    displayMode,
    totalDocs: documents.length,
    ownedDocs: ownedDocuments.length,
    sharedDocs: sharedDocuments.length,
    activeDocumentId
  })

  const handleUserAction = (action: string) => {
    onUserAction?.(action)
    console.log(`[NavigationBar] User action: ${action}`)

    if (action === 'settings') {
      router.push('/settings')
    }
  }

  const handleSettingsClick = () => {
    handleUserAction('settings')
  }

  const handleSignOut = async () => {
    console.log('[NavigationBar] User signing out')
    await logout()
    router.push('/sign-in')
  }

  // Get the active document for sharing
  const activeDocument = [...ownedDocuments, ...sharedDocuments, ...documents]
    .find(doc => doc.id === activeDocumentId) || null

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
          {displayMode === 'editor' && (
            <div className="hidden lg:block">
              <EnhancedDocumentList
                documents={documents}
                ownedDocuments={ownedDocuments}
                sharedDocuments={sharedDocuments}
                activeDocumentId={activeDocumentId}
                onDocumentSelect={onDocumentSelect}
                onNewDocument={onNewDocument}
                onDeleteDocument={onDeleteDocument}
              />
            </div>
          )}
        </div>

        {/* Center Actions - Document specific actions */}
        {displayMode === 'editor' && activeDocument && (
          <div className="hidden md:flex items-center gap-3">
            {/* Document Sharing */}
            <DocumentSharingButton 
              document={activeDocument}
              variant="outline"
              size="sm"
              showCollaboratorCount={true}
            />
            
            {/* Writing Goals */}
                         <WritingGoalsButton
               onClick={onWritingGoalsClick || (() => {})}
               currentGoals={writingGoals}
               className="text-sm"
             />
            
            {/* Version History */}
            <div className="hidden md:flex items-center gap-2">
              {onVersionHistoryClick && (
                <VersionHistoryButton
                  onClick={onVersionHistoryClick}
                />
              )}
            </div>
          </div>
        )}

        {/* Right Section - Controls and User */}
        <div className="flex items-center gap-3">
          {/* Editor Controls - Only show in editor mode */}
          {displayMode === 'editor' && (
            <>
              {/* AI Sidebar Toggle - Premium positioning */}
              <AISidebarToggle
                isOpen={isAISidebarOpen}
                onToggle={onAISidebarToggle || (() => {})}
                suggestionCount={aiSuggestionCount}
              />
              
              {/* Distraction Free Mode */}
              <DistractionFreeToggle
                isDistractionFree={isDistractionFree}
                onToggle={onDistractionFreeToggle || (() => {})}
              />
            </>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu - Premium design */}
          <UserMenu
            user={user}
            onSettingsClick={handleSettingsClick}
            onSignOut={handleSignOut}
          />
        </div>
      </div>

      {/* Mobile Document Navigation - Show below main nav on mobile */}
      {displayMode === 'editor' && (
        <div className="lg:hidden border-t border-border/40 px-4 py-2 bg-background/80">
          <div className="flex items-center justify-between">
            <EnhancedDocumentList
              documents={documents}
              ownedDocuments={ownedDocuments}
              sharedDocuments={sharedDocuments}
              activeDocumentId={activeDocumentId}
              onDocumentSelect={onDocumentSelect}
              onNewDocument={onNewDocument}
              onDeleteDocument={onDeleteDocument}
            />
            
            {/* Mobile Actions */}
            <div className="flex items-center gap-2">
              {activeDocument && (
                <DocumentSharingButton 
                  document={activeDocument}
                  variant="ghost"
                  size="sm"
                  showCollaboratorCount={false}
                />
              )}
              
              <AISidebarToggle
                isOpen={isAISidebarOpen}
                onToggle={onAISidebarToggle || (() => {})}
                suggestionCount={aiSuggestionCount}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 