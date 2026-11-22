import { describe, expect, it } from 'vitest';
import { isIosDevice, shouldOfferInstall } from './install';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const MAC = IPAD_AS_MAC;
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36';

describe('isIosDevice', () => {
  it('detects iPhone, and iPadOS posing as a Mac (touch points)', () => {
    expect(isIosDevice(IPHONE, 5)).toBe(true);
    expect(isIosDevice(IPAD_AS_MAC, 5)).toBe(true);
  });

  it('does not treat a real Mac or Android as iOS', () => {
    expect(isIosDevice(MAC, 0)).toBe(false);
    expect(isIosDevice(ANDROID, 5)).toBe(false);
  });
});

describe('shouldOfferInstall', () => {
  it('is only true on iOS, outside the installed app, before dismissal', () => {
    expect(shouldOfferInstall({ ios: true, standalone: false, dismissedAt: null })).toBe(true);
    expect(shouldOfferInstall({ ios: true, standalone: true, dismissedAt: null })).toBe(false);
    expect(shouldOfferInstall({ ios: false, standalone: false, dismissedAt: null })).toBe(false);
    expect(shouldOfferInstall({ ios: true, standalone: false, dismissedAt: 123 })).toBe(false);
  });
});
