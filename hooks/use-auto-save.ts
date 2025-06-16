"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { AutoSaveStatus } from "@/types/document"

interface UseAutoSaveProps {
  content: string
  onSave: (content: string) => Promise<void>
  delay?: number
}

export function useAutoSave({ content, onSave, delay = 2000 }: UseAutoSaveProps) {
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>({ status: "saved" })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onSaveRef = useRef(onSave)
  const lastContentRef = useRef(content)

  // Keep the onSave reference up to date
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const triggerSave = useCallback(async (contentToSave: string) => {
    try {
      setSaveStatus({ status: "saving" })
      await onSaveRef.current(contentToSave)
      setSaveStatus({
        status: "saved",
        lastSaved: Date.now(),
      })
    } catch (error) {
      setSaveStatus({ status: "error" })
      console.error("Auto-save failed:", error)
    }
  }, [])

  useEffect(() => {
    // Only trigger save if content actually changed
    if (content === lastContentRef.current) {
      return
    }

    lastContentRef.current = content

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerSave(content)
    }, delay)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, delay, triggerSave])

  return { saveStatus, triggerSave }
}
