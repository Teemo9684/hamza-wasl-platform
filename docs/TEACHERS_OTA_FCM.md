# Teachers-only OTA and Android push (staged, not released)

Source: `apps/teachers-preview`. Android ID: `app.hamzawasl.teachers`.
Proposed OTA branch: `teachers-updates`. Manifest must be
`{"version":"0.0.0","audience":"teacher"}` initially.
Only `teachers-updates/bundles/<version>.zip` is permitted.

- Native APK baseline `1.0.0`; subsequent web OTA versions start at `1.0.1`.
- Five-second foreground OTA polling; foreground FCM `data.type=teachers_ota_update` and `data.audience=teacher` triggers immediate check.
- Publisher is **manual only**, validates approval and increasing version. Builds do not publish.
- Native code, Firebase, permissions and icons require a new APK. Existing teacher APKs without FCM/OTA will not acquire those features by web OTA.
- Create independent `teachers-updates` branch and seed latest.json before invoking a publisher. This channel does not exist automatically when source workflow is committed.
- Register the exact Android package `app.hamzawasl.teachers` in Firebase project `hamza-wasl-app`, then securely configure GitHub Actions secret `TEACHERS_GOOGLE_SERVICES_JSON`. Do not commit credentials or reuse parent config unchanged.
- To send a notification to a teacher while the app is closed, a trusted server-side FCM HTTP v1 sender must be configured with minimal credentials and authorization; web token registration alone is insufficient. Test only with a private test teacher device, never broadcast to school users while staging.
- Existing application message/chat functions and school Realtime listeners are separate from Android push; backend delivery is not asserted by the presence of the native handler.
- Do not modify the school database, parent app, admin app or public production release as part of setup.
- Test sign-in role checks, denied teacher, foreground OTA, background notification, tap-to-open and restart/recovery on a private device before approving any production release.
