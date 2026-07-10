import { setupMobileNav, setupScrollShadow } from '../../lib/nav.js';
import { renderBlogListing, setupBlogCardNavigation } from './list.js';
import { renderPostDetail } from './detail.js';

setupMobileNav();
setupScrollShadow();
setupBlogCardNavigation();

const urlParams = new URLSearchParams(window.location.search);
const postSlug = urlParams.get('post');

if (postSlug) {
  renderPostDetail(postSlug);
} else {
  renderBlogListing();
}
