import { normalizeAsset } from '../../lib/api.js';
import { escapeHtml } from '../../lib/dom.js';
import { state } from './state.js';

/**
 * Build a single card for the trending carousel track.
 * Reuses the same image-treatment pattern as .product-card elsewhere.
 */
function trendingCardTemplate(product) {
  return `
    <div class="trending-card" data-product-id="${escapeHtml(String(product.id))}">
      <div class="trending-card-image">
        ${product.image_url ? `<img src="${escapeHtml(normalizeAsset(product.image_url))}" alt="${escapeHtml(product.name || '')}" loading="lazy" />` : ''}
      </div>
      <div class="trending-card-caption">
        <span class="trending-card-name">${escapeHtml(product.name || '')}</span>
      </div>
    </div>
  `;
}

/**
 * Initialize the trending styles carousel.
 * Must be called after state.products has been populated (i.e. after
 * initializeStore resolves).
 */
export function initTrendingCarousel() {
  const track = document.getElementById('trendingTrack');
  const prevBtn = document.getElementById('trendingPrev');
  const nextBtn = document.getElementById('trendingNext');
  if (!track || !prevBtn || !nextBtn) return;

  // Filter to featured / best-seller products, fallback to all if <4
  let items = state.products.filter(
    (p) => p.is_featured || p.is_best_seller
  );
  if (items.length < 4) {
    items = state.products;
  }
  if (!items.length) {
    track.innerHTML = '<p class="empty-state" style="padding:40px 0;">Trending styles coming soon.</p>';
    return;
  }

  // Render cards
  track.innerHTML = items.map(trendingCardTemplate).join('');

  // Determine card width (fixed 280px) from the first card or default
  function getCardWidth() {
    const first = track.querySelector('.trending-card');
    if (first) return first.getBoundingClientRect().width + parseFloat(getComputedStyle(first).marginRight || 0);
    return 280;
  }

  function updateButtons() {
    const scrollLeft = track.scrollLeft;
    const scrollWidth = track.scrollWidth - track.clientWidth;

    prevBtn.disabled = scrollLeft <= 1;
    nextBtn.disabled = scrollLeft >= scrollWidth - 1;
  }

  // Scroll right by one card
  nextBtn.addEventListener('click', () => {
    const cardWidth = getCardWidth();
    track.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  // Scroll left by one card
  prevBtn.addEventListener('click', () => {
    const cardWidth = getCardWidth();
    track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });

  // Update button states on scroll
  track.addEventListener('scroll', updateButtons);

  // Initial button state
  updateButtons();

  // Recalculate on resize
  window.addEventListener('resize', updateButtons);
}

