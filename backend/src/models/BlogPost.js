const { query, run } = require('../db');
const crypto = require('crypto');
const { getFallbackStore, saveFallbackStore } = require('../lib/fallbackStore');

// Helper to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

async function ensureBlogPostSchema() {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT NULL,
        content TEXT NOT NULL,
        content_type TEXT NOT NULL DEFAULT 'article',
        video_url TEXT NULL,
        video_thumbnail TEXT NULL,
        featured_image TEXT NULL,
        meta_description TEXT NULL,
        meta_keywords TEXT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        published_at TEXT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // Create indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_blog_posts_content_type ON blog_posts(content_type)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured)`);
  } catch (err) {
    // Table might already exist
  }
}

async function findAll({ status = null, limit = 20, offset = 0, contentType = null, featured = null } = {}) {
  try {
    let sql = `SELECT * FROM blog_posts WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (contentType) {
      sql += ` AND content_type = ?`;
      params.push(contentType);
    }

    if (featured !== null) {
      sql += ` AND is_featured = ?`;
      params.push(featured ? 1 : 0);
    }

    sql += ` ORDER BY is_featured DESC, sort_order ASC, published_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows.map(row => ({
      ...row,
      is_featured: !!row.is_featured
    }));
  } catch (err) {
    const store = getFallbackStore();
    return store.blogPosts
      .filter((post) => (status ? post.status === status : true))
      .filter((post) => (contentType ? post.content_type === contentType : true))
      .filter((post) => (featured !== null ? Boolean(post.is_featured) === Boolean(featured) : true))
      .slice(offset, offset + limit)
      .map((post) => ({ ...post, is_featured: Boolean(post.is_featured) }));
  }
}

async function findFeatured() {
  try {
    const { rows } = await query(`
      SELECT * FROM blog_posts 
      WHERE status = 'published' AND is_featured = 1
      ORDER BY sort_order ASC, published_at DESC 
      LIMIT 6
    `);
    return rows.map(row => ({
      ...row,
      is_featured: !!row.is_featured
    }));
  } catch (err) {
    const store = getFallbackStore();
    return store.blogPosts
      .filter((post) => post.status === 'published' && post.is_featured)
      .slice(0, 6)
      .map((post) => ({ ...post, is_featured: Boolean(post.is_featured) }));
  }
}

async function findBySlug(slug) {
  try {
    await run(`UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = ?`, [slug]);
    const { rows } = await query(
      'SELECT * FROM blog_posts WHERE slug = ? LIMIT 1',
      [slug]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      is_featured: !!rows[0].is_featured
    };
  } catch (err) {
    const store = getFallbackStore();
    const post = store.blogPosts.find((item) => item.slug === slug);
    if (!post) return null;
    post.view_count = (post.view_count || 0) + 1;
    saveFallbackStore(store);
    return { ...post, is_featured: Boolean(post.is_featured) };
  }
}

async function findById(id) {
  try {
    const { rows } = await query(
      'SELECT * FROM blog_posts WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      is_featured: !!rows[0].is_featured
    };
  } catch (err) {
    const store = getFallbackStore();
    const post = store.blogPosts.find((item) => item.id === id);
    return post ? { ...post, is_featured: Boolean(post.is_featured) } : null;
  }
}

async function create(data) {
  const {
    title,
    slug,
    excerpt,
    content,
    contentType = 'article',
    videoUrl = null,
    videoThumbnail = null,
    featuredImage = null,
    metaDescription = null,
    metaKeywords = null,
    status = 'draft',
    publishedAt = null,
    sortOrder = 0,
    isFeatured = false
  } = data;

  try {
    const id = generateUUID();
    await run(
      `INSERT INTO blog_posts (
        id, title, slug, excerpt, content, content_type, video_url, video_thumbnail,
        featured_image, meta_description, meta_keywords, status, published_at,
        sort_order, is_featured, view_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id, title, slug, excerpt, content, contentType, videoUrl, videoThumbnail,
        featuredImage, metaDescription, metaKeywords, status, publishedAt,
        sortOrder, isFeatured ? 1 : 0, getCurrentTimestamp(), getCurrentTimestamp()
      ]
    );
    return findById(id);
  } catch (err) {
    const store = getFallbackStore();
    const post = {
      id: generateUUID(),
      title,
      slug,
      excerpt,
      content,
      content_type: contentType,
      video_url: videoUrl,
      video_thumbnail: videoThumbnail,
      featured_image: featuredImage,
      meta_description: metaDescription,
      meta_keywords: metaKeywords,
      status,
      published_at: publishedAt,
      sort_order: sortOrder,
      is_featured: Boolean(isFeatured),
      view_count: 0,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    store.blogPosts.unshift(post);
    saveFallbackStore(store);
    return { ...post, is_featured: Boolean(post.is_featured) };
  }
}

async function update(id, data) {
  try {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (key === 'isFeatured') {
          fields.push('is_featured = ?');
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return await findById(id);

    fields.push('updated_at = ?');
    values.push(getCurrentTimestamp(), id);

    await run(
      `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return findById(id);
  } catch (err) {
    const store = getFallbackStore();
    const index = store.blogPosts.findIndex((post) => post.id === id);
    if (index < 0) return null;
    store.blogPosts[index] = { ...store.blogPosts[index], ...data, updated_at: getCurrentTimestamp() };
    saveFallbackStore(store);
    return { ...store.blogPosts[index], is_featured: Boolean(store.blogPosts[index].is_featured) };
  }
}

async function remove(id) {
  try {
    const result = await run('DELETE FROM blog_posts WHERE id = ?', [id]);
    return result.changes > 0;
  } catch (err) {
    const store = getFallbackStore();
    const before = store.blogPosts.length;
    store.blogPosts = store.blogPosts.filter((post) => post.id !== id);
    saveFallbackStore(store);
    return store.blogPosts.length < before;
  }
}

async function count({ status = null, contentType = null } = {}) {
  let sql = 'SELECT COUNT(*) as count FROM blog_posts WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (contentType) {
    sql += ' AND content_type = ?';
    params.push(contentType);
  }

  const { rows } = await query(sql, params);
  return parseInt(rows[0]?.count || '0', 10);
}

async function findByStatus(status) {
  const { rows } = await query(
    'SELECT * FROM blog_posts WHERE status = ? ORDER BY published_at DESC',
    [status]
  );
  return rows.map(row => ({
    ...row,
    is_featured: !!row.is_featured
  }));
}

module.exports = {
  ensureBlogPostSchema,
  findAll,
  findFeatured,
  findBySlug,
  findById,
  create,
  update,
  remove,
  count,
  findByStatus
};
