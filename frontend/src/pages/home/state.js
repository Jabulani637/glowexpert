// Shared mutable state for the storefront (home) page. Kept in its own
// tiny module so cart.js, render.js, and store.js can all read/write it
// without importing each other in a cycle.

export const state = {
  products: [],
  cart: []
};

export function cartTotal() {
  return state.cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}
