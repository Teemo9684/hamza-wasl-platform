# إعداد تطبيق Android

## 🎨 إصلاح الصفحة الزرقاء عند بدء التطبيق

### المشكلة
عند فتح التطبيق، تظهر صفحة زرقاء لفترة قصيرة قبل ظهور Splash Screen. هذا اللون يأتي من theme الافتراضي لـ Android.

### الحل

#### الخطوة 1: تعديل ملف styles.xml
بعد تشغيل `npx cap add android`، افتح الملف:
```
android/app/src/main/res/values/styles.xml
```

#### الخطوة 2: تغيير windowBackground
أضف أو عدّل السطر التالي داخل `<style>`:
```xml
<style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
    <item name="android:windowBackground">#FFFFFF</item>
    <!-- باقي الإعدادات -->
</style>
```

#### الخطوة 3: (اختياري) إنشاء ملف colors.xml
إذا لم يكن موجوداً، أنشئ الملف:
```
android/app/src/main/res/values/colors.xml
```

بالمحتوى:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splashBackground">#FFFFFF</color>
</resources>
```

ثم استخدمه في styles.xml:
```xml
<item name="android:windowBackground">@color/splashBackground</item>
```

---

## 🔔 إعداد الإشعارات الفورية (Push Notifications)

### المتطلبات:
- مشروع Firebase (teemo-app-d0227)
- ملف `google-services.json`

### خطوات الإعداد:

#### 1. تحميل ملف google-services.json
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/project/teemo-app-d0227/settings/general)
2. في قسم **Your apps** → اختر تطبيق Android
3. إذا لم يوجد تطبيق Android:
   - اضغط **Add app** → Android
   - أدخل Package name: `app.hamzawasl.app`
   - اضغط **Register app**
4. اضغط **Download google-services.json**

#### 2. وضع الملف في المشروع
```
android/
└── app/
    └── google-services.json  ← ضع الملف هنا
```

#### 3. بناء التطبيق
```bash
npm run build
npx cap sync android
npx cap run android
```

### ⚠️ ملاحظة مهمة:
تأكد أن `package_name` في ملف `google-services.json` هو:
```
app.hamzawasl.app
```

---

## 📱 إصلاح مشكلة حجم الشاشة

### المشكلة
يظهر التطبيق بحجم أكبر من المتوقع مقارنة بنسخة PWA بسبب إعدادات WebView الافتراضية في Android.

### الحل

#### الخطوة 1: بعد إضافة منصة Android

بعد تشغيل `npx cap add android`، انسخ ملف `MainActivity.java` المخصص:

```bash
cp android-config/MainActivity.java android/app/src/main/java/app/hamzawasl/app/MainActivity.java
```

#### الخطوة 2: المزامنة والبناء

```bash
npx cap sync android
npx cap run android
```

### ما الذي يفعله الملف المخصص؟

1. **setUseWideViewPort(true)** - يجعل WebView يحترم عرض viewport في HTML
2. **setLoadWithOverviewMode(true)** - يعرض المحتوى بنفس طريقة Chrome
3. **setTextZoom(100)** - يمنع تغيير حجم النص حسب إعدادات النظام
4. **setInitialScale(0)** - يستخدم المقياس الافتراضي مثل المتصفح

---

## 🔧 الخطوات الكاملة لبناء APK

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 2. تثبيت الحزم
npm install

# 3. إضافة منصة Android
npx cap add android

# 4. نسخ MainActivity المخصص
cp android-config/MainActivity.java android/app/src/main/java/app/hamzawasl/app/MainActivity.java

# 5. وضع google-services.json في android/app/

# 6. بناء ومزامنة
npm run build
npx cap sync android

# 7. تشغيل على جهاز أو محاكي
npx cap run android
```

## ملاحظة مهمة

هذه التعديلات يجب أن تُطبق في كل مرة تقوم فيها بإعادة إنشاء مجلد `android/`.
