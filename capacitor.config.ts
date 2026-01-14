import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.hamzawasl.app',
  appName: 'العربي التبسي-همزة وصل',
  webDir: 'dist',
  ios: {
    contentInset: 'always'
  },
  android: {
    allowMixedContent: true,
    initialFocus: false,
    webContentsDebuggingEnabled: false,
    adjustResize: true,
    // Disable edge-to-edge - use solid system bar colors
    edgeToEdge: false
  },
  server: {
    // For OTA updates, the app loads from local dist folder
    // Updates are downloaded and applied via Capawesome Live Update
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Badge: {
      persist: true,
      autoClear: false
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
      backgroundColor: "#1e40af",
      overlaysWebView: false
    },
    NavigationBar: {
      backgroundColor: "#000000",
      style: "DARK"
    },
    LiveUpdate: {
      enabled: true,
      autoDeleteBundles: true,
      readyTimeout: 10000
    }
  }
};

export default config;
