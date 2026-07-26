import { $ } from '../../lib/dom.js';

export function setupPromo() {
  const promoBar = $('stickyPromoBar');
  const closeBtn = $('closePromoBar');

  if (promoBar && closeBtn) {
    if (sessionStorage.getItem('promoDismissed')) {
      promoBar.style.display = 'none';
    }

    closeBtn.addEventListener('click', () => {
      promoBar.style.display = 'none';
      sessionStorage.setItem('promoDismissed', 'true');
    });
  }

  const copyBtn = $('copyCouponBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('GLOW15').then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  }
}
