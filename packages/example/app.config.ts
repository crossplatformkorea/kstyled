import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'kstyled-example',
  slug: 'kstyled-example',
  version: '0.4.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'dev.hyo.rnkstyled',
  },
  android: {
    package: 'dev.hyo.rnkstyled',
  },
  web: {
    favicon: './assets/icon.png',
  },
  experiments: {
    typedRoutes: true,
  },
  scheme: 'rnkstyled',
  plugins: ['expo-asset', 'expo-font', 'expo-router'],
});
