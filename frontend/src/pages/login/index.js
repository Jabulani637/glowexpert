import { getClerk } from '../../lib/clerk.js';

const clerk = await getClerk();

if (clerk.user) {
  window.location.href = clerk.user.publicMetadata?.role === 'influencer'
    ? 'influencer.html'
    : 'admin.html';
} else {
  clerk.mountSignIn(document.getElementById('sign-in'), {
    afterSignInUrl: 'auth-callback.html'
  });
}

