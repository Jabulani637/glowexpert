/**
 * Local animated background rotator.
 *
 * Cycles through images from the folder
 *   /src/assets/images/animinated-home-background-images/
 * with a smooth crossfade, independent of DB settings.
 */

import { $ } from '../../lib/dom.js';

// ---------------------------------------------------------------------------
// 1. Image URLs — resolve at runtime via Vite's new URL + import.meta.url.
//    This pattern works in dev (unhashed) and production (hashed filenames).
//    To add new images, drop files into the folder and add an entry below.
// ---------------------------------------------------------------------------
const imageUrls = [
  new URL(
    '../../assets/images/animinated-home-background-images/bodywave_wide_1.png',
    import.meta.url
  ).href,
  new URL(
    '../../assets/images/animinated-home-background-images/bodywave_wide_2.png',
    import.meta.url
  ).href,
  new URL(
    '../../assets/images/animinated-home-background-images/bodywave_wide_3.png',
    import.meta.url
  ).href,
];

const FADE_DURATION = 650;   // ms for crossfade transition
const HOLD_DURATION = 5000;  // ms each image stays fully visible

let timer = null;
let currentIndex = 0;
let layers = [];
let preloaded = false;
let stopped = false;

// ---------------------------------------------------------------------------
// 2. Preload images into browser cache before cycling
// ---------------------------------------------------------------------------
function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // resolve anyway, skip broken images later
          img.src = url;
        })
    )
  );
}

// ---------------------------------------------------------------------------
// 3. Crossfade logic — transitions between images using JS timers + CSS transitions
// ---------------------------------------------------------------------------
function fadeTo(index) {
  // Hide all layers — we only toggle opacity.
  // z-index is NOT touched because it would escape the container's
  // stacking context and paint on top of the hero overlay + content,
  // making the heading and button disappear.
  layers.forEach((layer, i) => {
    layer.style.opacity = i === index ? '1' : '0';
  });
}

function nextImage() {
  if (stopped) return;
  const next = (currentIndex + 1) % layers.length;
  fadeTo(next);
  currentIndex = next;
  timer = setTimeout(nextImage, HOLD_DURATION + FADE_DURATION);
}

function stop() {
  stopped = true;
  if (timer) clearTimeout(timer);
  timer = null;
}

// ---------------------------------------------------------------------------
// 4. Re-enable original heroBgImage/heroBgVideo (called by DB rotator takeover)
// ---------------------------------------------------------------------------
export function restoreOriginalElements() {
  stop();
  const container = document.getElementById('heroBgContainer');
  if (!container) return;

  // Remove dynamically created local layers
  container.querySelectorAll('.local-bg-layer').forEach((el) => el.remove());
  layers = [];

  // Restore original elements
  const origImg = document.getElementById('heroBgImage');
  if (origImg) origImg.style.display = '';

  const vidEl = document.getElementById('heroBgVideo');
  const vidSrcEl = document.getElementById('heroBgVideoSource');
  if (vidEl) vidEl.style.display = '';
  if (vidSrcEl) vidSrcEl.src = '';

  const legacyVid = document.getElementById('heroVideo');
  if (legacyVid) legacyVid.style.display = '';
}

// ---------------------------------------------------------------------------
// 5. Start the rotator (async — preloads images first)
// ---------------------------------------------------------------------------
export async function startLocalBackgroundRotator() {
  const container = document.getElementById('heroBgContainer');
  if (!container || imageUrls.length === 0) return;

  stop();
  stopped = false;

  // Hide default elements
  const origImg = document.getElementById('heroBgImage');
  if (origImg) origImg.style.display = 'none';

  const vidEl = document.getElementById('heroBgVideo');
  const vidSrcEl = document.getElementById('heroBgVideoSource');
  if (vidEl) vidEl.style.display = 'none';
  if (vidSrcEl) vidSrcEl.src = '';

  const legacyVid = document.getElementById('heroVideo');
  if (legacyVid) legacyVid.style.display = 'none';

  // Remove any existing local layers
  container.querySelectorAll('.local-bg-layer').forEach((el) => el.remove());
  layers = [];

  const reduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Preload images before creating layers to avoid flash of missing content
  if (!preloaded) {
    await preloadImages(imageUrls);
    preloaded = true;
  }

  // Create image layers with GPU-accelerated transitions
  imageUrls.forEach((url) => {
    const img = document.createElement('img');
    img.className = 'local-bg-layer';
    img.alt = '';
    img.src = url;
    img.style.cssText =
      'position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; ' +
      'transition: opacity ' + FADE_DURATION + 'ms cubic-bezier(0.16, 1, 0.3, 1); ' +
      'will-change: opacity; transform: translateZ(0);';
    container.appendChild(img);
    layers.push(img);
  });

  if (layers.length === 0) return;

  // Show first image immediately
  currentIndex = 0;
  fadeTo(currentIndex);

  // If only 1 image or reduced motion, no cycling needed
  if (reduced || layers.length <= 1) return;

  // Start cycling
  timer = setTimeout(nextImage, HOLD_DURATION + FADE_DURATION);
}

