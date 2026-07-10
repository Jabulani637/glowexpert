import { escapeHtml } from '../../lib/dom.js';

export function renderVideoEmbed(url, posterUrl) {
  if (!url) return '';

  const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);

  if (youtubeMatch) {
    return `
      <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:16px; margin:24px 0;">
        <iframe
          src="https://www.youtube.com/embed/${youtubeMatch[1]}"
          style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  if (vimeoMatch) {
    return `
      <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:16px; margin:24px 0;">
        <iframe
          src="https://player.vimeo.com/video/${vimeoMatch[1]}"
          style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  return `
    <video
      controls
      class="blog-post-video"
      ${posterUrl ? `poster="${escapeHtml(posterUrl)}"` : ''}
      style="width:100%; border-radius:16px; margin:24px 0; background:#111;"
    >
      <source src="${escapeHtml(url)}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  `;
}
