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
    messageEl.textContent = '✓ You have been subscribed successfully!';
    messageEl.style.color = '#1a7a3a';
    messageEl.classList.add('visible');
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.style.color = '#b00020';
    messageEl.classList.add('visible');
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
    const orderResponse = await api('/api/orders/checkout', {
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

    const order = orderResponse.data;

    // Initiate PayFast payment
    const paymentResponse = await api('/api/payments/payfast/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id })
    });

    const { fields, payfastUrl } = paymentResponse.data;

    // Create and submit hidden form to PayFast
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payfastUrl;

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.style.color = '#b00020';
  }
}
