# Standard Markdown Rendering Test

This document tests the markdown preview to ensure it matches standard compiled markdown output exactly.

## Spacing Follows Standard Conventions

### Headers Have Proper Margins
Headers should have 24px top margin and 16px bottom margin, except the first header which has no top margin.

#### This is an H4
Content after headers should be properly spaced.

##### This is an H5
Even smaller headers maintain the same spacing rules.

###### This is an H6
The smallest header level.

## Paragraph Spacing

This is the first paragraph. It should have a 16px bottom margin.

This is the second paragraph. Notice how the spacing between paragraphs matches what you'd see on GitHub or GitLab.

Multiple paragraphs should flow naturally with consistent 16px spacing between them, just like in compiled markdown.

## List Spacing

Standard unordered list:
- First item
- Second item
- Third item with nested list:
  - Nested item one
  - Nested item two
  - Deeply nested:
    - Third level item

Standard ordered list:
1. First numbered item
2. Second numbered item
3. Third item with nested:
   1. Nested numbered item
   2. Another nested item

Mixed list with paragraphs:
- This item has a paragraph.

  This is a second paragraph in the same list item.

- This is another list item with normal spacing.

## Task Lists

- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Code Examples

Inline code like `console.log()` or `npm install` should have standard 85% font size and minimal padding.

Code blocks should have 16px top/bottom margins:

```javascript
function standardSpacing() {
  // This code block should have proper margins
  // and match GitHub's rendering exactly
  return "Perfect spacing!";
}
```

Another paragraph after code block to test spacing.

```css
/* CSS example */
.standard-spacing {
  margin: 16px 0;
  padding: 16px;
  line-height: 1.45;
}
```

## Blockquotes

> This is a standard blockquote.
> 
> It should have 16px top/bottom margins and proper internal spacing.
> 
> Multiple paragraphs in blockquotes should work correctly.

Regular paragraph after blockquote.

> Another blockquote to test spacing between elements.

## Tables

Standard table with proper spacing:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |
| Row 3, Col 1 | Row 3, Col 2 | Row 3, Col 3 |

Paragraph after table should have proper spacing.

## Horizontal Rules

Text before horizontal rule.

---

Text after horizontal rule should have 24px spacing above and below the rule.

## Text Formatting

**Bold text** and *italic text* should render with standard font weights.

~~Strikethrough text~~ should have proper line-through styling.

[Links](https://example.com) should have standard underline styling with proper color.

## Mixed Content Test

Here's a complex example with mixed content types:

### Code and Lists Together

1. First, install the package:
   ```bash
   npm install markdown-parser
   ```

2. Then, import it in your code:
   ```javascript
   import { parseMarkdown } from 'markdown-parser';
   ```

3. Finally, use it:
   - Parse your content
   - Render the output
   - Enjoy the results!

The spacing between these different elements should match exactly what you'd see in compiled markdown on platforms like GitHub, GitLab, or any standard markdown renderer.

## Expected Results

When viewing this in the preview, you should see:
- **16px margins** between paragraphs
- **24px top margins** on headers (except first)
- **16px bottom margins** on headers
- **Standard line heights** (1.6 for text, 1.25 for headers, 1.45 for code)
- **Consistent spacing** that matches GitHub's rendering
- **No custom styling** that deviates from markdown standards

✨ The preview should now look **exactly** like compiled markdown!