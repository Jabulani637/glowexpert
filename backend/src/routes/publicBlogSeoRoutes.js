const express = require('express');
const { getBlogPost } = require('../controllers/blogController');

const router = express.Router();

// Lightweight server-rendered HTML wrapper for SEO.
// This keeps your current blog JSON API + client renderer,
// but provides real HTML for indexers.

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

router.get('/', async (req, res) => {
  // Blog landing page SEO shell (client will enhance).
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GlowExpert Blog - Hair Care, Styling & HD Lace Guides</title>
  <meta name="description" content="Read GlowExpert hair care, styling, and HD lace wig guides: how-to routines, authenticity tips, and styling for 13x4 lace." />
  <link rel="canonical" href="https://glowexpert.vercel.app/blog.html" />
</head>
<body>
  <main style="padding: 120px 20px; max-width: 900px; margin: 0 auto;">
    <h1>GlowExpert Blog</h1>
    <p>Hair care, styling, and HD lace wig guides—updated regularly.</p>
    <p>This page is enhanced by the client app.</p>
  </main>
  <div id="app"></div>
  <script type="module" src="/src/pages/blog/index.js"></script>
</body>
</html>`);
});

router.get('/:slug', async (req, res) => {
  try {
    // Reuse the controller to fetch the post by slug
    // Note: `getBlogPost` returns JSON via `res.json`, so we call it by mimicking req/res.
    const fakeReq = { params: { slug: req.params.slug } };

    const data = await new Promise((resolve, reject) => {
      const fakeRes = {
        status: (code) => ({
          json: (payload) => reject(Object.assign(new Error(payload?.message || 'Blog post not found'), { status: code }))
        }),
        json: (payload) => resolve(payload?.data)
      };

      getBlogPost(fakeReq, fakeRes);
    });

    if (!data) return res.status(404).send('Not found');

    const title = escapeHtml(data.title);
    const desc = escapeHtml(data.meta_description || data.excerpt || (data.content ? data.content.slice(0, 160) : ''));

    res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - GlowExpert</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="https://glowexpert.vercel.app/blog.html?post=${encodeURIComponent(data.slug || req.params.slug)}" />
</head>
<body>
  <main style="padding: 120px 20px; max-width: 900px; margin: 0 auto;">
    <a href="/blog.html" style="color:#b38b2c; text-decoration:none;">← Back to Blog</a>
    <h1>${title}</h1>
    <p style="color: rgba(10,9,8,0.7);">${escapeHtml(data.published_at || data.created_at || '')}</p>
    ${data.featured_image ? `<img src="${escapeHtml(data.featured_image)}" alt="${title}" style="max-width:100%; height:auto;" />` : ''}
    <div style="margin-top: 18px; line-height: 1.8;">
      ${data.excerpt ? `<p>${escapeHtml(data.excerpt)}</p>` : ''}
    </div>
    <noscript>
      <p>This blog page requires JavaScript to display full content.</p>
    </noscript>
    <div id="app"></div>
  </main>
  <script type="module" src="/src/pages/blog/detail.js"></script>
  <script>
    // Ensure the client detail renderer receives the correct slug.
    const params = new URLSearchParams(window.location.search);
    if (!params.get('post')) {
      params.set('post', ${JSON.stringify(data.slug || req.params.slug)});
      const qs = params.toString();
      history.replaceState(null, '', '/blog?'+qs);
    }
  </script>
</body>
</html>`);
  } catch (e) {
    const status = e?.status || 500;
    res.status(status).send(status === 404 ? 'Not found' : 'Internal server error');
  }
});

module.exports = router;

