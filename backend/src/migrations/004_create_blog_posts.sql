-- Blog posts table for tutorials, articles, and video content
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  excerpt TEXT NULL,
  content TEXT NOT NULL,
  
  -- Content type: article, tutorial, video
  content_type VARCHAR(32) NOT NULL DEFAULT 'article',
  
  -- For video content
  video_url TEXT NULL,
  video_thumbnail TEXT NULL,
  
  -- Featured image
  featured_image TEXT NULL,
  
  -- SEO
  meta_description TEXT NULL,
  meta_keywords TEXT NULL,
  
  -- Publishing
  status VARCHAR(32) NOT NULL DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMPTZ NULL,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Engagement
  view_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_type ON blog_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured);