import { normalizeAsset } from '../../lib/api.js';
import { $, escapeHtml } from '../../lib/dom.js';
import { resolveVideoSrc } from './video-overrides.js';

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

function applyVideoSettings(settings) {
  Promise.all([
    resolveVideoSrc('hero', normalizeAsset(settings.hero_video_url || '')),
    resolveVideoSrc('featured_one', normalizeAsset(settings.featured_video_one_url || '')),
    resolveVideoSrc('featured_two', normalizeAsset(settings.featured_video_two_url || ''))
  ]).then(([heroSrc, featOneSrc, featTwoSrc]) => {
    // Ensure <source> tags are updated reliably.
    const heroSource = $('heroVideoSource');
    const featuredOneSource = $('featuredVideoOneSource');
    const featuredTwoSource = $('featuredVideoTwoSource');

    if (heroSource && heroSrc) heroSource.src = heroSrc;
    if (featuredOneSource && featOneSrc) featuredOneSource.src = featOneSrc;
    if (featuredTwoSource && featTwoSrc) featuredTwoSource.src = featTwoSrc;

    // If src changed, force the browser to reload the <video>.
    $('heroVideo')?.load();
    $('featuredVideoOne')?.load();
    $('featuredVideoTwo')?.load();
  }).catch((err) => {
    // Avoid breaking the page if IndexedDB is unavailable.
    console.warn('[home/settings] Failed to resolve video src:', err?.message || err);
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
