import {
  appleSplashScreenSizes,
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
  type AppleDeviceName,
} from '@vite-pwa/assets-generator/config';

// Brand background used for the Home Screen icon and the splash. iOS applies the
// splash that matches the appearance at install time, so a neutral brand colour
// (not light or dark) looks right in both modes.
const BRAND = '#4F46E5';

const iPhones = (Object.keys(appleSplashScreenSizes) as AppleDeviceName[]).filter((name) =>
  name.startsWith('iPhone'),
);

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: combinePresetAndAppleSplashScreens(
    {
      ...minimal2023Preset,
      // iOS ignores manifest icons for the Home Screen: it needs an opaque 180px PNG.
      apple: {
        sizes: [180],
        padding: 0,
        resizeOptions: { fit: 'contain', background: BRAND },
      },
    },
    {
      padding: 0.35,
      resizeOptions: { fit: 'contain', background: BRAND },
      darkResizeOptions: { fit: 'contain', background: BRAND },
      linkMediaOptions: { addMediaScreen: true, xhtml: false },
    },
    iPhones,
  ),
  images: ['public/icon.svg'],
});
