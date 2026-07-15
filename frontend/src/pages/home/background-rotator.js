import { normalizeAsset } from '../../lib/api.js';
import { $ } from '../../lib/dom.js';

let timer = null;
let currentIndex = 0;

function parseItems(json, fallbackSingleVideoUrl) {
  const base = Array.isArray(json) ? json : (() => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  })();

  const items = (base && Array.isArray(base) ? base : []).filter((it) => it && it.url);

  if (!items.length && fallbackSingleVideoUrl) {
    return [
      {
        type: 'video',
        url: fallbackSingleVideoUrl,
        enabled: true,
        order: 1,
        transition: 'fade',
        durationMs: 6500
      }
    ];
  }

  return items;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stop() {
  if (timer) clearTimeout(timer);
  timer = null;
}

function setActiveLayer({ type, src, alt }) {
  const imgEl = $('heroBgImage');
  const vidEl = $('heroBgVideo');
  const vidSrcEl = $('heroBgVideoSource');

  if (type === 'image') {
    if (vidEl && vidSrcEl) {
      vidSrcEl.src = '';
      vidEl.src = '';
    }
    if (imgEl) {
      imgEl.src = src;
      imgEl.alt = alt || 'Hero background';
    }
  } else {
    if (imgEl) {
      imgEl.src = '';
      imgEl.removeAttribute('alt');
    }
    if (vidSrcEl) {
      vidSrcEl.src = src || '';
    }
    if (vidEl) {
      vidEl.src = src || '';
    }

    try {
      vidEl?.load?.();
    } catch {
      // no-op
    }

    // Best-effort autoplay (muted in markup)
    try {
      vidEl?.play?.();
    } catch {
      // no-op
    }
  }
}

function applyTransition(transition) {
  // CSS handles the visual transition.
  const container = $('heroBgContainer');
  if (!container) return;

  container.classList.remove('bg-transition-fade', 'bg-transition-slide');
  container.classList.add(transition === 'slide' ? 'bg-transition-slide' : 'bg-transition-fade');
}

export function startHeroBackgroundRotator(settings) {
  const container = $('heroBgContainer');
  if (!container) return;

  stop();

  const reduced = prefersReducedMotion();

  const itemsRaw = settings.hero_background_items_json;
  const fallback = normalizeAsset(settings.hero_video_url || '');
  const items = parseItems(itemsRaw, fallback)
    .filter((it) => it.enabled !== false)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  if (!items.length) return;

  if (reduced || items.length === 1) {
    const first = items[0];
    applyTransition('fade');
    setActiveLayer({
      type: first.type,
      src: normalizeAsset(first.url),
      alt: first.alt
    });
    return;
  }

  currentIndex = 0;

  const tick = () => {
    const item = items[currentIndex];
    applyTransition(item.transition);

    setActiveLayer({
      type: item.type,
      src: normalizeAsset(item.url),
      alt: item.alt
    });

    const duration = Math.max(1500, Number(item.durationMs ?? 6500));
    currentIndex = (currentIndex + 1) % items.length;

    timer = setTimeout(tick, duration);
  };

  tick();
}

