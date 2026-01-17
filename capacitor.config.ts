import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.hamzawasl.app',
  appName: 'العربي التبسي',
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
