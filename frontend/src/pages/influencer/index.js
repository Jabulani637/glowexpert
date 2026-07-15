import { api as sharedApi } from '../../lib/api.js';
import { $, escapeHtml } from '../../lib/dom.js';
import { requireLogin, logout, getUser } from '../../lib/auth.js';
import { money } from '../../lib/format.js';

const referralCodeDisplay = $('referralCodeDisplay');
const copyReferralCodeBtn = $('copyReferralCodeBtn');
const totalCommission = $('totalCommission');
const totalOrders = $('totalOrders');
const productUrlInput = $('productUrlInput');
const productSelect = $('productSelect');
const generateLinkBtn = $('generateLinkBtn');
const copyLinkBtn = $('copyLinkBtn');
const generatedLink = $('generatedLink');
const influencerOrdersTbody = $('influencerOrdersTbody');
const sessionInfo = $('sessionInfo');
const logoutBtn = $('logoutBtn');

function api(path, options = {}) {
  return sharedApi(path, { requireAuth: true, ...options });
}

function normalizeProductId(value) {
  if (!value) return '';
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed, window.location.origin);
    const productParam = url.searchParams.get('product');
    if (productParam) return productParam;
    const pathname = url.pathname.replace(/\/$/, '');
    return pathname.split('/').pop();
  } catch {
    return trimmed;
  }
}

function renderOrders(items) {
  influencerOrdersTbody.innerHTML = items.length
    ? items.map((item) => `
      <tr>
        <td>${escapeHtml(item.customer_name)}</td>
        <td>${escapeHtml(money(item.total_amount, item.currency))}</td>
        <td>${escapeHtml(item.status)}</td>
        <td>${escapeHtml(new Date(item.created_at).toLocaleDateString())}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="4" class="muted">No attributed orders yet.</td></tr>';
}

async function loadInfluencerData() {
  const [meRes, ordersRes, productsRes] = await Promise.all([
    api('/api/influencer/me'),
    api('/api/influencer/orders'),
    api('/api/products')
  ]);

  const user = getUser();
  if (sessionInfo) sessionInfo.textContent = user ? `${user.name} (${user.email})` : 'Authenticated influencer session';

  const influencer = meRes.data || meRes;
  const orders = ordersRes.data || [];
  const products = productsRes.data || [];

  const code = influencer.referral_code || 'N/A';
  if (referralCodeDisplay) referralCodeDisplay.textContent = code;

  if (copyReferralCodeBtn) {
    copyReferralCodeBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code);
        copyReferralCodeBtn.textContent = 'Copied';
        setTimeout(() => { copyReferralCodeBtn.textContent = 'Copy Code'; }, 2000);
      } catch (err) {
        alert('Copy failed. Please copy manually.');
      }
    });
  }

  if (totalCommission) totalCommission.textContent = money(influencer.total_commission_earned || 0);
  if (totalOrders) totalOrders.textContent = String(orders.length || 0);

  if (productSelect) {
    productSelect.innerHTML = `
      <option value="">Select a product...</option>
      ${products.map((product) => `
        <option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} (${escapeHtml(product.price)})</option>
      `).join('')}
    `;

    productSelect.addEventListener('change', () => {
      if (!productSelect.value) return;
      productUrlInput.value = productSelect.value;
    });
  }

  if (generateLinkBtn) {
    generateLinkBtn.addEventListener('click', () => {
      const productValue = normalizeProductId(productUrlInput.value);
      if (!productValue) {
        alert('Please enter a product URL or select a product.');
        return;
      }
      const base = window.location.origin + window.location.pathname.replace(/[^/]+$/, '');
      const link = `${window.location.origin}/index.html?product=${encodeURIComponent(productValue)}&ref=${encodeURIComponent(code)}`;
      if (generatedLink) generatedLink.value = link;
      if (copyLinkBtn) copyLinkBtn.disabled = false;
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      if (!generatedLink?.value) return;
      try {
        await navigator.clipboard.writeText(generatedLink.value);
        copyLinkBtn.textContent = 'Copied';
        setTimeout(() => { copyLinkBtn.textContent = 'Copy Link'; }, 2000);
      } catch (err) {
        alert('Copy failed. Please copy manually.');
      }
    });
  }

  renderOrders(orders);
}

logoutBtn?.addEventListener('click', () => logout('login.html'));

await requireLogin('login.html');
loadInfluencerData().catch((error) => {
  console.error('Influencer dashboard load failed:', error);
  alert(error.message || 'Unable to load influencer dashboard.');
});
