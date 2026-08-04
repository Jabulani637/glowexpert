import { API_BASE } from '../../config.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('influencerApplyForm');
  const responseDiv = document.getElementById('applyResponse');
  const submitBtn = document.getElementById('applySubmitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Applying...';
    responseDiv.textContent = '';
    responseDiv.style.color = '';

    const social_links = {};
    const instagram = document.getElementById('applyInstagram')?.value.trim();
    const tiktok = document.getElementById('applyTiktok')?.value.trim();
    const youtube = document.getElementById('applyYoutube')?.value.trim();
    const facebook = document.getElementById('applyFacebook')?.value.trim();
    const twitter = document.getElementById('applyTwitter')?.value.trim();
    if (instagram) social_links.instagram = instagram;
    if (tiktok) social_links.tiktok = tiktok;
    if (youtube) social_links.youtube = youtube;
    if (facebook) social_links.facebook = facebook;
    if (twitter) social_links.twitter = twitter;

    const payload = {
      name: document.getElementById('applyName').value,
      email: document.getElementById('applyEmail').value,
      phone: document.getElementById('applyPhone').value,
      platform: document.getElementById('applyPlatform').value,
      message: document.getElementById('applyMessage').value,
      social_links
    };

    try {
      const res = await fetch(`${API_BASE}/api/influencer/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        responseDiv.textContent = "Thanks — we'll be in touch within 3 business days.";
        responseDiv.style.color = 'var(--success-whatsapp, #25d366)';
        form.reset();
      } else {
        throw new Error(data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      responseDiv.textContent = "Failed to submit application. Please try again later.";
      responseDiv.style.color = 'var(--promo, #e0116f)';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Apply Now';
    }
  });
});
