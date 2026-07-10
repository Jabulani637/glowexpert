const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, '..', 'data', 'fallback-store.json');
const DEFAULT_STORE = {
  users: [],
  products: [],
  blogPosts: [],
  influencers: []
};

let cachedStore = null;

function ensureStoreFile() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2));
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadFallbackStore() {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
      blogPosts: Array.isArray(parsed.blogPosts) ? parsed.blogPosts : [],
      influencers: Array.isArray(parsed.influencers) ? parsed.influencers : []
    };
  } catch (error) {
    return clone(DEFAULT_STORE);
  }
}

function saveFallbackStore(store) {
  ensureStoreFile();
  cachedStore = clone(store);
  fs.writeFileSync(STORE_FILE, JSON.stringify(cachedStore, null, 2));
  return cachedStore;
}

function getFallbackStore() {
  if (!cachedStore) {
    cachedStore = loadFallbackStore();
  }
  return cachedStore;
}

module.exports = {
  DEFAULT_STORE,
  clone,
  loadFallbackStore,
  saveFallbackStore,
  getFallbackStore
};
