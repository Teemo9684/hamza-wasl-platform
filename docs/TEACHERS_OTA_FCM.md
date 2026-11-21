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

## Verified standalone feed

Created `teachers-updates` with `latest.json` declaring `{"version":"0.0.0","audience":"teacher"}`.
No test APK or OTA release has been built or published. The channel is inert until a manually approved release.

## GitHub Actions dispatch prerequisite

GitHub requires manually dispatched workflows to be present on the repository's default
branch before the Run workflow UI/API can invoke them. These staged workflows currently
live **only** in `apps/teachers-preview`, so they are not yet directly runnable from
Actions. Registering narrowly scoped workflows in the default branch requires separate
coordination; do not merge application code or perform unapproved releases.

## Firebase administrator setup (not performed)

In Firebase Console, select project `hamza-wasl-app`, add a *new Android app*
with package `app.hamzawasl.teachers`, and download the corresponding
`google-services.json`. Save its exact contents as GitHub Actions repository secret
`TEACHERS_GOOGLE_SERVICES_JSON` (not source). A dedicated, least-privilege
FCM HTTP v1 sender credential belongs in `TEACHERS_FCM_SERVICE_ACCOUNT_JSON`.
For a single-device private test, store the test phone's FCM registration token as
`TEACHERS_FCM_TEST_TOKEN`. Never paste the token or credential into this chat.

The special private test sender is gated behind `TEST-TEACHERS-FCM`.
It neither reads school databases nor broadcasts. Its success only proves a
test notification was accepted by FCM; phone delivery must be checked separately.

## Explicit rollout acceptance checks

1. Build standalone `app.hamzawasl.teachers` from `apps/teachers-preview` after
   registering the exact Firebase identity and configuring secret.
2. Install the fresh APK on an isolated test phone and grant notification permission.
3. Verify teacher role approval and denial for non-teacher accounts.
4. Verify one private FCM test while foreground and background/closed.
5. Approve an isolated OTA release `1.0.1` only after validating the APK.
6. Confirm only teachers update and no parent/admin or production DB changes occur.

Existing Supabase Realtime notifications cover live foreground in-app messages, but
guaranteed delivery while the app is not running requires a trusted backend sender
connected to authorized teacher events. That production sender is not enabled here.

## Approved continuous preview publication (2026-11-21)

The project owner explicitly authorized publishing each teachers preview update automatically **after a successful build**, without per-release approval. The `Teachers preview build and publish OTA` workflow now builds and verifies the teachers web bundle, builds and uploads a test Android APK, and *only after both jobs pass* generates the next patch version and publishes a web-only bundle to `teachers-updates`. The publisher checks the latest source SHA and skips superseded runs; the release manifest records `source_sha` to avoid duplicate releases. Workflow concurrency supersedes queued older builds and serializes channel publication.

This replaces the earlier manual-only policy **for teachers preview OTA**, not for parent/admin/production releases. Existing separately defined manual teacher publisher remains available for deliberate recovery, but routine teacher changes use the automatic build pipeline. No school database writes or FCM broadcast are part of automatic OTA publication. Native code/permissions/Firebase resources still require installing a new APK and are never delivered by web OTA.
