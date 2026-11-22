/**
 * True when running from the Home Screen icon. iOS exposes `navigator.standalone`; other
 * browsers use the display-mode media query.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayMode =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  return iosStandalone || displayMode;
}

/**
 * iPhone/iPad/iPod, including iPadOS which reports a desktop Mac user agent but has touch.
 * iOS has no install prompt API, so we only show our own instructions on iOS devices.
 */
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/** Offer "Add to Home Screen" only on iOS, outside the installed app, until dismissed. */
export function shouldOfferInstall(input: {
  ios: boolean;
  standalone: boolean;
  dismissedAt: number | null;
}): boolean {
  return input.ios && !input.standalone && input.dismissedAt === null;
}

export function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isIosDevice(navigator.userAgent, navigator.maxTouchPoints);
}
