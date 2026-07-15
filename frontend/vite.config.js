import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        blog: resolve(__dirname, 'blog.html'),
        login: resolve(__dirname, 'login.html'),
        authCallback: resolve(__dirname, 'auth-callback.html'),
        influencer: resolve(__dirname, 'influencer.html'),
        faq: resolve(__dirname, 'faq.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        cookies: resolve(__dirname, 'cookies.html'),
        sitemap: resolve(__dirname, 'sitemap.html'),
        unsubscribe: resolve(__dirname, 'unsubscribe.html'),
        order: resolve(__dirname, 'order.html'),
      },
    },
  },
});
