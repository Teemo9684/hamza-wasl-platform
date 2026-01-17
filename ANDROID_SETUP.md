# إعداد تطبيق Android

## 🎨 توحيد شاشات البداية (Splash Screens)

### المشكلة
عند فتح التطبيق تظهر عدة شاشات قبل Splash Screen الرئيسي:
1. **شاشة أيقونة التطبيق** (Android 12+ Splash) - لا يمكن حذفها
2. **صفحة زرقاء** (من windowBackground) - يمكن تغيير لونها
3. **Splash Screen المخصص** (صورة بيضاء مع الشعار) ✅

### الحل: توحيد جميع الشاشات بلون أبيض
بهذا ستبدو كشاشة واحدة سلسة تنتهي بـ Splash Screen المخصص.

#### الخطوة 1: تعديل ملف styles.xml
بعد تشغيل `npx cap add android`، افتح الملف:
```
android/app/src/main/res/values/styles.xml
```

#### الخطوة 2: إضافة الإعدادات التالية
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <!-- توحيد لون الخلفية لجميع الشاشات -->
        <item name="android:windowBackground">#FFFFFF</item>
        
        <!-- إعدادات Android 12+ Splash Screen -->
        <item name="android:windowSplashScreenBackground">#FFFFFF</item>
        <item name="android:windowSplashScreenIconBackgroundColor">#FFFFFF</item>
        
        <!-- إخفاء شريط العنوان -->
        <item name="android:windowNoTitle">true</item>
    </style>
</resources>
```

#### الخطوة 3: (اختياري) تخصيص أيقونة Android 12+ Splash
إذا أردت تغيير أيقونة شاشة البداية الأولى، ضع صورة مربعة في:
```
android/app/src/main/res/drawable/splash_icon.xml
```

ثم أضف في styles.xml:
```xml
<item name="android:windowSplashScreenAnimatedIcon">@drawable/splash_icon</item>
```

### ⚠️ ملاحظة مهمة
شاشة Android 12+ Splash **لا يمكن حذفها** - هي جزء إجباري من نظام Android.
لكن بتوحيد الألوان، ستظهر كانتقال سلس إلى Splash Screen المخصص.

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
