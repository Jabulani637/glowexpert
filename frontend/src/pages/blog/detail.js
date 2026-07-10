import { api, normalizeAsset } from '../../lib/api.js';
import { $, escapeHtml } from '../../lib/dom.js';
import { formatDate, formatContent, typeBadge } from './format.js';
import { renderVideoEmbed } from './video-embed.js';

const BACK_LINK = `
  <a href="blog.html" class="back-to-blog">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    Back to Blog
  </a>
`;

function notFoundTemplate() {
  return `
    <div class="blog-post-detail" style="text-align: center;">
      ${BACK_LINK}
      <div class="blog-empty">
        <h2>Post not found</h2>
        <p>The blog post you're looking for doesn't exist or hasn't been published yet.</p>
      </div>
    </div>
  `;
}

function postDetailTemplate(post) {
  const { label: typeLabel, cssClass: typeClass } = typeBadge(post.content_type);

  return `
    <div class="blog-post-detail">
      ${BACK_LINK}
      <div class="blog-post-header">
        <span class="blog-post-type ${typeClass}">${typeLabel}</span>
        <h1 class="blog-post-title">${escapeHtml(post.title)}</h1>
        <div class="blog-post-meta">
          <span>${formatDate(post.published_at || post.created_at)}</span>
          <span>${post.view_count} views</span>
        </div>
      </div>
      ${post.featured_image ? `<img src="${escapeHtml(normalizeAsset(post.featured_image))}" alt="${escapeHtml(post.title)}" class="blog-post-featured-image" />` : ''}
      ${renderVideoEmbed(post.video_url, post.video_thumbnail ? normalizeAsset(post.video_thumbnail) : null)}
      <div class="blog-post-content">${formatContent(post.content)}</div>
    </div>
  `;
}

export async function renderPostDetail(slug) {
  const app = $('app');
  if (!app) return;

  app.innerHTML = '<div style="padding: 140px 20px; text-align: center;">Loading...</div>';

  try {
    const result = await api(`/api/posts/${encodeURIComponent(slug)}`);
    app.innerHTML = postDetailTemplate(result.data);
  } catch {
    app.innerHTML = notFoundTemplate();
  }
}
