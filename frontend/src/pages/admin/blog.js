import { $, escapeHtml } from '../../lib/dom.js';
import { api, setStatus } from './status.js';
import { state } from './state.js';

export function generateSlugFromTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function setSelectedBlogPost(post) {
  state.selectedBlogId = post.id;
  $('blogPostId').value = post.id;
  $('blogTitle').value = post.title || '';
  $('blogSlug').value = post.slug || '';
  $('blogContentType').value = post.content_type || 'article';
  $('blogStatus').value = post.status || 'draft';
  $('blogExcerpt').value = post.excerpt || '';
  $('blogContent').value = post.content || '';
  $('blogFeaturedImage').value = post.featured_image || '';
  $('blogVideoUrl').value = post.video_url || '';
  $('blogMetaDesc').value = post.meta_description || '';
  $('blogMetaKeywords').value = post.meta_keywords || '';
  $('blogIsFeatured').checked = post.is_featured || false;
  $('blogSortOrder').value = post.sort_order || 0;
  $('updateBlogBtn').disabled = false;
  setStatus(`Selected: ${post.title}`);
}

export function clearBlogForm() {
  state.selectedBlogId = null;
  $('blogPostId').value = '';
  $('blogTitle').value = '';
  $('blogSlug').value = '';
  $('blogContentType').value = 'article';
  $('blogStatus').value = 'draft';
  $('blogExcerpt').value = '';
  $('blogContent').value = '';
  $('blogFeaturedImage').value = '';
  $('blogVideoUrl').value = '';
  $('blogMetaDesc').value = '';
  $('blogMetaKeywords').value = '';
  $('blogIsFeatured').checked = false;
  $('blogSortOrder').value = 0;
  $('updateBlogBtn').disabled = true;
}

function blogRowTemplate(post) {
  // NOTE: the previous version of this template had `${...}` split across a
  // line break as `$\n{...}`, which JS does not interpolate - it silently
  // rendered the literal text `background:${post.status === ...}` instead
  // of actually coloring the status pill. Fixed here (kept on one line).
  const statusStyle =
    post.status === 'published' ? 'background:rgba(46,125,50,0.16);color:#2e7d32;' : 'background:rgba(10,9,8,0.06);color:#666;';

  return `
    <tr>
      <td><strong>${escapeHtml(post.title)}</strong></td>
      <td><span class="pill">${escapeHtml(post.content_type)}</span></td>
      <td><span class="pill" style="${statusStyle}">${escapeHtml(post.status)}</span></td>
      <td>${escapeHtml(post.view_count)}</td>
      <td>
        <div class="actions" style="margin-top:0;">
          <button type="button" class="btn secondary js-select-blog" data-blog-id="${escapeHtml(post.id)}">Edit</button>
          <a href="blog.html?post=${encodeURIComponent(post.slug)}" class="btn secondary" target="_blank" style="text-decoration:none;">View</a>
          <button type="button" class="btn danger js-delete-blog" data-blog-id="${escapeHtml(post.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

export function renderBlogPosts(items) {
  $('metricBlogPosts').textContent = String(items.length);
  const tbody = $('blogPostsTbody');

  tbody.innerHTML = items.length
    ? items.map(blogRowTemplate).join('')
    : '<tr><td colspan="5" class="muted">No blog posts found.</td></tr>';
}

export function renderBlogStats(stats) {
  $('blogStatTotal').textContent = String(stats.total || 0);
  $('blogStatPublished').textContent = String(stats.published || 0);
  $('blogStatDrafts').textContent = String(stats.drafts || 0);
  $('blogStatVideos').textContent = String(stats.byType?.videos || 0);
}

function collectBlogBody() {
  return {
    title: $('blogTitle').value.trim(),
    slug: $('blogSlug').value.trim(),
    excerpt: $('blogExcerpt').value.trim() || null,
    content: $('blogContent').value.trim(),
    contentType: $('blogContentType').value,
    status: $('blogStatus').value,
    featuredImage: $('blogFeaturedImage').value.trim() || null,
    videoUrl: $('blogVideoUrl').value.trim() || null,
    metaDescription: $('blogMetaDesc').value.trim() || null,
    metaKeywords: $('blogMetaKeywords').value.trim() || null,
    isFeatured: $('blogIsFeatured').checked,
    sortOrder: Number($('blogSortOrder').value)
  };
}

export async function createBlogPost() {
  const title = $('blogTitle').value.trim();
  const content = $('blogContent').value.trim();
  if (!title || !content) throw new Error('Title and content are required');

  const body = collectBlogBody();
  body.slug = body.slug || generateSlugFromTitle(title);

  await api('/api/admin/blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function updateBlogPost() {
  if (!state.selectedBlogId) throw new Error('Select a blog post first.');

  await api(`/api/admin/blog/${state.selectedBlogId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(collectBlogBody())
  });
}

export async function deleteBlogPost(id) {
  await api(`/api/admin/blog/${id}`, { method: 'DELETE' });
}

export function findBlogPostById(id) {
  return state.blogPosts.find((p) => String(p.id) === String(id));
}
