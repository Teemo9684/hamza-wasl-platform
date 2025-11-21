# دليل إنشاء APK باستخدام Android Studio

## المتطلبات الأساسية
- Node.js مثبت على جهازك
- Android Studio مثبت
- Java JDK 17 أو أحدث

## خطوات التهيئة

### 1. تثبيت Dependencies
```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications
```

### 2. بناء التطبيق
```bash
npm run build
```

### 3. إضافة منصة Android (إذا لم تكن موجودة)
```bash
npx cap add android
```

### 4. مزامنة الملفات
```bash
npx cap sync android
```

### 5. فتح المشروع في Android Studio
```bash
npx cap open android
```

## إعدادات إضافية في Android Studio

### 1. إخفاء شريط العنوان
الملف: `android/app/src/main/res/values/styles.xml`
```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="windowActionBar">false</item>
    </style>
</resources>
```

### 2. تكوين Manifest
الملف: `android/app/src/main/AndroidManifest.xml`
تأكد من وجود:
```xml
android:theme="@style/AppTheme"
android:screenOrientation="portrait"
```

### 3. بناء APK

#### للاختبار (Debug APK):
1. في Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. الملف سيكون في: `android/app/build/outputs/apk/debug/app-debug.apk`

#### للنشر (Release APK):
1. ضع ملف `signing.keystore` في مجلد المشروع الرئيسي
2. أنشئ ملف `android/key.properties`:
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=my-key-alias
storeFile=../../signing.keystore
```
3. في Android Studio: Build → Generate Signed Bundle / APK
4. اختر APK
5. حدد keystore وأدخل كلمة المرور
6. اختر release
7. الملف سيكون في: `android/app/build/outputs/apk/release/app-release.apk`

## تحديث assetlinks.json

بعد توقيع APK، احصل على SHA256 fingerprint:
```bash
keytool -list -v -keystore signing.keystore -alias my-key-alias
```

ثم حدّث ملف `public/.well-known/assetlinks.json` بالبصمة.

## ملاحظات مهمة

1. **للتطوير**: استخدم `npx cap sync` بعد كل تغيير في الكود
2. **Push Notifications**: تحتاج إلى Firebase configuration (google-services.json)
3. **App Links**: تحتاج إلى رفع assetlinks.json على السيرفر الخاص بك
4. **Icons**: تأكد من وجود جميع أحجام الأيقونات المطلوبة

## استكشاف الأخطاء

### خطأ: "Could not find build tools"
قم بتثبيت Android SDK Build Tools في Android Studio SDK Manager

### خطأ: "Gradle build failed"
جرّب:
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### خطأ: "Unable to load native-bridge.js"
تأكد من تشغيل `npm run build` قبل `npx cap sync`

## الأوامر المفيدة

```bash
# إعادة بناء ومزامنة
npm run build && npx cap sync android

# فتح في Android Studio
npx cap open android

# تشغيل على جهاز متصل
npx cap run android

# عرض console logs
npx cap run android -l
```
