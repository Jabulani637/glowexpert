// Admin login throttle helper (non-Clerk password login endpoint)
// Policy: after N failed attempts, lock admin logins for a duration.

const DEFAULT_POLICY = {
  maxFailedAttempts: 3,
  lockoutDurationMs: 2 * 60 * 60 * 1000
};

function getIsoNow() {
  return new Date().toISOString();
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getLockoutState(user) {
  const lockedUntilRaw = user?.locked_until ?? null;
  const failedAttempts = toNumber(user?.failed_attempts, 0);

  const lockedUntilDate = lockedUntilRaw ? new Date(lockedUntilRaw) : null;
  const isLocked = Boolean(
    lockedUntilDate &&
      !Number.isNaN(lockedUntilDate.getTime()) &&
      lockedUntilDate.getTime() > Date.now()
  );

  return {
    lockedUntil: lockedUntilRaw || null,
    failedAttempts,
    isLocked
  };
}

function formatDurationMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}${minutes > 0 ? ` ${minutes} minute${minutes === 1 ? '' : 's'}` : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'}${seconds > 0 ? ` ${seconds} second${seconds === 1 ? '' : 's'}` : ''}`;
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

function formatLockoutMessage(retryAfterMs) {
  const duration = formatDurationMs(retryAfterMs);
  return `Too many failed login attempts. Try again in ${duration}.`;
}

function evaluateAdminLoginThrottle(user, policy = DEFAULT_POLICY) {
  const resolvedPolicy = {
    maxFailedAttempts: toNumber(policy?.maxFailedAttempts, DEFAULT_POLICY.maxFailedAttempts),
    lockoutDurationMs: toNumber(policy?.lockoutDurationMs, DEFAULT_POLICY.lockoutDurationMs)
  };

  const state = getLockoutState(user);
  if (state.isLocked) {
    const lockedUntilMs = state.lockedUntil ? new Date(state.lockedUntil).getTime() : Date.now();
    const retryAfterMs = Math.max(0, lockedUntilMs - Date.now());

    return {
      allowed: false,
      message: formatLockoutMessage(retryAfterMs),
      lockedUntil: state.lockedUntil,
      retryAfterMs
    };
  }

  return { allowed: true, message: 'Allowed' };
}

function computeAdminLockout({ nowMs = Date.now(), durationMs = DEFAULT_POLICY.lockoutDurationMs } = {}) {
  return new Date(nowMs + durationMs).toISOString();
}

module.exports = {
  DEFAULT_POLICY,
  getIsoNow,
  getLockoutState,
  evaluateAdminLoginThrottle,
  formatLockoutMessage,
  computeAdminLockout
};

