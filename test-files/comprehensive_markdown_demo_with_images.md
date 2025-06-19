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

#### Basic Images

![Sample blue image](https://picsum.photos/400/200?random=1)
*Basic image with alt text*

![Landscape photo](https://picsum.photos/500/300?random=2 "Beautiful landscape photo")
*Image with title attribute (hover to see)*

#### Different Sizes and Styles

![Small square image](https://picsum.photos/150/150?random=3)
![Medium rectangular image](https://picsum.photos/300/200?random=4)
![Large banner image](https://picsum.photos/600/200?random=5)

#### Nature and Technology Examples

![Forest landscape](https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop)
*Serene forest landscape*

![Modern city skyline](https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=450&h=250&fit=crop)
*Urban cityscape at dusk*

![Technology workspace](https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop)
*Modern workspace with laptop and coffee*

![Ocean waves](https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=500&h=300&fit=crop)
*Peaceful ocean waves*

#### Clickable Images

[![Click this mountain image to visit Unsplash](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=350&h=200&fit=crop)](https://unsplash.com)
*Click the mountain image above to visit Unsplash*

[![GitHub logo - click to visit](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)](https://github.com)
*Clickable GitHub logo*

#### Reference-Style Images

![Beautiful sunset][sunset-image]
*Reference-style sunset image*

![Abstract art][abstract-art]
*Colorful abstract artwork*

![Architecture photo][architecture]
*Modern architectural design*

[sunset-image]: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop "Stunning mountain sunset"
[abstract-art]: https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=300&fit=crop "Vibrant abstract painting"
[architecture]: https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=400&h=300&fit=crop "Contemporary building design"

#### Image Gallery Layout

| Nature | Technology | Architecture |
|:------:|:----------:|:------------:|
| ![Forest](https://picsum.photos/200/150?random=10) | ![Laptop](https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=200&h=150&fit=crop) | ![Building](https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=150&fit=crop) |
| ![Mountain](https://picsum.photos/200/150?random=11) | ![Smartphone](https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=150&fit=crop) | ![Bridge](https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200&h=150&fit=crop) |
| ![Ocean](https://picsum.photos/200/150?random=12) | ![Code editor](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=150&fit=crop) | ![Skyscraper](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=150&fit=crop) |

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