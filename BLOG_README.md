# Blog Feature - circular.moda

This document describes the blog feature implementation for the circular.moda website.

## Overview

The blog feature provides a complete content management system for publishing articles about sustainable fashion, circular economy, and lifestyle tips.

## Features

### ✅ Implemented

- **Blog Index Page** (`/blog`) - Lists all published articles with filtering by tags
- **Article Pages** (`/blog/[slug]`) - Individual article pages with full content
- **Tag System** - Categorize articles with tags for easy filtering
- **Related Articles** - Show related content based on shared tags
- **Responsive Design** - Mobile-first design using Tailwind CSS
- **SEO Optimized** - Proper meta tags and Open Graph data
- **Static Generation** - Pre-built pages for optimal performance

### 🎨 UI Components

- `BlogCard` - Article preview cards for listings
- `BlogHero` - Hero section for individual articles
- `BlogContent` - Content renderer with markdown-like support
- `RelatedArticles` - Related content suggestions
- `BlogTags` - Tag filtering interface

### 📁 File Structure

```
src/app/
├── blog/
│   ├── page.tsx              # Blog index page
│   └── [slug]/
│       └── page.tsx          # Individual article pages
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   └── blog.ts               # Blog utility functions
└── ui/
    ├── blog-card.tsx         # Article preview component
    ├── blog-hero.tsx         # Article hero section
    ├── blog-content.tsx      # Content renderer
    ├── related-articles.tsx  # Related articles section
    └── blog-tags.tsx         # Tag filtering component

data/
└── blog-articles.json        # Article data (JSON format)
```

## Data Structure

Articles are stored in `data/blog-articles.json` with the following structure:

```typescript
interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  featuredImage?: string;
  readTime: number; // in minutes
  published: boolean;
}
```

## Usage

### Adding New Articles

1. Add a new article object to `data/blog-articles.json`
2. Ensure the `slug` is unique and URL-friendly
3. Set `published: true` to make it visible
4. The site will automatically pick up the new article

### Content Formatting

The content field supports simple markdown-like formatting:

- `# Heading 1`
- `## Heading 2`
- `### Heading 3`
- `- List item`
- `**Bold text**`

### Tag Filtering

Users can filter articles by tags using the URL parameter:

- `/blog?tag=moda-circular` - Shows articles with the "moda-circular" tag

## Navigation

The blog is accessible via:

- Main navigation: "Blog" link in the header
- Direct URL: `/blog`
- Individual articles: `/blog/[slug]`

## Future Enhancements

### Potential Improvements

- [ ] Search functionality
- [ ] Newsletter subscription
- [ ] Comments system
- [ ] Author profiles
- [ ] Article categories
- [ ] Pagination
- [ ] RSS feed
- [ ] Content management interface
- [ ] Image optimization
- [ ] Social sharing buttons

### Content Management

For now, articles are managed by editing the JSON file directly. Consider implementing:

- Admin interface for content management
- Integration with a headless CMS
- Markdown file support
- Image upload system

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with Flowbite components
- **TypeScript**: Full type safety
- **Performance**: Static generation for optimal loading
- **SEO**: Comprehensive meta tags and Open Graph data

## Development

To add new features or modify existing ones:

1. Update the TypeScript interfaces in `src/app/lib/types.ts`
2. Modify utility functions in `src/app/lib/blog.ts`
3. Update UI components in `src/app/ui/`
4. Test with the development server: `npm run dev`

The blog feature is now fully integrated into the circular.moda website and ready for content publishing!
