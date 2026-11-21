import { CapacitorConfig } from '@capacitor/cli';

/**
 * Native applications get distinct Android identities and web bundles.
 * The current pilot remains the default for its existing build workflow.
 * Use APP_AUDIENCE=parent|teacher|admin with the corresponding build command.
 */
const audience = process.env.APP_AUDIENCE || "combined";
const identities: Record<string, { appId: string; appName: string; webDir: string }> = {
  combined: { appId: "app.hamzawasl.app.pilot", appName: "همزة وصل – تجريبي", webDir: "dist" },
  parent: { appId: "app.hamzawasl.parents", appName: "همزة وصل – الأولياء", webDir: "dist-parent" },
  teacher: { appId: "app.hamzawasl.teachers", appName: "همزة وصل – الأساتذة", webDir: "dist-teacher" },
  admin: { appId: "app.hamzawasl.admin", appName: "همزة وصل – الإدارة", webDir: "dist-admin" },
};
if (!identities[audience]) {
  throw new Error("Unsupported APP_AUDIENCE for Capacitor build: " + audience);
}
const identity = identities[audience];

const config: CapacitorConfig = {
  appId: identity.appId,
  appName: identity.appName,
  webDir: identity.webDir,
  ios: {
    contentInset: 'always'
  },
  android: {
    // The pilot Android package has no Firebase registration yet.
    includePlugins: [
      '@capacitor/app',
      '@capacitor/haptics',
      '@capacitor/local-notifications',
      // This registered Android package uses the existing Firebase project.
      ...(audience === 'parent' ? ['@capacitor/push-notifications'] : []),
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
      // Only the existing pilot has a verified OTA feed.
      enabled: audience === 'combined' || (audience === 'parent' && process.env.PARENT_OTA_ENABLED === 'true'),
      autoDeleteBundles: true,
      readyTimeout: 10000
    }
  }
};

export default config;
