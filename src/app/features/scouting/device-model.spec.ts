import { resolveDeviceModel } from './device-model';

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; SM-S911B Build/UP1A) AppleWebKit/537.36 Chrome/120 Mobile';

describe('resolveDeviceModel', () => {
  it('prefers the user-agent client hint', async () => {
    const userAgentData = { getHighEntropyValues: async () => ({ model: 'Pixel 8' }) };
    expect(await resolveDeviceModel({ userAgent: ANDROID_UA, userAgentData })).toBe('Pixel 8');
  });

  it('reads the Android model from the user agent when the hint is empty', async () => {
    const userAgentData = { getHighEntropyValues: async () => ({ model: '' }) };
    expect(await resolveDeviceModel({ userAgent: ANDROID_UA, userAgentData })).toBe('SM-S911B');
  });

  it('falls back to the user agent when the hint call rejects', async () => {
    const userAgentData = { getHighEntropyValues: () => Promise.reject(new Error('denied')) };
    expect(await resolveDeviceModel({ userAgent: ANDROID_UA, userAgentData })).toBe('SM-S911B');
  });

  it('is undefined on a desktop browser', async () => {
    expect(await resolveDeviceModel({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBeUndefined();
  });
});
