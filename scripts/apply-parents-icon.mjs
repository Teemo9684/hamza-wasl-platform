import { existsSync, mkdirSync, copyFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const mode = process.argv[2];
if (!['web', 'android'].includes(mode)) throw new Error('Usage: node scripts/apply-parents-icon.mjs web|android');
const zip = 'hamza_parents_icon_assets.zip';
// This file is uploaded to the parents-preview branch only. Missing file
// leaves the current app icon intact so normal CI continues to work.
if (!existsSync(zip)) {
  console.log('[Parent icon] ZIP not uploaded yet; current icons remain unchanged.');
  process.exit(0);
}
const temp = mkdtempSync(join(tmpdir(), 'parents-icon-'));
try {
  execFileSync('unzip', ['-q', zip, '-d', temp]);
  const copy = (source, target) => {
    const src = join(temp, source);
    if (!existsSync(src)) throw new Error('Missing parent icon asset: ' + source);
    mkdirSync(join(target, '..'), { recursive: true });
    copyFileSync(src, target);
    console.log('[Parent icon] Applied ' + target);
  };
  if (mode === 'web') {
    copy('icon-192.png', 'public/icon-192.png');
    copy('icon-512.png', 'public/icon-512.png');
  } else {
    for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      for (const icon of ['ic_launcher.png', 'ic_launcher_round.png']) {
        copy('android/mipmap-' + density + '/' + icon,
             'android/app/src/main/res/mipmap-' + density + '/' + icon);
      }
    }
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
