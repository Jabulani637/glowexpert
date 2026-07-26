import { getClerk } from '../../lib/clerk.js';

async function init() {
  const clerk = await getClerk();

  if (clerk.user) {
    const role = clerk.user.publicMetadata?.role;
    if (role === 'admin') {
      window.location.href = 'admin.html';
    } else if (role === 'influencer') {
      window.location.href = 'influencer.html';
    } else {
      window.location.href = 'index.html';
    }
  } else {
    // If somehow not logged in, go back to login
    window.location.href = 'login.html';
  }
}

init();
