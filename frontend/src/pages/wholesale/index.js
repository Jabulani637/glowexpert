import { $ } from '../../lib/dom.js';

const form = $('wholesaleForm');
const responseMsg = $('wholesaleResponse');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('wholesaleSubmitBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const payload = {
      name: $('name').value,
      email: $('email').value,
      company: $('company').value,
      quantity: $('quantity').value,
      message: $('message').value
    };

    try {
      const res = await fetch('/api/wholesale-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        responseMsg.textContent = 'Thank you! Your inquiry has been sent.';
        responseMsg.style.color = 'var(--success-whatsapp)';
        form.reset();
      } else {
        throw new Error('Failed to send');
      }
    } catch (err) {
      responseMsg.textContent = 'Error sending inquiry. Please try again.';
      responseMsg.style.color = 'var(--promo)';
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}
