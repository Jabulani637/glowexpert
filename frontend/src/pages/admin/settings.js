import { $ } from '../../lib/dom.js';
import { api } from './status.js';

const SETTINGS_FIELDS = [
  'brand_name',
  'hero_cta_label',
  'hero_title',
  'hero_subtitle',
  'hero_video_url',
  'support_email',
  'newsletter_heading',
  'support_phone',
  'newsletter_copy'
];

export function populateSettings(settings) {
  SETTINGS_FIELDS.forEach((key) => {
    if ($(key)) $(key).value = settings[key] || '';
  });
}

export async function saveSettings() {
  const payload = Object.fromEntries(SETTINGS_FIELDS.map((key) => [key, $(key).value.trim()]));

  await api('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
