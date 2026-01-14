#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetPath = 'android/app/src/main/java/app/hamzawasl/app/MainActivity.java';
const sourcePath = 'android-config/MainActivity.java';

console.log('🔧 إعداد Android WebView...\n');

// Check if android folder exists
if (!fs.existsSync('android')) {
  console.log('❌ مجلد android غير موجود!');
  console.log('📝 قم بتشغيل: npx cap add android أولاً\n');
  process.exit(1);
}

// Check if source file exists
if (!fs.existsSync(sourcePath)) {
  console.log('❌ ملف المصدر غير موجود:', sourcePath);
  process.exit(1);
}

// Create target directory if it doesn't exist
const targetDir = path.dirname(targetPath);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('📁 تم إنشاء المجلد:', targetDir);
}

// Copy the file
try {
  fs.copyFileSync(sourcePath, targetPath);
  console.log('✅ تم نسخ MainActivity.java بنجاح!');
  console.log('📍 المسار:', targetPath);
  console.log('\n🚀 الخطوات التالية:');
  console.log('   npm run build');
  console.log('   npx cap sync android');
  console.log('   npx cap run android\n');
} catch (error) {
  console.log('❌ خطأ في النسخ:', error.message);
  process.exit(1);
}
