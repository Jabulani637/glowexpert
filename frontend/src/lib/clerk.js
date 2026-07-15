import { Clerk } from '@clerk/clerk-js';

let clerkInstance = null;

function computeClerkDomainFromPublishableKey(publishableKey) {
  // Clerk publishable keys look like: pk_test_... and the docs derive domain via
  // the 3rd segment.
  // Example: pk_live_abcdefghijklmnop-qwerty => split('_')[2] => ...
  const parts = String(publishableKey).split('_');
  if (parts.length < 3) {
    throw new Error('Invalid VITE_CLERK_PUBLISHABLE_KEY format');
  }

  // The legacy snippet uses atob() and then slices off a trailing char.
  // Keep behavior consistent with the requested snippet.
  return atob(parts[2]).slice(0, -1);
}

async function loadClerkUiScript(clerkDomain) {
  const script = document.createElement('script');
  script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
  script.async = true;
  script.crossOrigin = 'anonymous';

  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load @clerk/ui bundle'));
    document.head.appendChild(script);
  });
}

export async function getClerk() {
  if (clerkInstance) return clerkInstance;

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('Add your VITE_CLERK_PUBLISHABLE_KEY to the .env file');
  }

  const clerkDomain = computeClerkDomainFromPublishableKey(publishableKey);

  // Each page load is isolated; inject the UI bundle once per page.
  await loadClerkUiScript(clerkDomain);

  const clerk = new Clerk(publishableKey);
  await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });

  clerkInstance = clerk;
  return clerkInstance;
}

