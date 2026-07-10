import { $, escapeHtml } from '../../lib/dom.js';

function subscriberRowTemplate(item) {
  return `
    <tr>
      <td>${escapeHtml(item.name || '-')}</td>
      <td>${escapeHtml(item.email)}</td>
      <td>${escapeHtml(new Date(item.created_at).toLocaleString())}</td>
    </tr>
  `;
}

export function renderSubscribers(items) {
  $('metricSubscribers').textContent = String(items.length);
  const tbody = $('subscribersTbody');

  tbody.innerHTML = items.length
    ? items.map(subscriberRowTemplate).join('')
    : '<tr><td colspan="3" class="muted">No subscribers yet.</td></tr>';
}
