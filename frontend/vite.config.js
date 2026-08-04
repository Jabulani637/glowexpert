import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'html',
  base: '/',
  resolve: {
    alias: {
      '/src': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'esnext',
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'html/index.html'),
        admin: resolve(__dirname, 'html/admin.html'),
        adminLogin: resolve(__dirname, 'html/admin-login.html'),
        blog: resolve(__dirname, 'html/blog.html'),
        login: resolve(__dirname, 'html/login.html'),

        authCallback: resolve(__dirname, 'html/auth-callback.html'),
        influencer: resolve(__dirname, 'html/influencer.html'),
        influencerApply: resolve(__dirname, 'html/influencer-apply.html'),
        faq: resolve(__dirname, 'html/faq.html'),
        privacy: resolve(__dirname, 'html/privacy.html'),
        terms: resolve(__dirname, 'html/terms.html'),
        cookies: resolve(__dirname, 'html/cookies.html'),
        refund: resolve(__dirname, 'html/refund.html'),
        wholesale: resolve(__dirname, 'html/wholesale.html'),
      },
      output: {
        manualChunks: {
          clerk: ['@clerk/clerk-js']
        }
      }
    },
  },
});

