// Shared currency formatter, previously duplicated identically in
// home.js and admin.js.
export function money(value, currency = 'ZAR') {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}
