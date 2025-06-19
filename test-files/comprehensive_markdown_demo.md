# Complete Markdown Reference Guide

This document demonstrates **all** the major Markdown components and syntax elements in one comprehensive file.

## Table of Contents

- [Headers](#headers)
- [Text Formatting](#text-formatting)
- [Lists](#lists)
- [Links and Images](#links-and-images)
- [Code and Syntax](#code-and-syntax)
- [Tables](#tables)
- [Blockquotes](#blockquotes)
- [Horizontal Rules](#horizontal-rules)
- [Line Breaks and Paragraphs](#line-breaks-and-paragraphs)
- [Special Characters](#special-characters)

---

## Headers

# H1 - Main Title
## H2 - Section Header
### H3 - Subsection Header
#### H4 - Sub-subsection Header
##### H5 - Minor Heading
###### H6 - Smallest Heading

Alternative H1 Syntax
=====================

Alternative H2 Syntax
---------------------

---

## Text Formatting

**Bold text using double asterisks**

__Bold text using double underscores__

*Italic text using single asterisks*

_Italic text using single underscores_

***Bold and italic using triple asterisks***

___Bold and italic using triple underscores___

~~Strikethrough text using double tildes~~

`Inline code using backticks`

This is a normal paragraph with some **bold**, *italic*, and `inline code` mixed in.

Here's text with a  
hard line break using two spaces at the end.

---

## Lists

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item 2.2.1
    - Deeply nested item 2.2.2
- Item 3

Alternative unordered list syntax:

* Using asterisks
* Another item
  * Nested with asterisk
  
+ Using plus signs
+ Another item
  + Nested with plus

### Ordered Lists

1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
      1. Deeply nested item
      2. Another deeply nested item
3. Third item

Alternative ordered list syntax:

1. Item one
1. Item two (numbers don't have to be sequential)
1. Item three

### Task Lists (GitHub Flavored Markdown)

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
  - [ ] Nested incomplete task
  - [x] Nested completed task

---

## Links and Images

### Links

[Basic link to Google](https://www.google.com)

[Link with title](https://www.github.com "GitHub Homepage")

<https://www.example.com> (Automatic link)

[Reference-style link][reference-id]

[Another reference link][1]

[reference-id]: https://www.example.com "Reference Link Title"
[1]: https://www.markdown.org

### Images

![Alt text for image](https://via.placeholder.com/150x100/0066CC/FFFFFF?text=Sample+Image)

![Image with title](https://via.placeholder.com/200x150/FF6600/FFFFFF?text=Another+Image "This is the image title")

[![Image that's also a link](https://via.placeholder.com/100x75/009900/FFFFFF?text=Clickable)](https://www.example.com)

Reference-style image:
![Reference image][image-ref]

[image-ref]: https://via.placeholder.com/120x90/CC0066/FFFFFF?text=Reference+Image "Reference Image Title"

---

## Code and Syntax

### Inline Code

Use `console.log()` to output to the console.

Variables like `userName` and `totalPrice` should be camelCase.

### Code Blocks

```
Basic code block without syntax highlighting
This is plain text
No formatting applied
```

#### JavaScript Code Block

```javascript
function calculateTotal(price, tax) {
    const taxAmount = price * (tax / 100);
    return price + taxAmount;
}

// Usage example
const total = calculateTotal(100, 8.5);
console.log(`Total: $${total.toFixed(2)}`);
```

#### Python Code Block

```python
def fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    
    return sequence

# Generate first 10 Fibonacci numbers
fib_numbers = fibonacci(10)
print(f"First 10 Fibonacci numbers: {fib_numbers}")
```

#### HTML Code Block

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample HTML</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a <strong>sample</strong> HTML document.</p>
</body>
</html>
```

#### CSS Code Block

```css
/* Modern CSS Grid Layout */
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
}
```

#### SQL Code Block

```sql
-- Complex SQL query with joins and aggregation
SELECT 
    c.customer_name,
    c.email,
    COUNT(o.order_id) as total_orders,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as avg_order_value,
    MAX(o.order_date) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.created_date >= '2023-01-01'
GROUP BY c.customer_id, c.customer_name, c.email
HAVING total_spent > 1000
ORDER BY total_spent DESC
LIMIT 50;
```

---

## Tables

### Basic Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Table with Alignment

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left text    | Center text    | Right text    |
| More left    | More center    | More right    |
| Even more    | Even more      | Even more     |

### Complex Table with Various Content

| Product Name | Price | Category | In Stock | Rating | Description |
|:-------------|------:|:--------:|:--------:|:------:|:------------|
| Laptop Pro   | $1,299 | Electronics | ✅ | ⭐⭐⭐⭐⭐ | High-performance laptop with **16GB RAM** |
| Wireless Mouse | $29.99 | Accessories | ✅ | ⭐⭐⭐⭐ | Ergonomic wireless mouse |
| USB-C Hub | $49.99 | Accessories | ❌ | ⭐⭐⭐ | Multi-port hub with *fast charging* |
| Gaming Keyboard | $129.99 | Electronics | ✅ | ⭐⭐⭐⭐⭐ | Mechanical keyboard with RGB lighting |

---

## Blockquotes

> This is a simple blockquote.

> This is a longer blockquote that demonstrates how markdown handles
> multiple lines within a single quote block. You can include **bold text**,
> *italic text*, and even `inline code` within blockquotes.

> ### Blockquotes can contain headers
> 
> They can also contain:
> - Lists
> - Multiple paragraphs
> - Other markdown elements
>
> > This is a nested blockquote
> > 
> > > And this is a deeply nested blockquote

> **Author Quote Example:**
> 
> "The best way to predict the future is to create it."
> 
> — *Peter Drucker*

---

## Horizontal Rules

You can create horizontal rules using three or more hyphens, asterisks, or underscores:

---

Three hyphens above

***

Three asterisks above

___

Three underscores above

---

## Line Breaks and Paragraphs

This is the first paragraph. It contains multiple sentences to demonstrate how paragraphs work in Markdown. The paragraph continues until there's a blank line.

This is the second paragraph. Notice there's a blank line between this and the previous paragraph.

This line has two spaces at the end.  
This creates a line break without starting a new paragraph.

This is another paragraph  
with a line break in the middle  
and another line break here.

---

## Special Characters

### Escaping Characters

To display literal markdown characters, use backslashes:

\*This text is not italic\*

\**This text is not bold\**

\`This is not inline code\`

\# This is not a header

\[This is not a link\](https://example.com)

### HTML Entities and Special Symbols

&copy; Copyright symbol

&trade; Trademark symbol

&reg; Registered trademark

&lt; Less than

&gt; Greater than

&amp; Ampersand

&quot; Quote mark

&#8594; Right arrow (→)

&#8592; Left arrow (←)

&#8593; Up arrow (↑)

&#8595; Down arrow (↓)

### Emoji (if supported)

:smile: :heart: :thumbsup: :rocket: :fire: :star:

🎉 🚀 💻 📱 🎯 ✨

---

## Advanced Features

### Footnotes (if supported)

This text has a footnote[^1].

This text has another footnote[^note].

[^1]: This is the first footnote.
[^note]: This is a named footnote with more detailed information.

### Definition Lists (if supported)

Term 1
:   Definition for term 1

Term 2
:   Definition for term 2
:   Another definition for term 2

### Abbreviations (if supported)

The HTML specification is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

---

## Mathematics (if supported)

Inline math: $E = mc^2$

Block math:
$$
\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n
$$

---

## Conclusion

This document demonstrates the full range of Markdown syntax and capabilities. Different Markdown parsers may support additional features or render some elements differently, but these are the core components that work across most platforms.

### Key Takeaways:

1. **Headers** use `#` symbols (1-6 levels)
2. **Text formatting** uses `*`, `_`, `**`, `__`, `~~`, and backticks
3. **Lists** can be ordered (numbers) or unordered (`-`, `*`, `+`)
4. **Links** use `[text](url)` or reference-style syntax
5. **Images** use `![alt](url)` syntax
6. **Code** can be inline with backticks or blocks with triple backticks
7. **Tables** use pipes `|` to separate columns
8. **Blockquotes** use `>` at the beginning of lines

Remember to check your specific Markdown parser's documentation for any additional features or syntax variations!

---

*This document was created to demonstrate comprehensive Markdown usage. Last updated: June 2025.*