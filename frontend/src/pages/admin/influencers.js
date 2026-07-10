import { $, escapeHtml } from '../../lib/dom.js';
import { money } from '../../lib/format.js';
import { api } from './status.js';

const influencerRowTemplate = (item) => {
  const referralCode = escapeHtml(item.referral_code || '-');
  const orderCount = escapeHtml(item.order_stats?.order_count || 0);
  const totalSales = money(item.order_stats?.total_sales || 0, item.currency || 'ZAR');

  return `
    <tr>
      <td>${escapeHtml(item.user_name || item.name || '-')}</td>
      <td>${escapeHtml(item.user_email || item.email || '-')}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <span>${referralCode}</span>
          <button class="btn secondary js-copy-referral" type="button" data-referral="${escapeHtml(item.referral_code)}">Copy</button>
        </div>
      </td>
      <td>${escapeHtml(item.commission_rate || 0)}%</td>
      <td>${money(item.total_commission_earned || 0)}</td>
      <td>${orderCount}</td>
      <td>${totalSales}</td>
    </tr>
  `;
};

export function renderInfluencers(items) {
  const tbody = $('influencersTbody');
  tbody.innerHTML = items.length
    ? items.map(influencerRowTemplate).join('')
    : '<tr><td colspan="7" class="muted">No influencers found.</td></tr>';
}

export async function loadInfluencers() {
  const response = await api('/api/admin/influencers');
  renderInfluencers(response.data || []);
}

export function setupInfluencerButtons() {
  const registerBtn = $('registerInfluencerBtn');
  const banner = $('influencerBanner');
  const bannerCode = $('influencerBannerCode');
  const bannerPassword = $('influencerBannerPassword');
  const closeBanner = $('closeInfluencerBanner');

  closeBanner?.addEventListener('click', () => {
    if (banner) banner.hidden = true;
  });

  registerBtn?.addEventListener('click', async () => {
    const name = $('influencerName')?.value.trim();
    const email = $('influencerEmail')?.value.trim();
    const cellphone = $('influencerCellphone')?.value.trim();
    const commissionRate = Number($('influencerCommissionRate')?.value || 0);

    if (!name || !email || Number.isNaN(commissionRate)) {
      return alert('Please provide a name, email, and commission rate.');
    }

    try {
      const result = await api('/api/admin/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, cellphone, commission_rate: commissionRate })
      });

      if (banner && bannerCode && bannerPassword) {
        bannerCode.textContent = result.influencer?.referral_code || result.influencer?.referral_code || '-';
        bannerPassword.textContent = result.temp_password || '—';
        banner.hidden = false;
      }

      await loadInfluencers();
      $('influencerName').value = '';
      $('influencerEmail').value = '';
      $('influencerCellphone').value = '';
      $('influencerCommissionRate').value = '5';
    } catch (error) {
      alert(error.message || 'Failed to register influencer.');
    }
  });

  document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const copyBtn = target.closest('.js-copy-referral');
    if (!copyBtn) return;

    const referralCode = copyBtn.getAttribute('data-referral');
    if (!referralCode) return;

    try {
      await navigator.clipboard.writeText(referralCode);
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    } catch (err) {
      alert('Clipboard copy failed. Please copy manually.');
    }
  });
}
