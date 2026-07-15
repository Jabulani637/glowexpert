import { getClerk } from '../../lib/clerk.js';

async function init() {
  const clerk = await getClerk();
  
  if (clerk.user) {
    window.location.href = clerk.user.publicMetadata?.role === 'influencer'
      ? 'influencer.html'
      : 'admin.html';
  } else {
    // If somehow not logged in, go back to login
    window.location.href = 'login.html';
  }
}

init();
