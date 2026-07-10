import { api } from '../../lib/api.js';
import { $ } from '../../lib/dom.js';
import { state } from './state.js';
import { saveCart, clearReferralCode } from './cart.js';
import { initializeStore } from './store.js';

export async function submitNewsletter(event) {
  event.preventDefault();
  const messageEl = $('newsletterMessage');
  try {
    await api('/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: $('subscriberName').value.trim() || null,
        email: $('subscriberEmail').value.trim()
      })
    });
    $('newsletterForm').reset();
    messageEl.textContent = 'Subscribed successfully.';
    messageEl.style.color = '#c9a84c';
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.style.color = '#ffb4b4';
  }
}

export async function submitCheckout(event) {
  event.preventDefault();
  const messageEl = $('checkoutMessage');

  if (!state.cart.length) {
    messageEl.textContent = 'Add products to the cart before checkout.';
    messageEl.style.color = '#b00020';
    return;
  }

  try {
    await api('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: $('checkoutName').value.trim(),
        customer_email: $('checkoutEmail').value.trim(),
        customer_phone: $('checkoutPhone').value.trim(),
        referral_code: $('checkoutReferral').value.trim() || undefined,
        items: state.cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
      })
    });

    state.cart = [];
    saveCart();
    clearReferralCode();
    if ($('checkoutReferral')) $('checkoutReferral').value = '';
    $('checkoutForm').reset();
    messageEl.textContent = 'Order placed successfully.';
    messageEl.style.color = '#2b7a0b';
    await initializeStore();
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.style.color = '#b00020';
  }
}
