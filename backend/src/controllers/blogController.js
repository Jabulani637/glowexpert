const BlogPost = require('../models/BlogPost');

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Public endpoints
async function getBlogPosts(req, res) {
  try {
    const { contentType, featured, limit = 20, offset = 0 } = req.query;
    
    const posts = await BlogPost.findAll({
      status: 'published',
      limit: Math.min(parseInt(limit, 10), 50),
      offset: parseInt(offset, 10),
      contentType: contentType || null,
      featured: featured !== undefined ? featured === 'true' : null
    });

    const total = await BlogPost.count({ 
      status: 'published', 
      contentType: contentType || null 
    });

    res.json({
      data: posts,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: parseInt(offset, 10) + posts.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Failed to fetch blog posts' });
  }
}

async function getFeaturedPosts(req, res) {
  try {
    const posts = await BlogPost.findFeatured();
    res.json({ data: posts });
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({ message: 'Failed to fetch featured posts' });
  }
}

async function getBlogPost(req, res) {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (post.status !== 'published') {
      return res.status(403).json({ message: 'Blog post not available' });
    }

    res.json({ data: post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Failed to fetch blog post' });
  }
}

// Admin endpoints
async function getAllPosts(req, res) {
  try {
    const { status, contentType } = req.query;
    const posts = await BlogPost.findAll({
      status: status || null,
      contentType: contentType || null,
      limit: 100,
      offset: 0
    });

    res.json({ data: posts });
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    res.status(500).json({ message: 'Failed to fetch blog posts' });
  }
}

async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({ data: post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Failed to fetch blog post' });
  }
}

async function createPost(req, res) {
  try {
    const {
      title,
      excerpt,
      content,
      contentType = 'article',
      videoUrl,
      videoThumbnail,
      featuredImage,
      metaDescription,
      metaKeywords,
      status = 'draft',
      sortOrder = 0,
      isFeatured = false
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Respect an admin-supplied slug (sanitized through the same slug rules);
    // only fall back to auto-generating one from the title if none was given.
    // Previously this always overwrote whatever slug the admin typed in the
    // form, silently discarding it.
    const requestedSlug = typeof req.body.slug === 'string' ? req.body.slug.trim() : '';
    let slug = requestedSlug ? generateSlug(requestedSlug) : generateSlug(title);
    if (!slug) slug = generateSlug(title);

    // Check if slug exists and make it unique
    let existingPost = await BlogPost.findBySlug(slug);
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      contentType,
      videoUrl,
      videoThumbnail,
      featuredImage,
      metaDescription,
      metaKeywords,
      status,
      publishedAt,
      sortOrder,
      isFeatured
    });

    res.status(201).json({
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ message: 'A post with this slug already exists' });
    }
    res.status(500).json({ message: 'Failed to create blog post' });
  }
}

async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if post exists
    const existingPost = await BlogPost.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Only auto-regenerate the slug from the title when the client didn't
    // explicitly send a slug of its own (the admin form always sends one,
    // auto-filled from the title unless the admin edited it by hand - see
    // frontend src/pages/admin/blog.js). This preserves admin-edited slugs
    // and stops already-published post URLs from silently changing.
    if (typeof updateData.slug === 'string') {
      const cleanSlug = generateSlug(updateData.slug.trim());
      updateData.slug = cleanSlug || generateSlug(updateData.title || existingPost.title);
    } else if (updateData.title && updateData.title !== existingPost.title) {
      updateData.slug = generateSlug(updateData.title);
    }

    // Set published_at when changing status to published
    if (updateData.status === 'published' && !existingPost.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const post = await BlogPost.update(id, updateData);

    res.json({
      message: 'Blog post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'A post with this slug already exists' });
    }
    res.status(500).json({ message: 'Failed to update blog post' });
  }
}

async function deletePost(req, res) {
  try {
    const { id } = req.params;
    
    const deleted = await BlogPost.remove(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Failed to delete blog post' });
  }
}

async function getStats(req, res) {
  try {
    const total = await BlogPost.count({});
    const published = await BlogPost.count({ status: 'published' });
    const drafts = await BlogPost.count({ status: 'draft' });
    const articles = await BlogPost.count({ status: 'published', contentType: 'article' });
    const tutorials = await BlogPost.count({ status: 'published', contentType: 'tutorial' });
    const videos = await BlogPost.count({ status: 'published', contentType: 'video' });

    res.json({
      data: {
        total,
        published,
        drafts,
        byType: { articles, tutorials, videos }
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
}

module.exports = {
  // Public
  getBlogPosts,
  getFeaturedPosts,
  getBlogPost,
  // Admin
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getStats
};