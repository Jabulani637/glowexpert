const { pool } = require('../db');

async function ensureBlogPostSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(300) NOT NULL UNIQUE,
        excerpt TEXT NULL,
        content TEXT NOT NULL,
        content_type VARCHAR(32) NOT NULL DEFAULT 'article',
        video_url TEXT NULL,
        video_thumbnail TEXT NULL,
        featured_image TEXT NULL,
        meta_description TEXT NULL,
        meta_keywords TEXT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'draft',
        published_at TIMESTAMPTZ NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_content_type ON blog_posts(content_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured)`);
  } catch (err) {
    // Table might already exist
  }
}

async function findAll({ status = 'published', limit = 20, offset = 0, contentType = null, featured = null } = {}) {
  let query = `
    SELECT * FROM blog_posts 
    WHERE status = $1
  `;
  const params = [status];
  let paramCount = 1;

  if (contentType) {
    paramCount++;
    query += ` AND content_type = $${paramCount}`;
    params.push(contentType);
  }

  if (featured !== null) {
    paramCount++;
    query += ` AND is_featured = $${paramCount}`;
    params.push(featured);
  }

  paramCount++;
  query += ` ORDER BY is_featured DESC, sort_order ASC, published_at DESC LIMIT $${paramCount}`;
  params.push(limit);

  paramCount++;
  query += ` OFFSET $${paramCount}`;
  params.push(offset);

  const { rows } = await pool.query(query, params);
  return rows;
}

async function findFeatured() {
  const { rows } = await pool.query(`
    SELECT * FROM blog_posts 
    WHERE status = 'published' AND is_featured = true 
    ORDER BY sort_order ASC, published_at DESC 
    LIMIT 6
  `);
  return rows;
}

async function findBySlug(slug) {
  // Increment view count
  await pool.query(`UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1`, [slug]);
  
  const { rows } = await pool.query(
    'SELECT * FROM blog_posts WHERE slug = $1 LIMIT 1',
    [slug]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM blog_posts WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
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

  const { rows } = await pool.query(
    `INSERT INTO blog_posts (
      title, slug, excerpt, content, content_type, video_url, video_thumbnail,
      featured_image, meta_description, meta_keywords, status, published_at,
      sort_order, is_featured
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      title, slug, excerpt, content, contentType, videoUrl, videoThumbnail,
      featuredImage, metaDescription, metaKeywords, status, publishedAt,
      sortOrder, isFeatured
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  }

  if (fields.length === 0) return await findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM blog_posts WHERE id = $1',
    [id]
  );
  return rowCount > 0;
}

async function count({ status = 'published', contentType = null } = {}) {
  let query = 'SELECT COUNT(*) as count FROM blog_posts WHERE status = $1';
  const params = [status];

  if (contentType) {
    params.push(contentType);
    query += ' AND content_type = $2';
  }

  const { rows } = await pool.query(query, params);
  return parseInt(rows[0]?.count || '0', 10);
}

async function findByStatus(status) {
  const { rows } = await pool.query(
    'SELECT * FROM blog_posts WHERE status = $1 ORDER BY published_at DESC',
    [status]
  );
  return rows;
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