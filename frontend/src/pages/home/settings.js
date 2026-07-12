import { normalizeAsset } from '../../lib/api.js';
import { $, escapeHtml } from '../../lib/dom.js';
import { resolveVideoSrc } from './video-overrides.js';

// Note: hero background is handled by background-rotator.js (DB-backed).



/** Removes a duplicated trailing "Expert" (e.g. a settings value of
 * "GlowExpert Expert" or "Glow Expert Expert") down to a single one. */
function normalizeBrandName(rawBrand) {
  const base = String(rawBrand || 'GlowExpert')
    .trim()
    .replace(/\s+/g, '')
    .replace(/expert$/i, '')
    .replace(/expert$/i, '')
    .trim();
  return base || 'Glow';
}

function setSourceAndForceLoad(videoEl, sourceEl, src) {
  if (!videoEl || !sourceEl) return;

  // If src is missing/empty, blank the source and reload so the browser
  // doesn't keep using a previous cached one.
  const finalSrc = src || '';
  if (sourceEl.src !== finalSrc) {
    // Some browsers don't fully respect source.src changes unless the
    // element is "blanked" first.
    sourceEl.src = '';
    videoEl.src = '';
  }

  sourceEl.src = finalSrc;

  // Force reload.
  try {
    videoEl.load();
  } catch {
    // no-op
  }
}

function applyVideoSettings(settings) {
  const heroVideoEl = $('heroVideo');
  const heroVideoSourceEl = $('heroVideoSource');

  const featuredOneVideoEl = $('featuredVideoOne');
  const featuredOneSourceEl = $('featuredVideoOneSource');

  const featuredTwoVideoEl = $('featuredVideoTwo');
  const featuredTwoSourceEl = $('featuredVideoTwoSource');

  Promise.all([
    resolveVideoSrc('hero', normalizeAsset(settings.hero_video_url || '')),
    resolveVideoSrc('featured_one', normalizeAsset(settings.featured_video_one_url || '')),
    resolveVideoSrc('featured_two', normalizeAsset(settings.featured_video_two_url || ''))
  ])
    .then(([heroSrc, featOneSrc, featTwoSrc]) => {
      // Debug guard: helps confirm backend is returning values.
      // (Visible in console; remove later if desired.)
      if (!heroSrc && !featOneSrc && !featTwoSrc) {
        console.warn('[home/settings] Video URLs are empty after resolve:', {
          hero: settings.hero_video_url,
          featuredOne: settings.featured_video_one_url,
          featuredTwo: settings.featured_video_two_url
        });
      }

      setSourceAndForceLoad(heroVideoEl, heroVideoSourceEl, heroSrc);
      setSourceAndForceLoad(featuredOneVideoEl, featuredOneSourceEl, featOneSrc);
      setSourceAndForceLoad(featuredTwoVideoEl, featuredTwoSourceEl, featTwoSrc);

      // Retry once shortly after: some browsers ignore immediate load()
      // if called back-to-back during initial render.
      setTimeout(() => {
        setSourceAndForceLoad(heroVideoEl, heroVideoSourceEl, heroSrc);
        setSourceAndForceLoad(featuredOneVideoEl, featuredOneSourceEl, featOneSrc);
        setSourceAndForceLoad(featuredTwoVideoEl, featuredTwoSourceEl, featTwoSrc);
      }, 500);
    })
    .catch((err) => {
      console.warn('[home/settings] Failed to resolve video src:', err?.message || err);

      // Fallback: still try raw URLs from settings if IndexedDB fails.
      setSourceAndForceLoad(
        heroVideoEl,
        heroVideoSourceEl,
        normalizeAsset(settings.hero_video_url || '')
      );
      setSourceAndForceLoad(
        featuredOneVideoEl,
        featuredOneSourceEl,
        normalizeAsset(settings.featured_video_one_url || '')
      );
      setSourceAndForceLoad(
        featuredTwoVideoEl,
        featuredTwoSourceEl,
        normalizeAsset(settings.featured_video_two_url || '')
      );
    });
}


export function applySettings(settings) {
  const brandBase = normalizeBrandName(settings.brand_name);
  const finalBrand = `${brandBase}Expert`;

  document.title = finalBrand;

  const brandEl = $('brandName');
  if (brandEl) brandEl.innerHTML = `${escapeHtml(brandBase)}<span>Expert</span>`;

  if ($('heroTitle')) $('heroTitle').textContent = settings.hero_title || 'GlowExpert';
  if ($('heroSubtitle')) $('heroSubtitle').textContent = settings.hero_subtitle || '';
  if ($('heroCta')) $('heroCta').textContent = settings.hero_cta_label || 'Explore Collection';

  if ($('newsletterHeading')) $('newsletterHeading').textContent = settings.newsletter_heading || 'Join The Glow List';
  if ($('newsletterCopy')) $('newsletterCopy').textContent = settings.newsletter_copy || '';
  if ($('supportEmail')) $('supportEmail').textContent = settings.support_email || 'support@glowexpert.com';
  if ($('supportPhone')) $('supportPhone').textContent = settings.support_phone || '+27 00 000 0000';

  if ($('featuredVideoOneTitle')) $('featuredVideoOneTitle').textContent = settings.featured_video_one_title || '';
  if ($('featuredVideoOneDescription')) $('featuredVideoOneDescription').textContent = settings.featured_video_one_description || '';
  if ($('featuredVideoTwoTitle')) $('featuredVideoTwoTitle').textContent = settings.featured_video_two_title || '';
  if ($('featuredVideoTwoDescription')) $('featuredVideoTwoDescription').textContent = settings.featured_video_two_description || '';

  applyVideoSettings(settings);
}
