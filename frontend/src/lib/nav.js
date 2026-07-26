// Shared nav behaviors used across public-facing pages.
// Previously duplicated (nearly identically) inside home.js, admin.js, and
// blog.js as three separate copies of the same hamburger-menu logic, plus a
// separate shared-ui.js that ran unconditionally on every page even where
// its target elements didn't exist.

import { $ } from './dom.js';

/** Wires the mobile hamburger menu. No-op if the elements aren't present. */
export function setupMobileNav() {
  const navHamburger = $('navHamburger');
  const navLinks = $('navLinks');
  if (!navHamburger || !navLinks) return;

  const closeMenu = () => {
    navHamburger.classList.remove('open');
    navLinks.classList.remove('mobile-open');
    navHamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  navHamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('mobile-open');
    navHamburger.classList.toggle('open', !isOpen);
    navLinks.classList.toggle('mobile-open', !isOpen);
    navHamburger.setAttribute('aria-expanded', String(!isOpen));
    document.body.style.overflow = isOpen ? '' : 'hidden';
  });

  document.querySelectorAll('.nav-close-mobile').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Auto-close mobile menu when viewport resizes to desktop width
  const mql = window.matchMedia('(min-width: 640px)');
  const handleViewportChange = (e) => {
    if (e.matches && navLinks.classList.contains('mobile-open')) {
      closeMenu();
    }
  };
  mql.addEventListener('change', handleViewportChange);

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
      closeMenu();
      navHamburger.focus();
    }
  });
}

/**
 * Toggles the `.scrolled` class on #navbar past a scroll threshold.
 * Uses requestAnimationFrame for debounced performance.
 */
export function setupScrollShadow(threshold = 60) {
  const navbar = $('navbar');
  if (!navbar) return;

  let ticking = false;
  const update = () => {
    navbar.classList.toggle('scrolled', window.scrollY > threshold);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}
