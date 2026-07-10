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

  navHamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('mobile-open');
    navHamburger.classList.toggle('open', !isOpen);
    navLinks.classList.toggle('mobile-open', !isOpen);
    navHamburger.setAttribute('aria-expanded', String(!isOpen));
    document.body.style.overflow = isOpen ? '' : 'hidden';
  });

  document.querySelectorAll('.nav-close-mobile').forEach((link) => {
    link.addEventListener('click', () => {
      navHamburger.classList.remove('open');
      navLinks.classList.remove('mobile-open');
      navHamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/**
 * Toggles the `.scrolled` class on #navbar past a scroll threshold.
 * (This is the only part of the old shared-ui.js that ever had an
 * observable effect - see notes in src/pages/shared/navbar-scroll-init.js.)
 */
export function setupScrollShadow(threshold = 60) {
  const navbar = $('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > threshold);
  });
}
