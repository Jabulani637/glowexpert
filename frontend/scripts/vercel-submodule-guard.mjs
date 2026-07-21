import { execSync } from 'node:child_process';
import fs from 'node:fs';

function exists(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch {
    return false;
  }
}

// In some CI environments, `git submodule update` can fail (or submodules may not exist at all).
// This guard ensures we never fail the build because of missing/unfetchable submodules.
//
// Vercel sets `VERCEL=1` during builds; GitHub Actions typically sets `CI=true`.
// In these environments we skip submodule operations entirely to avoid submodule fetch warnings.
if (process.env.VERCEL || process.env.CI === 'true') {
  process.exit(0);
}


try {
  if (!exists(new URL('../..', import.meta.url).pathname + '/.gitmodules')) {
    process.exit(0);
  }

  // Only attempt update if .git exists (e.g., local clone). In build environments it may not.
  if (!exists(new URL('../..', import.meta.url).pathname + '/.git')) {
    process.exit(0);
  }

  execSync('git submodule update --init --recursive', {
    stdio: 'inherit',
    env: process.env
  });
} catch {
  // swallow errors intentionally
}


