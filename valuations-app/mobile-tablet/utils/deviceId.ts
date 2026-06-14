import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'mobile_device_id';
const FALLBACK_DEVICE_ID = 'mobile-tablet-device';

let cachedDeviceId: string | null = null;

function generateDeviceId(): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `mobile-tablet-${Date.now()}-${suffix}`;
}

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }

    const generated = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
    cachedDeviceId = generated;
    return generated;
  } catch (error) {
    console.warn('deviceId: falling back to static device id', error);
    cachedDeviceId = FALLBACK_DEVICE_ID;
    return FALLBACK_DEVICE_ID;
  }
}
