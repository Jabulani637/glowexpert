import { api } from '../../lib/api.js';
import { state } from './state.js';
import { renderProducts } from './render.js';
import { loadCart } from './cart.js';
import { applySettings } from './settings.js';

/** Fetches settings + products, applies them, and (re)loads the cart.
 * Called on initial page load, and again after a successful checkout so
 * stock counts reflect the just-placed order. */
export async function initializeStore() {
  const [settingsRes, productsRes] = await Promise.all([api('/api/settings'), api('/api/products')]);
  applySettings(settingsRes.data || {});
  state.products = productsRes.data || [];
  renderProducts(state.products);
  loadCart();
}
