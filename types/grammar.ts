export interface GrammarError {
  id: string
  start: number
  end: number
  error: string
  suggestions: string[]
  explanation: string
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'punctuation'
  shownAt?: number
} 