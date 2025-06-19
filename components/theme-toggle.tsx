"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
      className="group relative h-10 w-10 border border-retro-accent/30 bg-background/50 text-foreground transition-all duration-300 hover:border-retro-accent hover:bg-retro-accent/10 hover:text-retro-accent hover:shadow-retro-glow-sm focus-visible:ring-2 focus-visible:ring-retro-accent"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 group-hover:text-glow-soft dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 group-hover:text-glow-soft dark:rotate-0 dark:scale-100" />
      
      {/* Retro tech corner accents */}
      <div className="absolute -bottom-1 -right-1 h-2 w-2 border-b border-r border-retro-accent/30 transition-all duration-300 group-hover:border-retro-accent"></div>
      <div className="absolute -left-1 -top-1 h-2 w-2 border-l border-t border-retro-accent/30 transition-all duration-300 group-hover:border-retro-accent"></div>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 