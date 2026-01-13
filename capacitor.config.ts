import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hamzawasl.app',
  appName: 'العربي التبسي-همزة وصل',
  webDir: 'dist',
  ios: {
    contentInset: 'always'
  },
  android: {
    allowMixedContent: true,
    // Disable WebView zoom to match PWA behavior
    initialFocus: false
  },
  server: {
    // Ensure proper viewport handling
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1e40af",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#1e40af"
    }
  }
};

export default config;
