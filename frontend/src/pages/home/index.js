import { $, escapeHtml } from '../../lib/dom.js';
import { setupMobileNav, setupScrollShadow } from '../../lib/nav.js';
import { setupCartDelegates, openCart, closeCart, saveReferralCode, loadReferralCode, addToCart } from './cart.js';
import { submitNewsletter, submitCheckout } from './checkout.js';
import { initializeStore } from './store.js';


setupMobileNav();
setupScrollShadow();
setupCartDelegates();

$('cartBtn')?.addEventListener('click', openCart);
$('closeCartBtn')?.addEventListener('click', closeCart);
$('cartBackdrop')?.addEventListener('click', closeCart);
$('newsletterForm')?.addEventListener('submit', submitNewsletter);
$('checkoutForm')?.addEventListener('submit', submitCheckout);

initializeStore()
  .then(() => {
    // Ensure video sources reflect latest /api/settings values.
    // (Useful when returning from admin after saving updates.)
    try {
      if ($('heroVideo') && $('heroVideoSource')?.src) {
        $('heroVideo').load();
      }
      if ($('featuredVideoOne') && $('featuredVideoOneSource')?.src) {
        $('featuredVideoOne').load();
      }
      if ($('featuredVideoTwo') && $('featuredVideoTwoSource')?.src) {
        $('featuredVideoTwo').load();
      }
    } catch {
      // no-op
    }

    try {
      const params = new URLSearchParams(window.location.search);

      const productId = params.get('product')?.trim();
      const refCode = params.get('ref')?.trim();
      const referralInput = $('checkoutReferral');

      if (referralInput) {
        const persistedCode = loadReferralCode();
        if (refCode) {
          referralInput.value = refCode;
          saveReferralCode(refCode);
        } else if (persistedCode) {
          referralInput.value = persistedCode;
        }

        referralInput.addEventListener('input', () => {
          const currentValue = referralInput.value.trim();
          if (currentValue) {
            saveReferralCode(currentValue);
          } else {
            saveReferralCode('');
          }
        });
      }

      if (productId && refCode) {
        // Guard to prevent startup from breaking if add-to-cart
        // behavior changes.
        try {
          addToCart(productId);
          openCart();
        } catch (e) {
          // no-op
        }
      }
    } catch {
      // no-op: keep page working; hero video + storefront already applied
    }
  })
  .catch((error) => {
    const grid = $('productsGrid');
    if (grid) grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  });

