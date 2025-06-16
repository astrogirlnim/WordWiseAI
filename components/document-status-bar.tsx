"use client"

import type { AutoSaveStatus } from "@/types/document"
import { formatLastSaved } from "@/utils/document-utils"
import { Loader2, Check, AlertCircle } from "lucide-react"

interface DocumentStatusBarProps {
  saveStatus: AutoSaveStatus
  wordCount: number
  characterCount: number
}

export function DocumentStatusBar({ saveStatus, wordCount, characterCount }: DocumentStatusBarProps) {
  const getSaveStatusIcon = () => {
    switch (saveStatus.status) {
      case "saving":
        return <Loader2 className="h-3 w-3 animate-spin" />
      case "saved":
        return <Check className="h-3 w-3 text-green-600" />
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-600" />
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus.status) {
      case "saving":
        return "Saving..."
      case "saved":
        return saveStatus.lastSaved ? `Saved ${formatLastSaved(saveStatus.lastSaved)}` : "Saved"
      case "error":
        return "Save failed"
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-2 text-xs text-muted-foreground border-t bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {getSaveStatusIcon()}
        <span>{getSaveStatusText()}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{wordCount} words</span>
        <span>{characterCount} characters</span>
      </div>
    </div>
  )
}
