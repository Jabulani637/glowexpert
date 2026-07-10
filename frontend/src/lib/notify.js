// Shared toast/notification component, extracted from home.js.
//
// Visual styling (.cart-notification, .notification-icon, .notification-text,
// .show, .notification-success/error/info) lives entirely in luxury.css.
// The previous copy of this function injected its own conflicting inline
// <style> block with hardcoded colors - removed here so the stylesheet is
// the single source of truth for appearance.

import { escapeHtml } from './dom.js';

export function showNotification(message, type = 'info') {
  const existing = document.querySelector('.cart-notification');
  if (existing) existing.remove();

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  const notification = document.createElement('div');
  notification.className = `cart-notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${icon}</span>
    <span class="notification-text">${escapeHtml(message)}</span>
  `;

  document.body.appendChild(notification);
  requestAnimationFrame(() => notification.classList.add('show'));

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}
