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

const statusBadge = (status) => {
  const colors = {
    pending: '#e67e22',
    approved: '#25d366',
    rejected: '#e0116f'
  };
  const color = colors[status] || '#888';
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;background:${color}20;color:${color};text-transform:capitalize;">${escapeHtml(status)}</span>`;
};

const applicationRowTemplate = (app) => {
  const appliedDate = app.created_at ? new Date(app.created_at).toLocaleDateString() : '-';
  const message = app.message
    ? (app.message.length > 60 ? app.message.slice(0, 60) + '…' : app.message)
    : '-';

  const actions = app.status === 'pending'
    ? `<div style="display:flex;gap:6px;">
         <button class="btn js-approve-application" type="button" data-id="${escapeHtml(app.id)}" style="padding:4px 12px;font-size:12px;">Approve</button>
         <button class="btn secondary js-reject-application" type="button" data-id="${escapeHtml(app.id)}" style="padding:4px 12px;font-size:12px;">Reject</button>
       </div>`
    : '<span class="muted">—</span>';

  return `
    <tr>
      <td>${escapeHtml(app.name || '-')}</td>
      <td>${escapeHtml(app.email || '-')}</td>
      <td>${escapeHtml(app.phone || '-')}</td>
      <td>${escapeHtml(app.platform || '-')}</td>
      <td title="${escapeHtml(app.message || '')}">${escapeHtml(message)}</td>
      <td>${statusBadge(app.status)}</td>
      <td>${appliedDate}</td>
      <td>${actions}</td>
    </tr>
  `;
};

export function renderInfluencers(items) {
  const tbody = $('influencersTbody');
  tbody.innerHTML = items.length
    ? items.map(influencerRowTemplate).join('')
    : '<tr><td colspan="7" class="muted">No influencers found.</td></tr>';
}

export function renderApplications(items) {
  const tbody = $('applicationsTbody');
  tbody.innerHTML = items.length
    ? items.map(applicationRowTemplate).join('')
    : '<tr><td colspan="8" class="muted">No applications yet.</td></tr>';
}

export async function loadInfluencers() {
  const response = await api('/api/admin/influencers');
  renderInfluencers(response.data || []);
}

export async function loadApplications() {
  const response = await api('/api/admin/influencer-applications');
  renderApplications(response.data || []);
}

export function setupInfluencerButtons() {
  const banner = $('applicationBanner');
  const bannerTitle = $('applicationBannerTitle');
  const bannerCode = $('applicationBannerCode');
  const bannerPassword = $('applicationBannerPassword');
  const closeBanner = $('closeApplicationBanner');

  closeBanner?.addEventListener('click', () => {
    if (banner) banner.hidden = true;
  });

  document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const approveBtn = target.closest('.js-approve-application');
    if (approveBtn) {
      const id = approveBtn.getAttribute('data-id');
      if (!confirm('Approve this application? An influencer account will be created.')) return;

      try {
        const result = await api(`/api/admin/influencer-applications/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commission_rate: 5 })
        });

        if (banner && bannerTitle && bannerCode && bannerPassword) {
          bannerTitle.textContent = 'Influencer approved successfully.';
          bannerCode.textContent = result.influencer?.referral_code || '-';
          bannerPassword.textContent = result.temp_password || '—';
          banner.hidden = false;
        }

        await loadApplications();
        await loadInfluencers();
      } catch (error) {
        alert(error.message || 'Failed to approve application.');
      }
      return;
    }

    const rejectBtn = target.closest('.js-reject-application');
    if (rejectBtn) {
      const id = rejectBtn.getAttribute('data-id');
      if (!confirm('Reject this application?')) return;

      try {
        await api(`/api/admin/influencer-applications/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        await loadApplications();
      } catch (error) {
        alert(error.message || 'Failed to reject application.');
      }
      return;
    }

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
