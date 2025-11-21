# قائمة تدقيق إنشاء APK

## ✅ قبل البناء

### تحقق من الملفات الأساسية
- [ ] `capacitor.config.ts` - تكوين Capacitor صحيح
- [ ] `vite.config.ts` - تكوين PWA صحيح مع display: fullscreen
- [ ] `index.html` - جميع meta tags موجودة
- [ ] `public/.well-known/assetlinks.json` - موجود (سيحتاج تحديث بالبصمة لاحقاً)
- [ ] Icons (192x192, 512x512, apple-touch-icon) موجودة في `/public`

### تحقق من Dependencies
```bash
npm list @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications
```

## 🔨 خطوات البناء

### 1. تنظيف وتثبيت
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. بناء التطبيق
```bash
npm run build
```
تحقق من أن مجلد `dist` تم إنشاؤه بنجاح.

### 3. إضافة منصة Android (أول مرة فقط)
```bash
npx cap add android
```

### 4. مزامنة الملفات
```bash
npx cap sync android
```

### 5. تحديثات يدوية في Android Studio

بعد فتح المشروع في Android Studio (`npx cap open android`):

#### أ. تحديث styles.xml
المسار: `android/app/src/main/res/values/styles.xml`
```xml
<resources>
    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        
        <!-- Fullscreen settings -->
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="windowActionBar">false</item>
    </style>
</resources>
```

#### ب. تحديث AndroidManifest.xml
المسار: `android/app/src/main/AndroidManifest.xml`

في `<activity>` الرئيسي، تأكد من:
```xml
<activity
    android:name=".MainActivity"
    android:theme="@style/AppTheme"
    android:screenOrientation="portrait"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:launchMode="singleTask">
```

#### ج. إضافة Colors (إذا لم تكن موجودة)
المسار: `android/app/src/main/res/values/colors.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#1e40af</color>
    <color name="colorPrimaryDark">#1e3a8a</color>
    <color name="colorAccent">#3b82f6</color>
</resources>
```

### 6. إنشاء keystore (للإصدار النهائي)

إذا لم يكن لديك keystore:
```bash
keytool -genkey -v -keystore signing.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

معلومات التوقيع:
- الاسم: همزة وصل Admin
- المنظمة: همزة وصل - المدرسة الابتدائية العربي التبسي
- الوحدة: Engineering
- الدولة: US

### 7. إنشاء key.properties
المسار: `android/key.properties`
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=my-key-alias
storeFile=../signing.keystore
```

**⚠️ مهم**: أضف `android/key.properties` إلى `.gitignore`

### 8. بناء APK

#### Debug APK (للاختبار):
في Android Studio:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. الملف: `android/app/build/outputs/apk/debug/app-debug.apk`

أو من سطر الأوامر:
```bash
cd android
./gradlew assembleDebug
```

#### Release APK (للنشر):
في Android Studio:
1. Build → Generate Signed Bundle / APK
2. اختر APK
3. حدد keystore (`signing.keystore`)
4. أدخل كلمات المرور
5. اختر Build Variant: release
6. الملف: `android/app/build/outputs/apk/release/app-release.apk`

أو من سطر الأوامر:
```bash
cd android
./gradlew assembleRelease
```

## 🔐 الحصول على SHA256 Fingerprint

بعد إنشاء keystore:
```bash
keytool -list -v -keystore signing.keystore -alias my-key-alias
```

ابحث عن سطر `SHA256:` وانسخ البصمة الكاملة (مع النقطتين).

## 📝 تحديث assetlinks.json

بعد الحصول على SHA256، حدّث `public/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.lovable.5901e6106a23469f803baed9690ed218",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

ثم:
1. أعد نشر التطبيق (Update في Lovable)
2. تأكد من أن الملف متاح على: `https://your-domain/.well-known/assetlinks.json`

## 🧪 اختبار APK

### على محاكي Android:
```bash
npx cap run android
```

### تثبيت APK على جهاز فعلي:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## ✅ قائمة التحقق النهائية

قبل النشر، تأكد من:
- [ ] الأيقونات تظهر بشكل صحيح
- [ ] شريط العنوان مخفي (fullscreen)
- [ ] الاتجاه عمودي (portrait) فقط
- [ ] Push notifications تعمل
- [ ] التطبيق يعمل بدون اتصال بالإنترنت (offline mode)
- [ ] جميع الصفحات تعمل بشكل صحيح
- [ ] RTL يعمل بشكل صحيح
- [ ] النصوص العربية تظهر بالخطوط الصحيحة
- [ ] assetlinks.json محدث ومرفوع على السيرفر

## 🐛 استكشاف الأخطاء الشائعة

### خطأ: "Task :app:processDebugResources FAILED"
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### خطأ: "Could not determine java version"
تأكد من تثبيت JDK 17 أو أحدث وضبط JAVA_HOME

### خطأ: "Unable to load native-bridge.js"
```bash
npm run build
npx cap copy android
npx cap sync android
```

### التطبيق لا يظهر fullscreen
تحقق من:
1. `styles.xml` - windowFullscreen صحيح
2. `AndroidManifest.xml` - theme صحيح
3. `capacitor.config.ts` - splashImmersive: true

## 📚 موارد إضافية

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Studio Download](https://developer.android.com/studio)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

## 🔄 سير عمل التطوير المستمر

بعد أي تغيير في الكود:
```bash
npm run build
npx cap sync android
npx cap run android
```

للتحديثات السريعة (بدون إعادة فتح Android Studio):
```bash
npm run build && npx cap sync android
```
