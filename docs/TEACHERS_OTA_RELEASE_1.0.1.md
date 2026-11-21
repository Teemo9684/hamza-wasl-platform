# Teachers preview OTA 1.0.1 — owner-approved release

Approved by the project owner in this conversation on 2026-11-21:
"ابنِ وانشر كيما كنت دير في تطبيق الأولياء".

This is the first isolated **teacher** web OTA release. The release
publishes only `dist-teacher` to the independent `teachers-updates`
channel after the workflow's validation and build steps succeed.

- Native baseline: `1.0.0`; OTA bundle version: `1.0.1`.
- Android package: `app.hamzawasl.teachers`.
- Source: `apps/teachers-preview` (no parent or admin source).
- UI: matching parent landing typography scale and phone spacing; teacher-only content remains.
- Native WebView `setTextZoom(100)` and Android chrome are delivered through a separate APK build, not through OTA.
- This is a testing release. The test APK has to be installed at least once for the teacher-specific OTA channel.
- School database records and notifications are not changed or broadcast.
- Any additional OTA version requires separate owner approval.
