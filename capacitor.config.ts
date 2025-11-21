import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5901e6106a23469f803baed9690ed218',
  appName: 'همزة وصل',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: false
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1e40af',
    buildOptions: {
      keystorePath: 'signing.keystore',
      keystoreAlias: 'my-key-alias',
    }
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e40af",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      splashFullScreen: false,
      splashImmersive: false
    }
  }
};

export default config;
