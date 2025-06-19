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
      className="group relative h-10 w-10 rounded-xl border border-retro-primary/30 bg-gradient-to-br from-background/80 to-retro-earth-pink/5 text-foreground backdrop-blur-sm transition-all duration-300 hover:border-retro-primary hover:bg-gradient-to-br hover:from-retro-primary/10 hover:to-retro-sunset/5 hover:text-retro-primary hover:shadow-synthwave-glow-sm focus-visible:ring-2 focus-visible:ring-retro-primary"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 group-hover:text-glow-soft dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 group-hover:text-glow-soft dark:rotate-0 dark:scale-100" />
      
      {/* Organic retrowave corner accents */}
      <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-br from-retro-coral/40 to-retro-dust-rose/30 transition-all duration-300 group-hover:from-retro-primary/60 group-hover:to-retro-sunset/40"></div>
      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-gradient-to-br from-retro-earth-pink/40 to-retro-primary/20 transition-all duration-300 group-hover:from-retro-primary/60 group-hover:to-retro-earth-pink/40"></div>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 