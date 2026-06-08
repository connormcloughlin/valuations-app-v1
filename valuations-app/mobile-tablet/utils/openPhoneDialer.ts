import { Alert, Linking } from 'react-native';

const NON_DIALABLE = new Set(['n/a', 'na', 'none', '-', '']);

/** Strip formatting characters; preserve leading + for international numbers. */
export function normalizePhoneForDial(raw: string): string | null {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed || NON_DIALABLE.has(trimmed.toLowerCase())) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (!digits) return null;

  const normalized = hasPlus ? `+${digits.replace(/\+/g, '')}` : digits.replace(/\+/g, '');
  if (normalized.replace(/\D/g, '').length < 7) return null;

  return normalized;
}

export function isDialablePhone(raw: string | null | undefined): boolean {
  return normalizePhoneForDial(String(raw ?? '')) !== null;
}

export async function openPhoneDialer(raw: string | null | undefined): Promise<void> {
  const normalized = normalizePhoneForDial(String(raw ?? ''));
  if (!normalized) return;

  const url = `tel:${normalized}`;
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.warn('[openPhoneDialer] openURL failed', e, url);
    Alert.alert('Phone', 'Could not open the phone dialer.');
  }
}
