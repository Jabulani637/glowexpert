import { normalizeAsset } from '../../lib/api.js';
import { $, escapeHtml } from '../../lib/dom.js';
import { money } from '../../lib/format.js';
import { state, cartTotal } from './state.js';

let cartBadgeAnimationTimeout = null;

/** Bumps the cart count badge and triggers its bounce animation. */
export function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;

  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.setAttribute('data-count', String(count));
  badge.classList.add('badge-bounce');

  clearTimeout(cartBadgeAnimationTimeout);
  cartBadgeAnimationTimeout = setTimeout(() => {
    badge.classList.remove('badge-bounce');
  }, 500);
}

function productCardTemplate(product) {
  const isInCart = state.cart.some((item) => item.product_id === product.id);
  const cartItem = state.cart.find((item) => item.product_id === product.id);
  const cartQty = isInCart ? cartItem.quantity : 0;
  const disabled = Number(product.stock) <= 0;

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-image">
        ${product.image_url ? `<img src="${escapeHtml(normalizeAsset(product.image_url))}" alt="${escapeHtml(product.name)}" />` : ''}
      </div>
      <div class="product-info">
        <div class="product-meta-row">
          ${product.category ? `<span class="product-category">${escapeHtml(product.category)}</span>` : ''}
          ${product.is_featured ? '<span class="product-featured-pill">Featured</span>' : ''}
          ${product.is_new_arrival ? '<span class="product-featured-pill product-pill-new">New Arrival</span>' : ''}
          ${product.is_best_seller ? '<span class="product-featured-pill product-pill-best">Best Seller</span>' : ''}
          ${product.is_wholesale ? '<span class="product-featured-pill product-pill-wholesale">Wholesale</span>' : ''}
          ${product.is_on_sale ? `<span class="product-featured-pill product-pill-sale">${escapeHtml(String(product.sale_percent_off ?? 0))}% OFF</span>` : ''}
        </div>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <p class="product-description">${escapeHtml(product.description || 'Luxury hair product')}</p>
        <div class="product-details">Stock ${escapeHtml(product.stock)} | ${escapeHtml(product.currency || 'ZAR')}</div>
        <div class="product-meta">
          <div>
            <div class="product-price">${escapeHtml(money(product.price, product.currency))}</div>
            <div class="product-subprice">${Number(product.stock) > 0 ? 'Available now' : 'Out of stock'}</div>
          </div>
          <button
            class="product-button ${isInCart ? 'in-cart' : ''}"
            data-action="add-to-cart"
            data-product-id="${product.id}"
            type="button"
            ${disabled ? 'disabled' : ''}
          >
            ${isInCart ? `In Cart (${cartQty})` : 'Add To Cart'}
          </button>
        </div>
      </div>
    </article>
  `;
}

export function renderProducts(items) {
  const statProducts = $('statProducts');
  const statStock = $('statStock');
  const grid = $('productsGrid');
  if (!grid) return;

  if (statProducts) statProducts.textContent = String(items.length);
  if (statStock) statStock.textContent = String(items.reduce((sum, item) => sum + Number(item.stock || 0), 0));

  grid.innerHTML = items.length
    ? items.map(productCardTemplate).join('')
    : '<p class="empty-state">No products available yet.</p>';
}

function cartItemTemplate(item) {
  return `
    <div class="cart-item" data-cart-item="${item.product_id}">
      <div>
        <h4>${escapeHtml(item.name)}</h4>
        <div class="muted">${escapeHtml(money(item.price, item.currency))}</div>
        <div class="qty-controls">
          <button type="button" data-action="change-qty" data-product-id="${item.product_id}" data-delta="-1" aria-label="Decrease quantity">-</button>
          <span class="qty-value">${escapeHtml(item.quantity)}</span>
          <button type="button" data-action="change-qty" data-product-id="${item.product_id}" data-delta="1" aria-label="Increase quantity">+</button>
          <button type="button" data-action="remove-from-cart" data-product-id="${item.product_id}" class="remove-btn" aria-label="Remove item">Remove</button>
        </div>
      </div>
      <strong class="cart-item-total">${escapeHtml(money(item.price * item.quantity, item.currency))}</strong>
    </div>
  `;
}

export function renderCart() {
  updateCartBadge();

  const list = $('cartList');
  const totalEl = $('cartTotal');
  if (!list || !totalEl) return;

  if (!state.cart.length) {
    list.innerHTML = '<p class="empty-state">Your cart is empty. Add a product to continue.</p>';
    totalEl.textContent = 'ZAR 0.00';
    return;
  }

  totalEl.textContent = money(cartTotal(), state.cart[0]?.currency || 'ZAR');
  list.innerHTML = state.cart.map(cartItemTemplate).join('');

  // Product buttons show "In Cart (n)" state, so they need to re-render
  // whenever the cart changes too (but only once it's non-empty - this
  // matches the original behavior, which skips this on an empty cart).
  renderProducts(state.products);
}
