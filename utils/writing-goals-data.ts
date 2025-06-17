import type { WritingGoalSection, WritingGoals } from '@/types/writing-goals'

export const writingGoalSections: WritingGoalSection[] = [
  {
    key: 'audience',
    title: 'Audience',
    description: 'Who are you writing for?',
    options: [
      {
        value: 'consumers',
        label: 'Consumers',
        description: 'General public, customers, and end users',
      },
      {
        value: 'stakeholders',
        label: 'Stakeholders',
        description: 'Investors, partners, and decision makers',
      },
      {
        value: 'internal-team',
        label: 'Internal Team',
        description: 'Colleagues, team members, and internal communications',
      },
      {
        value: 'industry-experts',
        label: 'Industry Experts',
        description: 'Professionals, analysts, and industry specialists',
      },
    ],
  },
  {
    key: 'formality',
    title: 'Formality',
    description: 'What tone should your writing have?',
    options: [
      {
        value: 'casual',
        label: 'Casual',
        description: 'Friendly, conversational, and approachable',
      },
      {
        value: 'professional',
        label: 'Professional',
        description: 'Business-appropriate with standard expressions',
      },
      {
        value: 'formal',
        label: 'Formal',
        description: 'Official, structured, and traditional business language',
      },
    ],
  },
  {
    key: 'domain',
    title: 'Content Type',
    description: 'What type of marketing content are you creating?',
    options: [
      {
        value: 'marketing-copy',
        label: 'Marketing Copy',
        description: 'Ad copy, landing pages, and promotional materials',
      },
      {
        value: 'brand-strategy',
        label: 'Brand Strategy',
        description: 'Brand positioning, messaging, and strategic documents',
      },
      {
        value: 'social-media',
        label: 'Social Media',
        description: 'Posts, captions, and social media content',
      },
      {
        value: 'email-campaign',
        label: 'Email Campaign',
        description: 'Newsletters, promotional emails, and email sequences',
      },
      {
        value: 'press-release',
        label: 'Press Release',
        description: 'Media announcements and public communications',
      },
      {
        value: 'content-marketing',
        label: 'Content Marketing',
        description: 'Blog posts, articles, and educational content',
      },
    ],
  },
  {
    key: 'intent',
    title: 'Intent',
    description: 'What do you want to achieve with this content?',
    options: [
      {
        value: 'persuade',
        label: 'Persuade',
        description: 'Convince readers to take action or change their mind',
      },
      {
        value: 'inform',
        label: 'Inform',
        description: 'Educate and provide valuable information',
      },
      {
        value: 'engage',
        label: 'Engage',
        description: 'Build relationships and encourage interaction',
      },
      {
        value: 'convert',
        label: 'Convert',
        description: 'Drive sales, sign-ups, or specific actions',
      },
      {
        value: 'build-awareness',
        label: 'Build Awareness',
        description: 'Increase brand recognition and visibility',
      },
    ],
  },
]

export const defaultWritingGoals: WritingGoals = {
  audience: 'consumers',
  formality: 'professional',
  domain: 'marketing-copy',
  intent: 'persuade',
}
