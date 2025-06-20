"use client"

import * as React from "react"
import { Maximize, Minimize } from "lucide-react"

import { Button } from "@/components/ui/button"

interface DistractionFreeToggleProps {
  isDistractionFree: boolean
  onToggle: () => void
}

export function DistractionFreeToggle({
  isDistractionFree,
  onToggle,
}: DistractionFreeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      aria-label={isDistractionFree ? "Exit distraction-free mode" : "Enter distraction-free mode"}
      title={isDistractionFree ? "Exit fullscreen (Esc)" : "Enter distraction-free mode"}
    >
      {isDistractionFree ? (
        <Minimize className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Maximize className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">
        {isDistractionFree ? "Exit distraction-free mode" : "Enter distraction-free mode"}
      </span>
    </Button>
  )
} 