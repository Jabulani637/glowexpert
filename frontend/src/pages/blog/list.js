import { api, normalizeAsset } from '../../lib/api.js';
import { API_BASE } from '../../config.js';
import { $, escapeHtml } from '../../lib/dom.js';
import { formatDate, typeBadge } from './format.js';

export function setupBlogCardNavigation() {
  document.addEventListener('click', (e) => {
    const el = e.target && e.target.closest && e.target.closest('[data-blog-slug]');
    if (!el) return;
    const slug = el.getAttribute('data-blog-slug');
    if (!slug) return;
    window.location.href = `blog.html?post=${encodeURIComponent(slug)}`;
  });
}

function blogCardTemplate(post) {
  const { label: typeLabel, cssClass: typeClass } = typeBadge(post.content_type);
  const excerpt = post.excerpt || (post.content ? `${post.content.substring(0, 150)}...` : '');

  return `
    <article class="blog-card" data-blog-slug="${escapeHtml(post.slug)}">
      <div class="blog-card-image">
        ${post.featured_image ? `<img src="${escapeHtml(normalizeAsset(post.featured_image))}" alt="${escapeHtml(post.title)}" />` : ''}
        <span class="blog-card-badge ${typeClass}">${typeLabel}</span>
        ${post.is_featured ? '<span class="blog-card-featured">Featured</span>' : ''}
      </div>
      <div class="blog-card-content">
        <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
        <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>
        <div class="blog-card-meta">
          <span class="blog-card-date">${formatDate(post.published_at || post.created_at)}</span>
          <span class="blog-card-views">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            ${post.view_count}
          </span>
        </div>
      </div>
    </article>
  `;
}

export async function renderBlogListing() {
  const app = $('app');
  if (!app) return;

  let currentFilter = 'all';
  let offset = 0;
  const limit = 9;
  let allPosts = [];
  let hasMore = true;
  let isLoading = false;

  app.innerHTML = `
    <section class="blog-hero">
      <h1>GlowExpert Blog</h1>
      <p>Tutorials, tips, and insights about luxury hair care and styling from our experts</p>
    </section>
    <div class="blog-filters">
      <div class="filter-container">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="article">Articles</button>
        <button class="filter-btn" data-filter="tutorial">Tutorials</button>
        <button class="filter-btn" data-filter="video">Videos</button>
      </div>
    </div>
    <div class="blog-grid" id="blogGrid"></div>
    <div class="load-more" id="loadMoreContainer">
      <button class="load-more-btn" id="loadMoreBtn">Load More</button>
    </div>
  `;

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      currentFilter = btn.dataset.filter;
      offset = 0;
      allPosts = [];
      hasMore = true;
      loadPosts();
    });
  });

  $('loadMoreBtn')?.addEventListener('click', () => {
    if (!isLoading && hasMore) loadPosts();
  });

  async function loadPosts() {
    if (isLoading || !hasMore) return;
    isLoading = true;

    try {
      const contentType = currentFilter === 'all' ? null : currentFilter;
      const url = new URL('/api/posts', API_BASE);
      if (contentType) url.searchParams.set('contentType', contentType);
      url.searchParams.set('limit', limit);
      url.searchParams.set('offset', offset);

      const result = await api(url.pathname + url.search);

      if (!result?.data || result.data.length === 0) {
        hasMore = false;
      } else {
        allPosts = [...allPosts, ...result.data];
        offset += result.data.length;
        hasMore = result.pagination?.hasMore || false;
      }

      renderPostsGrid();
    } catch (error) {
      console.error('Error loading posts:', error);
      // Show a helpful UI message instead of silently falling back to “No posts yet”.
      const grid = $('blogGrid');
      const loadMoreContainer = $('loadMoreContainer');
      if (grid) {
        grid.innerHTML = `
          <div class="blog-empty">
            <h2>Could not load posts</h2>
            <p>Please check the API connection (console shows: ${escapeHtml(String(error?.message || error))}).</p>
          </div>
        `;
      }
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';
      hasMore = false;
    } finally {
      isLoading = false;
    }

  }

  function renderPostsGrid() {
    const grid = $('blogGrid');
    const loadMoreContainer = $('loadMoreContainer');
    if (!grid || !loadMoreContainer) return;

    if (allPosts.length === 0) {
      grid.innerHTML = `
        <div class="blog-empty">
          <h2>No posts yet</h2>
          <p>Check back soon for tutorials, articles, and video content about our luxury hair products.</p>
        </div>
      `;
      loadMoreContainer.style.display = 'none';
      return;
    }

    grid.innerHTML = allPosts.map(blogCardTemplate).join('');

    loadMoreContainer.style.display = hasMore ? 'block' : 'none';
    if (!hasMore && allPosts.length > 0) {
      loadMoreContainer.innerHTML = `<p style="color: rgba(10,9,8,0.5); font-size: 0.85rem;">No more posts to load</p>`;
    }
  }

  await loadPosts();
}
