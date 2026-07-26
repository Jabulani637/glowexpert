# Responsive Design Overhaul Plan

## Information Gathered

After reading all 11 HTML pages and the main CSS/JS files, here's the current state:

### CSS (`luxury.css`) Issues:
1. **Desktop-first architecture** - Uses `max-width` media queries (720px, 860px, 560px, 900px) instead of mobile-first `min-width`
2. **Inconsistent breakpoints** - Uses 560px, 720px, 860px, 900px instead of required 640px, 1024px, 1280px, 1536px
3. **Limited fluid typography** - Only hero titles use `clamp()`, most other text uses fixed sizes
4. **No container queries** for reusable components (cards, widgets, sidebars)
5. **No responsive images** - No `srcset` or `<picture>` elements
6. **No safe area handling** - No `env(safe-area-inset-*)` usage
7. **Touch targets** - Navigation hamburger spans are thin (1px), some interactive elements may be < 44×44px
8. **No `prefers-color-scheme` dark mode support**
9. **No `overflow-x: hidden` on body** to prevent horizontal scrolling

### HTML Pages Issues:
1. **Scattered inline responsive styles** - Each page has its own `<style>` block with `@media (max-width: 640px)` overrides
2. **Footer `min-width` inline styles** - `min-width: 180px` on footer columns could cause overflow on very small screens
3. **No responsive images** - All `<img>` tags lack `srcset` and `<picture>` elements
4. **Hero section** - Fixed `height: 100vh` with `min-height: 560px` but no mobile optimization for small screens
5. **Wholesale hero** - `height: 400px` fixed height, not responsive

### JavaScript Issues:
1. **No resize debouncing** - `setupScrollShadow` attaches raw scroll listener without debouncing
2. **No `window.matchMedia` usage** for screen detection
3. **No `ResizeObserver` usage**

## Files to Edit

### Primary:
1. `frontend/src/styles/luxury.css` - Complete rewrite to mobile-first architecture

### Secondary (consolidate inline styles):
2. `frontend/html/privacy.html` - Remove inline `<style>` block, consolidate into luxury.css
3. `frontend/html/terms.html` - Remove inline `<style>` block
4. `frontend/html/refund.html` - Remove inline `<style>` block
5. `frontend/html/cookies.html` - Remove inline `<style>` block
6. `frontend/html/faq.html` - Remove inline `<style>` block
7. `frontend/html/influencer-apply.html` - Remove inline `<style>` block

### JavaScript:
8. `frontend/src/lib/nav.js` - Add debounced resize handling, matchMedia for mobile menu
9. `frontend/src/pages/home/index.js` - Add responsive image loading logic

## Plan

### Step 1: Refactor luxury.css to Mobile-First
- Convert all `max-width` media queries to `min-width`
- Use breakpoints: 640px (tablet), 1024px (laptop), 1280px (desktop), 1536px (large desktop)
- Add fluid typography with `clamp()` throughout
- Add `overflow-x: hidden` to body
- Add `env(safe-area-inset-*)` padding where needed
- Add container queries for `.product-card`, `.video-card`, `.trending-card`
- Add `@media (prefers-color-scheme: dark)` support
- Ensure all touch targets are minimum 44×44px on mobile

### Step 2: Add Container Queries
- `.product-card` - Adapt layout based on container width
- `.video-card` - Adjust overlay size
- `.trending-card` - Adjust font sizes
- `.trust-badge` - Reorient icon/text

### Step 3: Consolidate Inline Page Styles
- Add `.page-main`, `.faq-main`, `.refund-main`, `.ia-main` responsive rules to luxury.css
- Remove inline `<style>` blocks from individual HTML pages

### Step 4: JavaScript Enhancements
- Add debounced scroll handler in `nav.js`
- Add `matchMedia` listener for mobile menu in `nav.js`
- Add `ResizeObserver` for container-aware components

### Step 5: Responsive Images
- Add `img` max-width/handle in CSS (already done partially)
- Add aspect-ratio containers for videos

## Follow-up Steps
1. Test at all breakpoints: 320px, 375px, 390px, 414px, 768px, 1024px, 1280px, 1440px, 1920px, 2560px
2. Test landscape orientation on mobile
3. Test zoomed text up to 200%
4. Verify no horizontal scrolling at any width

