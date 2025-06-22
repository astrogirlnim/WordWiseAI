'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Target, Sparkles, FileText } from 'lucide-react'
import {
  writingGoalSections,
  defaultWritingGoals,
} from '@/utils/writing-goals-data'
import type { WritingGoals } from '@/types/writing-goals'

interface WritingGoalsModalProps {
  isOpen: boolean
  onClose: () => void
  currentGoals: WritingGoals
  onSave: (goals: WritingGoals, title?: string) => void
  showOnNewDocument: boolean
  onShowOnNewDocumentChange: (show: boolean) => void
  isNewDocument?: boolean
  initialTitle?: string
}

export function WritingGoalsModal({
  isOpen,
  onClose,
  currentGoals,
  onSave,
  showOnNewDocument,
  onShowOnNewDocumentChange,
  isNewDocument = false,
  initialTitle = 'Untitled Document',
}: WritingGoalsModalProps) {
  console.log('[WritingGoalsModal] Rendering modal:', {
    isOpen,
    isNewDocument,
    initialTitle,
  })

  const [goals, setGoals] = useState<WritingGoals>(currentGoals)
  const [documentTitle, setDocumentTitle] = useState(initialTitle)

  const handleGoalChange = (section: keyof WritingGoals, value: string) => {
    console.log('[WritingGoalsModal] Goal changed:', section, '→', value)
    setGoals((prev) => ({
      ...prev,
      [section]: value,
    }))
  }

  const handleTitleChange = (e: { target: { value: string } }) => {
    const newTitle = e.target.value
    console.log('[WritingGoalsModal] Title changed:', newTitle)
    setDocumentTitle(newTitle)
  }

  const handleSave = () => {
    console.log('[WritingGoalsModal] Saving:', {
      goals,
      title: isNewDocument ? documentTitle : undefined,
      isNewDocument,
    })
    
    if (isNewDocument) {
      onSave(goals, documentTitle.trim() || 'Untitled Document')
    } else {
      onSave(goals)
    }
    onClose()
  }

  const handleReset = () => {
    console.log('[WritingGoalsModal] Resetting goals to defaults')
    setGoals(defaultWritingGoals)
    if (isNewDocument) {
      setDocumentTitle('Untitled Document')
    }
  }

  useEffect(() => {
    console.log('[WritingGoalsModal] Props changed, updating local state:', {
      currentGoals,
      initialTitle,
    })
    setGoals(currentGoals)
    setDocumentTitle(initialTitle)
  }, [currentGoals, initialTitle])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            {isNewDocument ? 'Create New Document' : 'Set Writing Goals'}
          </DialogTitle>
          <DialogDescription>
            {isNewDocument 
              ? 'Set your document title and writing goals to get started with AI-powered assistance.'
              : 'Get tailored writing suggestions based on your marketing goals and target audience.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isNewDocument && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Document Title
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-200">
                      Give your document a descriptive title to help you organize your work.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-title" className="sr-only">
                      Document Title
                    </Label>
                    <Input
                      id="document-title"
                      type="text"
                      value={documentTitle}
                      onChange={handleTitleChange}
                      placeholder="Enter document title..."
                      className="bg-white dark:bg-gray-900"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {writingGoalSections.map((section) => (
            <div key={section.key} className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">{section.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {section.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleGoalChange(section.key, option.value)}
                    className={`rounded-lg border p-3 text-left transition-all hover:border-primary/50 ${
                      goals[section.key] === option.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      {goals[section.key] === option.value && (
                        <Badge variant="default" className="px-2 py-0 text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Pro Tip
                </p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                  Your writing goals help our AI provide more targeted
                  suggestions for marketing effectiveness, brand consistency,
                  and audience engagement.
                </p>
              </div>
            </div>
          </div>

          {!isNewDocument && (
            <div className="flex items-center space-x-2 border-t pt-2">
              <Checkbox
                id="show-on-new"
                checked={showOnNewDocument}
                onCheckedChange={onShowOnNewDocumentChange}
              />
              <label
                htmlFor="show-on-new"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show Set Goals when I start a new document
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to defaults
          </Button>
          <Button onClick={handleSave}>
            {isNewDocument ? 'Create Document' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
