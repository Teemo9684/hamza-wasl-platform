import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5901e6106a23469f803baed9690ed218',
  appName: 'hamza-wasl-platform',
  webDir: 'dist',
  server: {
    url: 'https://5901e610-6a23-469f-803b-aed9690ed218.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
