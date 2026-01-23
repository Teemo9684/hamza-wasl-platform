/**
 * سكريبت توليد ملف version.json تلقائياً عند البناء
 * يقرأ الإصدار من src/config/version.ts ويكتبه في public/version.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قراءة ملف الإصدار
const versionFilePath = path.join(__dirname, '..', 'src', 'config', 'version.ts');
const versionContent = fs.readFileSync(versionFilePath, 'utf-8');

// استخراج رقم الإصدار
const versionMatch = versionContent.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);
if (!versionMatch) {
  console.error('❌ Could not find APP_VERSION in version.ts');
  process.exit(1);
}

const version = versionMatch[1];

// استخراج آخر تحديثات
const changesMatch = versionContent.match(/changes:\s*\[([\s\S]*?)\]/);
let releaseNotes = '';
if (changesMatch) {
  const changes = changesMatch[1]
    .match(/"([^"]+)"/g)
    ?.map(s => s.replace(/"/g, ''))
    .slice(0, 3)
    .join('، ');
  releaseNotes = changes || '';
}

// إنشاء ملف version.json
const versionJson = {
  version,
  buildTime: new Date().toISOString(),
  isMandatory: false,
  releaseNotes: releaseNotes || `الإصدار ${version}`,
};

const outputPath = path.join(__dirname, '..', 'public', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionJson, null, 2));

console.log(`✅ Generated version.json: v${version}`);
console.log(`   Release notes: ${releaseNotes}`);
