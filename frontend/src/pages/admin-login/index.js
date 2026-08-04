import { API_BASE } from '../../config.js';
import { getClerk } from '../../lib/clerk.js';

const ADMIN_TOKEN_KEY = 'glowexpert_admin_token';

const stepEmail = document.getElementById('stepEmail');
const stepOtp = document.getElementById('stepOtp');
const emailForm = document.getElementById('emailForm');
const otpForm = document.getElementById('otpForm');
const adminEmailInput = document.getElementById('adminEmail');
const otpCodeInput = document.getElementById('otpCode');
const otpEmailDisplay = document.getElementById('otpEmailDisplay');
const emailError = document.getElementById('emailError');
const otpError = document.getElementById('otpError');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const backToEmailBtn = document.getElementById('backToEmailBtn');
const googleSignInBtn = document.getElementById('googleSignInBtn');

let currentEmail = '';

function showStep(step) {
  stepEmail.hidden = step !== 'email';
  stepOtp.hidden = step !== 'otp';
}

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

function hideError(el) {
  el.hidden = true;
}

function setLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span>${originalText === 'Send Verification Code' ? 'Sending...' : 'Verifying...'}`;
  } else {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function requestOtp(email) {
  const res = await fetch(`${API_BASE}/api/admin/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to send code');
  }
  return data;
}

async function verifyOtp(email, otp) {
  const res = await fetch(`${API_BASE}/api/admin/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Invalid code');
  }
  return data;
}

// Step 1: Send OTP
emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(emailError);

  const email = adminEmailInput.value.trim();
  if (!email) return;

  currentEmail = email;
  setLoading(sendOtpBtn, true, 'Send Verification Code');

  try {
    await requestOtp(email);
    otpEmailDisplay.textContent = email;
    showStep('otp');
    otpCodeInput.value = '';
    otpCodeInput.focus();
  } catch (err) {
    showError(emailError, err.message);
  } finally {
    setLoading(sendOtpBtn, false, 'Send Verification Code');
  }
});

// Step 2: Verify OTP
otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(otpError);

  const otp = otpCodeInput.value.trim();
  if (!otp) return;

  setLoading(verifyOtpBtn, true, 'Verify & Sign In');

  try {
    const data = await verifyOtp(currentEmail, otp);
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    window.location.href = 'admin.html';
  } catch (err) {
    showError(otpError, err.message);
  } finally {
    setLoading(verifyOtpBtn, false, 'Verify & Sign In');
  }
});

// Resend OTP
resendOtpBtn.addEventListener('click', async () => {
  hideError(otpError);
  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = 'Sending...';

  try {
    await requestOtp(currentEmail);
    resendOtpBtn.textContent = 'Code sent! Check your email.';
    setTimeout(() => {
      resendOtpBtn.disabled = false;
      resendOtpBtn.textContent = "Didn't receive it? Resend code";
    }, 3000);
  } catch (err) {
    showError(otpError, err.message);
    resendOtpBtn.disabled = false;
    resendOtpBtn.textContent = "Didn't receive it? Resend code";
  }
});

// Back to email step
backToEmailBtn.addEventListener('click', () => {
  hideError(otpError);
  showStep('email');
  adminEmailInput.focus();
});

// Google OAuth via Clerk
googleSignInBtn.addEventListener('click', async () => {
  try {
    const clerk = await getClerk();
    clerk.openSignIn({
      afterSignInUrl: 'admin.html',
      redirectUrl: 'admin.html'
    });
  } catch (err) {
    showError(emailError, 'Google sign-in failed. Please try again.');
  }
});

// Auto-redirect if already has valid token
const existingToken = localStorage.getItem(ADMIN_TOKEN_KEY);
if (existingToken) {
  try {
    const payload = JSON.parse(atob(existingToken.split('.')[1]));
    if (payload.role === 'admin' && payload.exp * 1000 > Date.now()) {
      window.location.href = 'admin.html';
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}
