import { $ } from '../../lib/dom.js';
import { setupMobileNav } from '../../lib/nav.js';
import { getClerk } from '../../lib/clerk.js';


import { api, setStatus } from './status.js';
import { state } from './state.js';
import {
  renderProducts,
  setSelected,
  clearProductForm,
  createProduct,
  updateProduct,
  deleteProduct,
  findProductById
} from './products.js';
import { renderSubscribers } from './subscribers.js';
import { renderCustomers } from './customers.js';
import { renderOrders } from './orders.js';
import { populateSettings, saveSettings } from './settings.js';
import {
  renderBlogPosts,
  renderBlogStats,
  generateSlugFromTitle,
  setSelectedBlogPost,
  clearBlogForm,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  findBlogPostById
} from './blog.js';
import { renderInfluencers, setupInfluencerButtons } from './influencers.js';
import { setupVideoButtons, refreshVideoStorageStatus } from './video-storage.js';
import { setupTabNavigation } from './tabs.js';

async function loadAll() {
  const [productsRes, settingsRes, subscribersRes, customersRes, ordersRes, influencersRes] = await Promise.all([
    api('/api/admin/products'),
    api('/api/admin/settings'),
    api('/api/admin/subscribers'),
    api('/api/admin/customers'),
    api('/api/admin/orders'),
    api('/api/admin/influencers')
  ]);

  state.products = productsRes.data || [];
  renderProducts(state.products);
  populateSettings(settingsRes.data || {});
  renderSubscribers(subscribersRes.data || []);
  renderCustomers(customersRes.data || []);
  renderOrders(ordersRes.data || []);
  renderInfluencers(influencersRes.data || []);

  const sessionInfo = $('sessionInfo');
  if (sessionInfo) sessionInfo.textContent = 'Authenticated admin session';


  setStatus('Dashboard refreshed');
}

async function loadBlogData() {
  const [postsRes, statsRes] = await Promise.all([api('/api/admin/blog'), api('/api/admin/blog/stats')]);

  state.blogPosts = postsRes.data || [];
  renderBlogPosts(state.blogPosts);
  renderBlogStats(statsRes.data || {});
}

function setupProductButtons() {
  $('createBtn')?.addEventListener('click', async () => {
    try {
      await createProduct();
      clearProductForm();
      await loadAll();
      await loadBlogData();
      setStatus('Product created');
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  $('updateBtn')?.addEventListener('click', async () => {
    try {
      await updateProduct();
      await loadAll();
      await loadBlogData();
      setStatus('Product updated');
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  $('clearBtn')?.addEventListener('click', () => {
    clearProductForm();
    setStatus('Product form cleared');
  });
}

function setupBlogButtons() {
  // Auto-fills the slug from the title until the user edits it directly.
  $('blogTitle')?.addEventListener('input', () => {
    if (!$('blogSlug').value || $('blogSlug').dataset.auto) {
      $('blogSlug').value = generateSlugFromTitle($('blogTitle').value);
      $('blogSlug').dataset.auto = 'true';
    }
  });

  $('createBlogBtn')?.addEventListener('click', async () => {
    try {
      await createBlogPost();
      clearBlogForm();
      await loadBlogData();
      setStatus('Blog post created');
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  $('updateBlogBtn')?.addEventListener('click', async () => {
    try {
      await updateBlogPost();
      await loadBlogData();
      setStatus('Blog post updated');
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  $('clearBlogBtn')?.addEventListener('click', () => {
    clearBlogForm();
    setStatus('Blog form cleared');
  });
}

function setupGlobalButtons() {
  $('saveSettingsBtn')?.addEventListener('click', async () => {
    try {
      await saveSettings();
      setStatus('Website settings updated');
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  $('refreshBtn')?.addEventListener('click', async () => {
    try {
      await loadAll();
      await loadBlogData();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  $('logoutBtn')?.addEventListener('click', async () => {
    try {
      const clerk = await getClerk();
      await clerk.signOut({ redirectUrl: 'index.html' });
    } catch (error) {
      setStatus(error.message, true);
    }
  });
}

/** Event delegation for the Edit/Delete buttons rendered inside the
 * products and blog post tables. */
function setupTableDelegates() {
  document.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const selectProductBtn = target.closest('.js-select-product');
    if (selectProductBtn) {
      const product = findProductById(selectProductBtn.getAttribute('data-product-id'));
      if (product) setSelected(product);
      return;
    }

    const deleteProductBtn = target.closest('.js-delete-product');
    if (deleteProductBtn) {
      const id = deleteProductBtn.getAttribute('data-product-id');
      if (!confirm('Delete this product?')) return;
      try {
        await deleteProduct(id);
        clearProductForm();
        await loadAll();
        await loadBlogData();
      } catch (error) {
        setStatus(error.message, true);
      }
      return;
    }

    const selectBlogBtn = target.closest('.js-select-blog');
    if (selectBlogBtn) {
      const post = findBlogPostById(selectBlogBtn.getAttribute('data-blog-id'));
      if (post) setSelectedBlogPost(post);
      return;
    }

    const deleteBlogBtn = target.closest('.js-delete-blog');
    if (deleteBlogBtn) {
      const id = deleteBlogBtn.getAttribute('data-blog-id');
      if (!confirm('Delete this blog post?')) return;
      try {
        await deleteBlogPost(id);
        clearBlogForm();
        await loadBlogData();
      } catch (error) {
        setStatus(error.message, true);
      }
      return;
    }
  });
}

// ─── Boot ───────────────────────────────────────────────────────────────────
const clerk = await getClerk();
if (!clerk.user || clerk.user.publicMetadata?.role !== 'admin') {
  window.location.href = 'index.html';
} else {
  clerk.mountUserButton(document.getElementById('user-button'), {
    afterSignOutUrl: 'index.html'
  });
}


setupMobileNav();
setupTabNavigation();
setupProductButtons();
setupBlogButtons();
setupGlobalButtons();
setupInfluencerButtons();

loadAll()
  .then(() => loadBlogData())
  .catch((error) => setStatus(error.message, true));
