import { $ } from '../../lib/dom.js';
import { showNotification } from '../../lib/notify.js';
import { state } from './state.js';
import { renderCart } from './render.js';

const CART_KEY = 'glowexpert_cart';
const REFERRAL_KEY = 'glowexpert_referral';

/** Drops cart lines whose product no longer exists, is out of stock, or
 * whose quantity now exceeds current stock (clamps it down instead). */
function syncCartWithProducts() {
  const byId = new Map(state.products.map((item) => [item.id, item]));
  state.cart = state.cart
    .map((item) => {
      const product = byId.get(item.product_id);
      if (!product) return null;
      return {
        ...item,
        name: product.name,
        price: Number(product.price),
        currency: product.currency || 'ZAR',
        image_url: product.image_url,
        stock: Number(product.stock || 0)
      };
    })
    .filter(Boolean)
    .filter((item) => item.quantity > 0 && item.stock > 0)
    .map((item) => ({ ...item, quantity: Math.min(item.quantity, item.stock) }));
}

export function loadCart() {
  try {
    state.cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    state.cart = [];
  }
  syncCartWithProducts();
  renderCart();
}

export function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  renderCart();
}

export function saveReferralCode(code) {
  if (code) {
    localStorage.setItem(REFERRAL_KEY, code);
  } else {
    localStorage.removeItem(REFERRAL_KEY);
  }
}

export function loadReferralCode() {
  return localStorage.getItem(REFERRAL_KEY) || '';
}

export function clearReferralCode() {
  localStorage.removeItem(REFERRAL_KEY);
}

export function openCart() {
  $('cartPanel')?.classList.add('open');
  $('cartBackdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeCart() {
  $('cartPanel')?.classList.remove('open');
  $('cartBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

export function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product || Number(product.stock) <= 0) {
    showNotification('This product is out of stock', 'error');
    return;
  }

  const existing = state.cart.find((item) => item.product_id === productId);
  if (existing) {
    if (existing.quantity >= Number(product.stock)) {
      showNotification('Maximum stock reached', 'error');
      return;
    }
    existing.quantity = Math.min(existing.quantity + 1, Number(product.stock));
  } else {
    state.cart.push({
      product_id: product.id,
      quantity: 1,
      name: product.name,
      price: Number(product.price),
      currency: product.currency || 'ZAR',
      image_url: product.image_url,
      stock: Number(product.stock || 0)
    });
  }

  saveCart();
  showNotification(`${product.name} added to cart!`, 'success');

  if (state.cart.length === 1) {
    openCart();
  }
}

export function changeQty(productId, delta) {
  const item = state.cart.find((entry) => entry.product_id === productId);
  if (!item) return;

  const next = item.quantity + delta;
  if (next <= 0) {
    state.cart = state.cart.filter((entry) => entry.product_id !== productId);
    showNotification('Item removed from cart', 'info');
  } else {
    if (next > item.stock) {
      showNotification('Maximum stock reached', 'error');
      return;
    }
    item.quantity = next;
  }

  saveCart();
}

export function removeFromCart(productId) {
  const item = state.cart.find((entry) => entry.product_id === productId);
  state.cart = state.cart.filter((entry) => entry.product_id !== productId);
  saveCart();

  if (item) showNotification(`${item.name} removed from cart`, 'info');
}

/** Event delegation for [data-action] buttons rendered inside product
 * cards and cart line items (add-to-cart / change-qty / remove-from-cart). */
export function setupCartDelegates() {
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const actionEl = target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.getAttribute('data-action');
    const productId = actionEl.getAttribute('data-product-id');
    if (!action) return;

    if (action === 'add-to-cart') addToCart(productId);
    if (action === 'change-qty') changeQty(productId, Number(actionEl.getAttribute('data-delta')));
    if (action === 'remove-from-cart') removeFromCart(productId);
  });
}
