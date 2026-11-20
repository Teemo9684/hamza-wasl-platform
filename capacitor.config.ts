import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.hamzawasl.app.pilot',
  appName: 'همزة وصل – تجريبي',
  webDir: 'dist',
  ios: {
    contentInset: 'always'
  },
  android: {
    // The pilot Android package has no Firebase registration yet.
    includePlugins: [
      '@capacitor/app',
      '@capacitor/haptics',
      '@capacitor/local-notifications',
      '@capacitor/preferences',
      '@capacitor/splash-screen',
      '@capacitor/status-bar',
      '@capawesome/capacitor-badge',
      '@capawesome/capacitor-live-update',
    ],
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
    iosScheme: 'https',
    // Enable autofill by using a proper hostname instead of localhost
    // This allows password managers to recognize the domain
    hostname: 'hamza-wasl-platform.lovable.app'
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
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      showSpinner: false
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#f8fafc",
      overlaysWebView: false
    },
    NavigationBar: {
      backgroundColor: "#ffffff",
      style: "LIGHT"
    },
    LiveUpdate: {
      enabled: true,
      autoDeleteBundles: true,
      readyTimeout: 10000
    }
  }
};

export default config;
