// Entry script for pages that have a #navbar but no other page-specific
// logic (faq.html, order.html, sitemap.html, unsubscribe.html).
//
// This replaces the old shared-ui.js, which every page loaded wholesale
// even though its tab-switching and testimonial-rotation code targeted
// .tab/.testimonial/.dot elements that don't exist anywhere on the site -
// confirmed by searching every HTML file and every page script for those
// class names before removing them. Only the navbar scroll-shadow toggle
// ever had an observable effect, so that's all that's kept here.

import { setupScrollShadow } from '../../lib/nav.js';

setupScrollShadow();
