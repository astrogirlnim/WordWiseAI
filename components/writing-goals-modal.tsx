"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Target, Sparkles } from "lucide-react"
import { writingGoalSections, defaultWritingGoals } from "@/utils/writing-goals-data"
import type { WritingGoals } from "@/types/writing-goals"

interface WritingGoalsModalProps {
  isOpen: boolean
  onClose: () => void
  currentGoals: WritingGoals
  onSave: (goals: WritingGoals) => void
  showOnNewDocument: boolean
  onShowOnNewDocumentChange: (show: boolean) => void
}

export function WritingGoalsModal({
  isOpen,
  onClose,
  currentGoals,
  onSave,
  showOnNewDocument,
  onShowOnNewDocumentChange,
}: WritingGoalsModalProps) {
  const [goals, setGoals] = useState<WritingGoals>(currentGoals)

  const handleGoalChange = (section: keyof WritingGoals, value: string) => {
    setGoals((prev) => ({
      ...prev,
      [section]: value,
    }))
  }

  const handleSave = () => {
    onSave(goals)
    onClose()
  }

  const handleReset = () => {
    setGoals(defaultWritingGoals)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
              <Target className="h-4 w-4 text-primary" />
            </div>
            Set Writing Goals
          </DialogTitle>
          <DialogDescription>
            Get tailored writing suggestions based on your marketing goals and target audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {writingGoalSections.map((section) => (
            <div key={section.key} className="space-y-3">
              <div>
                <h3 className="font-medium text-sm">{section.title}</h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {section.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleGoalChange(section.key, option.value)}
                    className={`text-left p-3 rounded-lg border transition-all hover:border-primary/50 ${
                      goals[section.key] === option.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{option.label}</span>
                      {goals[section.key] === option.value && (
                        <Badge variant="default" className="text-xs px-2 py-0">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Pro Tip */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Pro Tip</p>
                <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                  Your writing goals help our AI provide more targeted suggestions for marketing effectiveness, brand
                  consistency, and audience engagement.
                </p>
              </div>
            </div>
          </div>

          {/* Show on new document option */}
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox id="show-on-new" checked={showOnNewDocument} onCheckedChange={onShowOnNewDocumentChange} />
            <label
              htmlFor="show-on-new"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Set Goals when I start a new document
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to defaults
          </Button>
          <Button onClick={handleSave}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
