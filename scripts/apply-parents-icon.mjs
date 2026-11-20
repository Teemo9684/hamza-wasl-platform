import { existsSync, mkdirSync, copyFileSync, mkdtempSync, rmSync, unlinkSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const mode = process.argv[2];
if (!['web', 'android'].includes(mode)) throw new Error('Usage: node scripts/apply-parents-icon.mjs web|android');
const zip = 'hamza_parents_icon_assets.zip';
// Fail closed: never publish a successful preview with the default Capacitor icon.
if (!existsSync(zip)) throw new Error('[Parent icon] Required uploaded icon ZIP is missing');
const temp = mkdtempSync(join(tmpdir(), 'parents-icon-'));
const sha256 = filename => createHash('sha256').update(readFileSync(filename)).digest('hex');
try {
  execFileSync('unzip', ['-q', zip, '-d', temp]);
  const copy = (source, target) => {
    const src = join(temp, source);
    if (!existsSync(src)) throw new Error('Missing parent icon asset: ' + source);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(src, target);
    if (sha256(src) !== sha256(target)) throw new Error('[Parent icon] File mismatch: ' + target);
    console.log('[Parent icon] Verified ' + target);
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

    // Capacitor's default API 26+ adaptive-icon XML takes precedence over
    // density PNGs. Remove only the generated launcher XML so Android uses
    // the approved bitmap in all densities, including recent Samsung phones.
    for (const folder of ['mipmap-anydpi-v26', 'mipmap-anydpi']) {
      for (const icon of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
        const target = join('android/app/src/main/res', folder, icon);
        if (existsSync(target)) {
          unlinkSync(target);
          console.log('[Parent icon] Removed default adaptive icon: ' + target);
        }
      }
    }
    console.log('[Parent icon] All five Android densities verified; default adaptive icon disabled.');
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
