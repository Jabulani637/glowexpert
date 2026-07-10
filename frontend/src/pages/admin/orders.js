import { $, escapeHtml } from '../../lib/dom.js';
import { money } from '../../lib/format.js';

function orderRowTemplate(item) {
  const itemsList = Array.isArray(item.items_json)
    ? item.items_json.map((entry) => `${entry.name} x${entry.quantity}`).join(', ')
    : '';

  return `
    <tr>
      <td>
        <strong>${escapeHtml(item.customer_name)}</strong>
        <div class="muted">${escapeHtml(item.customer_email)}</div>
      </td>
      <td><span class="pill">${escapeHtml(item.status)}</span></td>
      <td>${escapeHtml(money(item.total_amount, item.currency))}</td>
      <td>${escapeHtml(itemsList)}</td>
      <td>${escapeHtml(new Date(item.created_at).toLocaleString())}</td>
    </tr>
  `;
}

export function renderOrders(items) {
  $('metricOrders').textContent = String(items.length);
  const tbody = $('ordersTbody');

  tbody.innerHTML = items.length
    ? items.map(orderRowTemplate).join('')
    : '<tr><td colspan="5" class="muted">No orders yet.</td></tr>';
}
