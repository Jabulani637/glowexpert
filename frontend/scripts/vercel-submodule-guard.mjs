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

