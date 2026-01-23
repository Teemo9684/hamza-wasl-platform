/**
 * Vite Plugin لتوليد version.json تلقائياً عند البناء
 */

import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

interface VersionPluginOptions {
  versionFile?: string;
  outputFile?: string;
}

export function viteVersionPlugin(options: VersionPluginOptions = {}): Plugin {
  const {
    versionFile = 'src/config/version.ts',
    outputFile = 'public/version.json',
  } = options;

  return {
    name: 'vite-version-plugin',
    
    buildStart() {
      console.log('📦 Generating version.json...');
      
      try {
        // قراءة ملف الإصدار
        const versionPath = path.resolve(process.cwd(), versionFile);
        const versionContent = fs.readFileSync(versionPath, 'utf-8');
        
        // استخراج رقم الإصدار
        const versionMatch = versionContent.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);
        if (!versionMatch) {
          console.warn('⚠️ Could not find APP_VERSION in version.ts');
          return;
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
        
        const outputPath = path.resolve(process.cwd(), outputFile);
        fs.writeFileSync(outputPath, JSON.stringify(versionJson, null, 2));
        
        console.log(`✅ Generated version.json: v${version}`);
      } catch (error) {
        console.error('❌ Error generating version.json:', error);
      }
    },
  };
}

export default viteVersionPlugin;
