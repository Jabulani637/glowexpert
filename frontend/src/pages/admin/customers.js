import { $, escapeHtml } from '../../lib/dom.js';
import { money } from '../../lib/format.js';

function customerRowTemplate(item) {
  return `
    <tr>
      <td>${escapeHtml(item.name || '-')}</td>
      <td>${escapeHtml(item.email)}</td>
      <td>${escapeHtml(item.cellphone || '-')}</td>
      <td>${escapeHtml(item.order_count)}</td>
      <td>${escapeHtml(money(item.total_spent || 0))}</td>
    </tr>
  `;
}

export function renderCustomers(items) {
  $('metricCustomers').textContent = String(items.length);
  const tbody = $('customersTbody');

  tbody.innerHTML = items.length
    ? items.map(customerRowTemplate).join('')
    : '<tr><td colspan="5" class="muted">No customers yet.</td></tr>';
}
