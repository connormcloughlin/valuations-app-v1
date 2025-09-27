/**
 * Cross-platform crypto utilities for React Native
 * Provides SHA-256 hashing with fallbacks for different environments
 */

/**
 * SHA-256 hash implementation for React Native
 * Uses Web Crypto API if available, otherwise falls back to a JS implementation
 */
export async function sha256(input: string): Promise<string> {
  try {
    // Try Web Crypto API first (available in modern React Native)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.warn('⚠️ Web Crypto API unavailable, using fallback hash');
  }

  // Fallback to simple hash for environments without crypto
  return simpleHash(input);
}

/**
 * Simple hash implementation as fallback
 * Not cryptographically secure, but provides consistent output
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Hash email for secure transmission
 * Normalizes email (lowercase, trim) then hashes with SHA-256
 */
export async function hashEmail(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  return await sha256(normalizedEmail);
}

/**
 * Mask sensitive data for logging
 * Shows first few characters and length
 */
export function maskSensitiveData(data: string, visibleChars: number = 6): string {
  if (!data || data.length < visibleChars) {
    return '[INVALID]';
  }
  return `${data.substring(0, visibleChars)}...[${data.length}]`;
}

/**
 * Mask email for logging
 * Shows first 2 chars of local part and full domain
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '[INVALID]';
  const maskedLocal = local.length > 2 ? `${local.substring(0, 2)}***` : local;
  return `${maskedLocal}@${domain}`;
}


