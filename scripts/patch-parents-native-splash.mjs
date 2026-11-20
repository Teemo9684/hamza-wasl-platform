import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Parent APK only: Android 12+ requires a system launch window.
// Display the SAME school emblem there, so no blank/black transition
// precedes the existing React intro and welcome message.
const mainActivity = 'android/app/src/main/java/app/hamzawasl/parents/MainActivity.java';
const stylesFile = 'android/app/src/main/res/values/styles.xml';
const emblemSource = 'public/assets/parents-launch-emblem.png';
const emblemDrawable = 'android/app/src/main/res/drawable-nodpi/parents_splash_emblem.png';
if (!existsSync(mainActivity) || !readFileSync(mainActivity, 'utf8').includes('package app.hamzawasl.parents;')) {
  throw new Error('Refusing to patch non-parent Android project');
}
if (!existsSync(emblemSource)) throw new Error('Missing approved parent splash emblem: ' + emblemSource);
if (!existsSync(stylesFile)) throw new Error('Android launch styles missing');
mkdirSync(dirname(emblemDrawable), { recursive: true });
copyFileSync(emblemSource, emblemDrawable);

const color = '#14243A';
let xml = readFileSync(stylesFile, 'utf8');
const startMatch = /<style\s+name="AppTheme\.NoActionBarLaunch"[^>]*>/.exec(xml);
if (!startMatch) throw new Error('Capacitor Android launch style changed; review manually');
const start = startMatch.index + startMatch[0].length;
const end = xml.indexOf('</style>', start);
if (end === -1) throw new Error('Invalid Android launch theme');
let body = xml.slice(start, end);
for (const [name, value] of [
  ['windowSplashScreenAnimatedIcon', '@drawable/parents_splash_emblem'],
  ['windowSplashScreenBackground', color],
  ['android:windowSplashScreenAnimatedIcon', '@drawable/parents_splash_emblem'],
  ['android:windowSplashScreenBackground', color],
  ['android:windowBackground', color],
]) {
  const regex = new RegExp('<item\\s+name="' + name + '"[^>]*>[\\s\\S]*?<\\/item>', 'g');
  body = body.replace(regex, '');
  body += '\n        <item name="' + name + '">' + value + '</item>';
}
xml = xml.slice(0, start) + body + '\n    ' + xml.slice(end);
writeFileSync(stylesFile, xml);
if (!readFileSync(stylesFile, 'utf8').includes('@drawable/parents_splash_emblem')) {
  throw new Error('Native splash emblem integration failed');
}
console.log('Parent native splash now uses the school emblem on soft navy, not a transparent drawable.');
