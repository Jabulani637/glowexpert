import { $, escapeHtml } from '../../lib/dom.js';
import { money } from '../../lib/format.js';
import { api, setStatus } from './status.js';
import { state } from './state.js';

export function setSelected(product) {
  state.selectedId = product.id;
  $('productId').value = product.id;
  $('name').value = product.name || '';
  $('slug').value = product.slug || '';
  $('description').value = product.description || '';
  $('category').value = product.category || '';
  $('is_featured').checked = Boolean(product.is_featured);
  $('price').value = product.price ?? '';
  $('currency').value = product.currency || 'ZAR';
  $('stock').value = product.stock ?? 0;
  $('image_url').value = product.image_url || '';
  $('meta_title').value = product.meta_title || '';
  $('meta_description').value = product.meta_description || '';
  $('meta_keywords').value = product.meta_keywords || '';
  $('image_file').value = '';
  $('updateBtn').disabled = false;
  setStatus(`Selected ${product.name}`);
}

export function clearProductForm() {
  state.selectedId = null;
  $('productId').value = '';
  $('name').value = '';
  $('slug').value = '';
  $('description').value = '';
  $('category').value = '';
  $('is_featured').checked = false;
  $('price').value = '';
  $('currency').value = 'ZAR';
  $('stock').value = '';
  $('image_url').value = '';
  $('meta_title').value = '';
  $('meta_description').value = '';
  $('meta_keywords').value = '';
  $('image_file').value = '';
  $('updateBtn').disabled = true;
}

function productRowTemplate(product) {
  return `
    <tr>
      <td>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="muted">${escapeHtml(product.slug || '')}</div>
      </td>
      <td>${escapeHtml(money(product.price, product.currency))}</td>
      <td>${escapeHtml(product.stock)}</td>
      <td>
        <div class="actions" style="margin-top:0;">
          <button type="button" class="btn secondary js-select-product" data-product-id="${escapeHtml(product.id)}">Edit</button>
          <button type="button" class="btn danger js-delete-product" data-product-id="${escapeHtml(product.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

export function renderProducts(items) {
  $('metricProducts').textContent = String(items.length);
  const tbody = $('productsTbody');

  tbody.innerHTML = items.length
    ? items.map(productRowTemplate).join('')
    : '<tr><td colspan="4" class="muted">No products found.</td></tr>';
}

/** Builds the request body for create/update - multipart FormData when a
 * new image file was chosen, plain JSON otherwise. */
export function collectProductBody() {
  const fileInput = $('image_file');
  const hasFile = fileInput.files && fileInput.files[0];

  if (hasFile) {
    const formData = new FormData();
    formData.append('name', $('name').value.trim());
    formData.append('slug', $('slug').value.trim() || '');
    formData.append('description', $('description').value.trim() || '');
    formData.append('category', $('category').value.trim() || '');
    formData.append('is_featured', $('is_featured').checked ? 'true' : 'false');
    formData.append('price', String(Number($('price').value)));
    formData.append('currency', $('currency').value.trim() || 'ZAR');
    formData.append('stock', String(Number($('stock').value)));
    formData.append('meta_title', $('meta_title').value.trim() || '');
    formData.append('meta_description', $('meta_description').value.trim() || '');
    formData.append('meta_keywords', $('meta_keywords').value.trim() || '');
    formData.append('images', fileInput.files[0]);
    return { body: formData, headers: {} };
  }

  return {
    body: JSON.stringify({
      name: $('name').value.trim(),
      slug: $('slug').value.trim() || null,
      description: $('description').value.trim() || null,
      category: $('category').value.trim() || null,
      is_featured: $('is_featured').checked,
      price: Number($('price').value),
      currency: $('currency').value.trim() || 'ZAR',
      image_url: $('image_url').value.trim() || null,
      stock: Number($('stock').value),
      meta_title: $('meta_title').value.trim() || null,
      meta_description: $('meta_description').value.trim() || null,
      meta_keywords: $('meta_keywords').value.trim() || null
    }),
    headers: { 'Content-Type': 'application/json' }
  };
}

export async function createProduct() {
  const { body, headers } = collectProductBody();
  await api('/api/admin/products', { method: 'POST', body, headers });
}

export async function updateProduct() {
  if (!state.selectedId) throw new Error('Select a product first.');
  const { body, headers } = collectProductBody();
  await api(`/api/admin/products/${state.selectedId}`, { method: 'PUT', body, headers });
}

export async function deleteProduct(id) {
  await api(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export function findProductById(id) {
  return state.products.find((p) => String(p.id) === String(id));
}
