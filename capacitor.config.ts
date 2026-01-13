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
    initialFocus: false,
    webContentsDebuggingEnabled: false,
    adjustResize: true,
    // CRITICAL: Disable edge-to-edge to prevent system bars from being transparent/overlapping
    edgeToEdge: false
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
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
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1e40af",
      overlaysWebView: false
    },
    NavigationBar: {
      backgroundColor: "#000000",
      style: "DARK"
    }
  }
};

export default config;
