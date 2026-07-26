import { getClerk } from '../../lib/clerk.js';

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
  clerk.mountSignIn(document.getElementById('sign-in'), {
    fallbackRedirectUrl: '/auth-callback.html',
    forceRedirectUrl: '/auth-callback.html'
  });
}

