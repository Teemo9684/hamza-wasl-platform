import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Only the standalone parents Android project is patched.
// Android 12+ shows the launcher icon on its system splash by default.
// Replace that splash icon with a transparent drawable, while preserving
// the launcher icon and the React welcome screen (src/components/SplashScreen.tsx).
const mainActivity = 'android/app/src/main/java/app/hamzawasl/parents/MainActivity.java';
const stylesFile = 'android/app/src/main/res/values/styles.xml';
const blankDrawable = 'android/app/src/main/res/drawable/parents_blank_splash.xml';
if (!existsSync(mainActivity) || !readFileSync(mainActivity, 'utf8').includes('package app.hamzawasl.parents;')) {
  throw new Error('Refusing to patch a non-parent Android project');
}
if (!existsSync(stylesFile)) throw new Error('Android styles.xml not found');
let xml = readFileSync(stylesFile, 'utf8');
const styleStart = /<style\s+name="AppTheme\.NoActionBarLaunch"[^>]*>/;
const match = styleStart.exec(xml);
if (!match) throw new Error('Capacitor launch theme changed: review splash style before building');
const start = match.index + match[0].length;
const end = xml.indexOf('</style>', start);
if (end < 0) throw new Error('Launch theme is not closed');
const current = xml.slice(start, end);
const lines = [
  '<item name="windowSplashScreenAnimatedIcon">@drawable/parents_blank_splash</item>',
  '<item name="windowSplashScreenBackground">#FFFFFF</item>'
];
let updated = current;
for (const line of lines) {
  const name = line.match(/name="([^"]+)"/)[1];
  const pattern = new RegExp('<item\\s+name="' + name + '"[^>]*>[\\s\\S]*?<\\/item>', 'g');
  updated = updated.replace(pattern, '');
  updated += '\n        ' + line;
}
xml = xml.slice(0,start) + updated + '\n    ' + xml.slice(end);
writeFileSync(stylesFile, xml);
mkdirSync(dirname(blankDrawable), { recursive: true });
writeFileSync(blankDrawable,
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n' +
  '    <solid android:color="@android:color/transparent" />\n' +
  '</shape>\n');
if (!readFileSync(stylesFile, 'utf8').includes('@drawable/parents_blank_splash')) throw new Error('Splash override verification failed');
console.log('Parents native startup icon hidden; existing React welcome screen preserved.');
