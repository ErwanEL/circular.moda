# Blog Content - MDX Files

This directory contains all blog articles in MDX format. Each article is a separate `.mdx` file with frontmatter metadata.

## File Structure

```
content/blog/
├── README.md
├── guia-vender-ropa-usada-buenos-aires.mdx
├── tendencias-moda-sostenible-2024.mdx
├── organizar-armario-eficiente.mdx
└── impacto-ambiental-moda-rapida.mdx
```

## Frontmatter Fields

Each MDX file should include the following frontmatter fields:

```yaml
---
title: 'Article Title'
excerpt: 'Short description of the article'
author: 'Author Name'
publishedAt: '2024-01-15'
updatedAt: '2024-01-20' # Optional
featuredImage: '/path/to/image.jpg' # Optional
readTime: 8 # Optional, will be calculated automatically
published: true
---
```

## Adding New Articles

1. Create a new `.mdx` file in this directory
2. Use the filename as the URL slug (e.g., `my-article.mdx` → `/blog/my-article`)
3. Add the required frontmatter fields
4. Write your content using Markdown/MDX syntax
5. Set `published: true` to make it visible

## Content Guidelines

- Use clear, descriptive titles
- Write engaging excerpts (150-200 characters)
- Add relevant tags for better discoverability
- Use proper Markdown formatting
- Include images in the `/public` directory
- Keep content focused and valuable

## Supported Markdown Features

- Headers (# ## ###)
- Bold and italic text
- Lists (ordered and unordered)
- Links and images
- Code blocks
- Blockquotes
- Tables

The blog system will automatically:

- Calculate reading time
- Generate URLs from filenames
- Sort articles by publication date
- Filter by tags
- Generate related articles
