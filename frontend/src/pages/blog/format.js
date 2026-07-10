export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatContent(content) {
  if (!content) return '';
  return content
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Returns a { label, cssClass } pair for a post's content_type, used by
 * both the listing cards and the post detail header. */
export function typeBadge(contentType) {
  if (contentType === 'video') return { label: 'Video', cssClass: 'video' };
  if (contentType === 'tutorial') return { label: 'Tutorial', cssClass: 'tutorial' };
  return { label: 'Article', cssClass: '' };
}
