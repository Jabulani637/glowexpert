import { api } from '../../lib/api.js';
import { $ } from '../../lib/dom.js';
import { redirectIfLoggedIn, getUser, setSession } from '../../lib/auth.js';

const errorEl = $('errorMessage');

const existingUser = getUser();
if (existingUser) {
  window.location.href = existingUser.role === 'influencer' ? 'influencer.html' : 'admin.html';
}

$('loginBtn')?.addEventListener('click', async () => {
  if (errorEl) errorEl.textContent = '';

  const cellphone = $('cellphone')?.value?.trim() || '';
  const password = $('password')?.value || '';

  if (!cellphone || !password) {
    if (errorEl) errorEl.textContent = 'Please enter both email/cellphone and password.';
    return;
  }

  try {
    const result = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cellphone, password })
    });

    if (result.otp_required) {
      if (errorEl) errorEl.textContent = 'OTP login is disabled on this site.';
      return;
    }

    setSession(result.access_token, result.user);
    window.location.href = result.user?.role === 'influencer' ? 'influencer.html' : 'admin.html';
  } catch (error) {
    if (errorEl) errorEl.textContent = error.message;
  }
});
