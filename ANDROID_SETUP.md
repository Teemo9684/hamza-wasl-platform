# إعداد تطبيق Android - إصلاح مشكلة حجم الشاشة

## المشكلة
يظهر التطبيق بحجم أكبر من المتوقع مقارنة بنسخة PWA بسبب إعدادات WebView الافتراضية في Android.

## الحل

### الخطوة 1: بعد إضافة منصة Android

بعد تشغيل `npx cap add android`، انسخ ملف `MainActivity.java` المخصص:

```bash
cp android-config/MainActivity.java android/app/src/main/java/com/hamzawasl/app/MainActivity.java
```

### الخطوة 2: المزامنة والبناء

```bash
npx cap sync android
npx cap run android
```

## ما الذي يفعله الملف المخصص؟

1. **setUseWideViewPort(true)** - يجعل WebView يحترم عرض viewport في HTML
2. **setLoadWithOverviewMode(true)** - يعرض المحتوى بنفس طريقة Chrome
3. **setTextZoom(100)** - يمنع تغيير حجم النص حسب إعدادات النظام
4. **setInitialScale(0)** - يستخدم المقياس الافتراضي مثل المتصفح

## ملاحظة مهمة

هذا التعديل يجب أن يُطبق في كل مرة تقوم فيها بإعادة إنشاء مجلد `android/`.
