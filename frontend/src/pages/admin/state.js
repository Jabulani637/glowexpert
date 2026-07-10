// Shared mutable state for the admin dashboard, referenced by both the
// products and blog modules and the index.js wiring layer.

export const state = {
  selectedId: null,
  products: [],
  selectedBlogId: null,
  blogPosts: []
};
