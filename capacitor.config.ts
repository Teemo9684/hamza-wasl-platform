import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hamzawasl.app',
  appName: 'العربي التبسي-همزة وصل',
  webDir: 'dist',
  server: {
    url: 'https://5901e610-6a23-469f-803b-aed9690ed218.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
