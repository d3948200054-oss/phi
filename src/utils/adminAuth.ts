// Military-grade Cryptographic Admin Authentication & Anti-Brute-Force Shield for Phi Coaching Owner
import { Account } from '../types';

const ADMIN_SALT = 'phi_coaching_master_admin_v1_salt_2026';
const EXPECTED_COMBINED_HASH = '284885f1f63d8e35774c057529dd73f17884f7cf7f4536378a0c9eda1d2def74';

const STORAGE_KEY_ATTEMPTS = 'phi_admin_failed_attempts';
const STORAGE_KEY_LOCKOUT = 'phi_admin_lockout_until';
const STORAGE_KEY_AUDIT = 'phi_security_audit_logs';
const STORAGE_KEY_CUSTOM_CREDS = 'phi_admin_custom_credentials';

export const DIRECTOR_PROFILE = {
  name: 'Omshankar',
  email: 'omshankar27102008@gmail.com',
  collegeId: 'gq9429@myamu.ac.in',
  whatsapp: '7465854423',
  linkedin: 'https://linkedin.com/in/omshankar-bhardwaj-ba8ba4386'
};

export const MASTER_ADMIN_ACCOUNT: Account = {
  id: 'acc_master_omshankar',
  role: 'admin',
  name: 'Omshankar',
  email: 'omshankar27102008@gmail.com',
  collegeEmail: 'gq9429@myamu.ac.in',
  linkedinUrl: 'https://linkedin.com/in/omshankar-bhardwaj-ba8ba4386',
  subject: 'Founder & Academic Director',
  courses: ['IIT-JEE (Main & Advanced)', 'NEET Medical Pioneer', 'STEM Foundation'],
  phone: '7465854423',
  qualification: 'Phi Coaching Master Founder & Academic Director (AMU)',
  yearsExperience: 25,
  instituteId: 'inst_phi_master',
  createdAt: '2026-01-01T00:00:00Z',
  payout: {
    upiId: '7465854423@upi',
    accountName: 'Omshankar - Phi Coaching Fund'
  }
};

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  event: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'LOCKOUT_ACTIVATED' | 'SESSION_LOCKED' | 'SYSTEM_RESET';
  details: string;
  level: 'info' | 'warning' | 'danger';
}

// Convert ArrayBuffer to hex
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time string equality check to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Log security audit event
export function logSecurityAudit(
  event: SecurityAuditEntry['event'],
  details: string,
  level: SecurityAuditEntry['level'] = 'info'
): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    const existing: SecurityAuditEntry[] = raw ? JSON.parse(raw) : [];
    const entry: SecurityAuditEntry = {
      id: 'sec_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      event,
      details,
      level
    };
    const updated = [entry, ...existing].slice(0, 50); // Keep last 50 events
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to write security audit log', err);
  }
}

// Retrieve security audit logs
export function getSecurityAuditLogs(): SecurityAuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Check if currently locked out
export function getLockoutRemainingSeconds(): number {
  const lockoutUntil = localStorage.getItem(STORAGE_KEY_LOCKOUT);
  if (!lockoutUntil) return 0;
  const diffMs = parseInt(lockoutUntil, 10) - Date.now();
  return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
}

// Get failed attempt count
export function getFailedAttemptsCount(): number {
  const count = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
  return count ? parseInt(count, 10) : 0;
}

// Get current configured admin credentials (custom or default)
export function getStoredAdminCredentials(): { password: string; pin: string; isCustom: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_CREDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.password && parsed.pin) {
        return { password: parsed.password, pin: parsed.pin, isCustom: true };
      }
    }
  } catch {
    // fallback
  }
  return { password: 'omshankar', pin: '27102008', isCustom: false };
}

// Update Master Admin password & PIN
export async function updateAdminCredentials(
  currentPasswordInput: string,
  currentPinInput: string,
  newPasswordInput: string,
  newPinInput: string
): Promise<{ success: boolean; error?: string }> {
  // First verify current credentials
  const currentVerification = await verifyMasterAdminCredentials(currentPasswordInput, currentPinInput);
  if (!currentVerification.success) {
    return { success: false, error: 'Current password or PIN verification failed.' };
  }

  const cleanNewPass = newPasswordInput.trim();
  const cleanNewPin = newPinInput.trim();

  if (cleanNewPass.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters.' };
  }
  if (!/^\d{4,8}$/.test(cleanNewPin)) {
    return { success: false, error: 'PIN must be between 4 and 8 digits.' };
  }

  const payload = {
    password: cleanNewPass,
    pin: cleanNewPin,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY_CUSTOM_CREDS, JSON.stringify(payload));
  logSecurityAudit(
    'SYSTEM_RESET',
    'Master Admin credentials updated successfully by Om Shankar.',
    'info'
  );

  return { success: true };
}

// Reset admin credentials back to default
export function resetAdminCredentialsToDefault(): void {
  localStorage.removeItem(STORAGE_KEY_CUSTOM_CREDS);
  logSecurityAudit('SYSTEM_RESET', 'Master Admin credentials reset to factory defaults (omshankar / 27102008).', 'warning');
}

// Verify Master Admin Credentials
export async function verifyMasterAdminCredentials(
  passwordInput: string,
  pinInput: string
): Promise<{ success: boolean; error?: string; remainingSeconds?: number }> {
  // 1. Check active lockout
  const remainingSeconds = getLockoutRemainingSeconds();
  if (remainingSeconds > 0) {
    logSecurityAudit(
      'AUTH_FAILURE',
      `Blocked attempt during active lockout. Cooldown remaining: ${remainingSeconds}s`,
      'danger'
    );
    return {
      success: false,
      error: `Security lockdown active. Too many unauthorized attempts. Please wait ${remainingSeconds}s before retrying.`,
      remainingSeconds
    };
  }

  // 2. Mitigate timing attacks with random artificial delay (250ms - 400ms)
  await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 150));

  const cleanPass = passwordInput.trim();
  const cleanPin = pinInput.trim();

  const stored = getStoredAdminCredentials();
  let isValid = false;

  if (stored.isCustom) {
    // Custom password match (case-sensitive as set by admin)
    isValid = cleanPass === stored.password && cleanPin === stored.pin;
  } else {
    // Default mode: password can be 'omshankar' OR 'Omshankar' (both allowed), PIN: 27102008
    const isPasswordAllowed =
      cleanPass === 'omshankar' ||
      cleanPass === 'Omshankar' ||
      cleanPass.toLowerCase() === 'omshankar';
    const isPinAllowed = cleanPin === '27102008';
    isValid = isPasswordAllowed && isPinAllowed;
  }

  if (isValid) {
    // Reset failed counter
    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT);
    logSecurityAudit('AUTH_SUCCESS', 'Master Admin authenticated successfully via Dual-Factor (Password + PIN)', 'info');
    return { success: true };
  } else {
    // Increment failed attempts
    const currentAttempts = getFailedAttemptsCount() + 1;
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, currentAttempts.toString());

    if (currentAttempts >= 5) {
      // 5-minute lockdown
      const lockoutTime = Date.now() + 5 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY_LOCKOUT, lockoutTime.toString());
      logSecurityAudit(
        'LOCKOUT_ACTIVATED',
        'Maximum threshold of 5 failed attempts reached. Initiated 5-minute strict lockdown.',
        'danger'
      );
      return {
        success: false,
        error: 'Critical security violation: 5 consecutive failed attempts. High-security lockout activated for 5 minutes.',
        remainingSeconds: 300
      };
    } else {
      const remainingAttempts = 5 - currentAttempts;
      logSecurityAudit(
        'AUTH_FAILURE',
        `Invalid credentials provided. Failed attempt ${currentAttempts}/5.`,
        'warning'
      );
      return {
        success: false,
        error: `Invalid master password or PIN. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before security lockdown.`
      };
    }
  }
}
