# Required Changes for Sales Funnel MVP

## User Roles Update

1. Update user roles in `types/user.ts` from `marketing-manager | brand-strategist | content-writer` to `marketing-manager | copywriter | growth-hacker`

## Writing Goals Enhancement

2. Add new funnel-specific domains to `types/writing-goals.ts`:

   - Add: `landing-page | sales-page | email-sequence | ad-copy | opt-in-form`
   - Keep existing: `marketing-copy | email-campaign`

3. Add new audience types to `types/writing-goals.ts`:

   - Add: `cold-traffic | warm-leads | existing-customers | high-intent-prospects`
   - Keep existing: `consumers | stakeholders`

4. Update intent options to include `email-capture | purchase | signup | download | book-call`

5. Update `utils/writing-goals-data.ts` with new funnel-focused options and descriptions

## AI Suggestion Types

6. Add conversion-focused suggestion types to `types/ai-features.ts`:
   - Add: `conversion | urgency | social-proof | objection-handling | cta-optimization`
   - Keep existing: `grammar | style | clarity | engagement`

## Document Model Enhancement

7. Add `funnelType` and `conversionGoal` fields to `types/document.ts` Document interface
8. Rename `analysisSummary.brandAlignmentScore` to `analysisSummary.conversionScore`

## Component Text Updates

9. Update component labels in `components/document-list.tsx`:

   - "Documents" → "Funnel Pages"
   - "Select Document" → "Select Funnel Page"

10. Update `components/writing-goals-modal.tsx` title from "Writing Goals" to "Conversion Goals"

## AI Service Context

11. Update AI prompts in `services/ai-service.ts` to focus on conversion optimization rather than general writing quality

## Navigation Updates

12. Update navigation labels in relevant components:
    - "Documents" → "Funnel Pages"
    - "Brand Guidelines" → "Conversion Guidelines"

## Database Schema (Optional)

13. Consider adding `funnel_stage` and `conversion_action` fields to document cache table in PostgreSQL

## Environment/Branding

14. Update app title and descriptions to reflect sales funnel focus
15. Update placeholder text in editor to funnel-specific examples

## Priority Order

- **High Priority (MVP Critical)**: Items 1, 2, 3, 4, 5, 6
- **Medium Priority (User Experience)**: Items 9, 10, 11, 12
- **Low Priority (Polish)**: Items 7, 8, 13, 14, 15
