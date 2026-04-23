import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaparkyi.app',
  appName: 'Запаркуй',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'http://localhost:5173',
    cleartext: true,
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      Orientation: 'portrait',
      'android-minSdkVersion': '22',
      'android-targetSdkVersion': '34',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 1000,
      backgroundColor: '#2563EB',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#FFFFFF',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#2563EB',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#2563EB',
      sound: 'default',
    },
  },
  ios: {
    contentInset: 'automatic',
    scrollPadding: true,
    // Minimum iOS version
    minVersion: '13.0',
  },
  android: {
    // Minimum Android SDK version
    minSdkVersion: 22,
    // Target SDK version
    targetSdkVersion: 34,
    // Build tools version
    buildToolsVersion: '34.0.0',
    // Enable debugging in release builds
    debuggable: true,
  },
};

export default config;