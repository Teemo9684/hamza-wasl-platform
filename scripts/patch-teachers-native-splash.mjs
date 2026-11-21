import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Only modify the generated Android project for the standalone teachers app.
// Keep the official React welcome screen exactly as it is.
const activity = 'android/app/src/main/java/app/hamzawasl/teachers/MainActivity.java';
const stylesPath = 'android/app/src/main/res/values/styles.xml';
const sourceImage = 'public/assets/parents-launch-emblem.png';
const nativeImage = 'android/app/src/main/res/drawable-nodpi/teachers_launch_emblem.png';
assert.ok(existsSync(activity) && readFileSync(activity, 'utf8').includes('package app.hamzawasl.teachers;'), 'Not the teachers APK');
assert.ok(existsSync(sourceImage), 'The original school image is missing from the official school icon assets');
assert.ok(existsSync(stylesPath), 'Missing Android styles.xml');

mkdirSync(dirname(nativeImage), { recursive: true });
copyFileSync(sourceImage, nativeImage);

let xml = readFileSync(stylesPath, 'utf8');
const opening = /<style\s+name="AppTheme\.NoActionBarLaunch"[^>]*>/;
const match = opening.exec(xml);
assert.ok(match, 'Could not find Capacitor launch theme');
const start = match.index + match[0].length;
const end = xml.indexOf('</style>', start);
assert.ok(end > start, 'Invalid Capacitor launch theme');
let body = xml.slice(start, end);
// API 31+ uses the system launch icon; never use the square launcher icon.
// On older Android versions the normal white Capacitor launch background remains.
for (const [name, value] of [
  ['android:windowSplashScreenAnimatedIcon', '@drawable/teachers_launch_emblem'],
  ['android:windowSplashScreenBackground', '#FFFFFF'],
  ['android:windowBackground', '#FFFFFF'],
]) {
  const escaped = name.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  body = body.replace(new RegExp('<item\\s+name="' + escaped + '"[^>]*>[\\s\\S]*?<\\/item>', 'g'), '');
  body += '\n        <item name="' + name + '">' + value + '</item>';
}
xml = xml.slice(0, start) + body + '\n    ' + xml.slice(end);
writeFileSync(stylesPath, xml);
assert.ok(readFileSync(stylesPath, 'utf8').includes('@drawable/teachers_launch_emblem'));
console.log('Teacher Android first launch screen: approved school portrait, white background. Official welcome unchanged.');
