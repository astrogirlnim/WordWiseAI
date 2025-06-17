export interface WritingGoals {
  audience: 'consumers' | 'stakeholders' | 'internal-team' | 'industry-experts'
  formality: 'casual' | 'professional' | 'formal'
  domain:
    | 'marketing-copy'
    | 'brand-strategy'
    | 'social-media'
    | 'email-campaign'
    | 'press-release'
    | 'content-marketing'
  intent: 'persuade' | 'inform' | 'engage' | 'convert' | 'build-awareness'
}

export interface WritingGoalOption {
  value: string
  label: string
  description: string
}

export interface WritingGoalSection {
  key: keyof WritingGoals
  title: string
  description: string
  options: WritingGoalOption[]
}
