export interface GrammarError {
  start: number
  end: number
  error: string
  correction: string
  explanation: string
  type: 'grammar' | 'spelling'
} 