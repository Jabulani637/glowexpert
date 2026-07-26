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

    const payload = {
      name: document.getElementById('applyName').value,
      email: document.getElementById('applyEmail').value,
      phone: document.getElementById('applyPhone').value,
      platform: document.getElementById('applyPlatform').value,
      message: document.getElementById('applyMessage').value,
    };

    try {
      const res = await fetch('/api/influencer/apply', {
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
