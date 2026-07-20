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
        main: resolve(__dirname, 'html/index.html'),
        admin: resolve(__dirname, 'html/admin.html'),
        blog: resolve(__dirname, 'html/blog.html'),
        login: resolve(__dirname, 'html/login.html'),
        authCallback: resolve(__dirname, 'html/auth-callback.html'),
        influencer: resolve(__dirname, 'html/influencer.html'),
        faq: resolve(__dirname, 'html/faq.html'),
        privacy: resolve(__dirname, 'html/privacy.html'),
        terms: resolve(__dirname, 'html/terms.html'),
        cookies: resolve(__dirname, 'html/cookies.html'),
        sitemap: resolve(__dirname, 'html/sitemap.html'),
        unsubscribe: resolve(__dirname, 'html/unsubscribe.html'),
        order: resolve(__dirname, 'html/order.html'),
      },
    },
  },
});
