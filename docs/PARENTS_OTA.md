# Parents-only OTA updates — controlled preview

## Separation

- Android package: `app.hamzawasl.parents`
- Source branch: `apps/parents-preview`
- Update channel: `parents-updates` (not `pilot-updates`)
- Latest manifest: `parents-updates/latest.json`, requiring `"audience":"parent"`
- Baseline APK web version: `1.0.0`, independent of pilot `1.2.75`

The parents APK built by `Parents preview build` now opts into *only* the parent update feed. It checks shortly after starting, on resume (subject to the one-minute minimum), and during periodic checks. Existing APKs built with OTA disabled **will not begin receiving OTA**; the tester must install the new APK once.

## Approval and publication

Every push to `apps/parents-preview` builds a **testing APK only**. It does **not** publish an OTA bundle. The channel manifest stays at `0.0.0` until an approved manual release.

After validating a candidate with a test phone:

1. Open GitHub Actions > **Publish approved parents OTA bundle**.
2. Click **Run workflow** on `apps/parents-preview`.
3. Supply a new semantic version, starting at `1.0.1`, and confirmation `PUBLISH-PARENTS-OTA`.
4. The workflow builds `dist-parent` with `VITE_PARENT_OTA_ENABLED=true` and the specified parent version, checks the role-specific build, packages it as `bundles/<version>.zip`, and updates `parents-updates/latest.json`.
5. Phones with the OTA-enabled parents APK will then detect the higher version and apply the web bundle automatically.

Do not use this action to ship unreviewed changes. Publishes to this channel affect every installation configured to receive parents preview updates. The manifest is intentionally not changed by builds.

**Native Android code and resources cannot be replaced by web OTA.** Launcher icons, Android launch splash, Capacitor plugins and permissions require a newly built APK, even when web OTA is enabled.

Do not edit the live Lovable Cloud database or the admin/teacher apps through this release process.

## Initial approved version test

User authorized first isolated parents OTA release `1.0.1` with an official-style `v1.0.1` label on the initial parent login page. No school data, native files, or staff apps are part of this web OTA bundle. Further releases continue to require explicit approval.

## Approved 1.0.1 release retry after YAML validation

Initial GitHub workflow attempts failed before starting jobs due to a YAML parsing problem in the guarded release condition. The fixed workflow is used for this same explicitly approved 1.0.1 test; no changes to the real school database.

## Approved 1.0.2 version visibility release

User approved publishing 1.0.2 for a visible, high-contrast version marker on the standalone parents landing and login pages. This OTA is web-only and restricted to the isolated parents-updates channel. No school records or staff applications were modified.

## Approved 1.0.3 official-style version footer

User approved parents-only OTA release 1.0.3 to change the version indicator from a white pill into unobtrusive semi-transparent white text at the bottom left, matching the official app. The version remains visible on parent landing and dedicated login screens. No native APK changes or changes to the school database.

## 1.0.4 native-viewport version label

The screenshot after 1.0.3 shows the version still hidden although 1.0.2's white pill was visible. The parent version text is now portaled to document.body, outside Framer Motion's scaled app wrapper and the landing page's clipping. Its typography remains identical to the official small semitransparent bottom-left text. The OTA is web-only and parents-only.

## 1.0.5 official-footer Android bottom overlay fix

The official main application's version footer is a transparent text-only div. The parents APK adds a fixed pseudo-element `html.capacitor-android.parent-audience::after` at the bottom of the screen with height at least 24px and z-index 9999; a footer just 16px from the bottom can be covered. The parents footer retains official classes and renders above and clear of that bar via a body portal, while no appearance changes are made to the official app. The user requested applying the official solution to the isolated parents app.

## Approved 1.0.6: foreground update checks every five seconds

The parent-only app now polls the isolated parents-updates manifest every 5 seconds while the WebView is online and visible, with a 5-second minimum interval. Manifest requests use a cache-busting query to reduce stale GitHub raw CDN results. Checks do not overlap. The user requested near-immediate updates while the app stays open; this is near-real-time polling, not server-initiated push delivery and is not guaranteed instantaneous. Android closed/background push delivery requires an additional native APK and push infrastructure. The combined pilot and staff apps retain their previous polling behavior; the live Lovable Cloud database was not changed.

## Firebase Cloud Messaging — parent APK integration (staged)

- Firebase project: `hamza-wasl-app`, verified that uploaded `google-services.json` registers `app.hamzawasl.parents` exactly once.
- The existing school app and its `app.hamzawasl.app` identity are not modified.
- The independent parent Capacitor build includes `@capacitor/push-notifications` and handles `data.type=parents_ota_update`, `data.audience=parent` by checking the existing independent `parents-updates` manifest. Fast foreground polling remains as a fallback.
- **Required before building a parent APK with FCM:** In GitHub repository Settings → Secrets and variables → Actions → New repository secret, create `PARENTS_GOOGLE_SERVICES_JSON` containing the exact text of the Firebase `google-services.json` from the Firebase Console. The workflow validates the Firebase project and parent package. The JSON must never be committed to the public source tree.
- The native APK build is configured to fail clearly until this secret exists; ordinary parent web verification does not depend on it.
- For server-triggered push, a trusted sender must additionally be implemented with FCM HTTP v1 credentials stored server-side, and targeted to the registered parent devices only. The Firebase client config is **not** a sender credential. Do not broadcast school notifications or write to production `push_tokens` as part of setup.
- After the secret and trusted sender are configured, test with a dedicated parent APK and a safe test device, then approve a release. Neither the GitHub web source updates nor existing OTA bundles can add native Firebase capabilities to an already-installed APK.

FCM build verification requested after the repository secret was added; no production changes or Firebase credentials are committed.

## Private 1.0.7 FCM token-copy test

The installed parents-only debug APK already contains native FCM; 1.0.7 enables a temporary web-only tester by tapping the version number on the initial parents screen. The dialog copies the in-memory device token to the phone clipboard, without logging or rendering it in UI. The feature is gated by `VITE_PARENT_FCM_TEST_ENABLED`, set only for the explicitly approved 1.0.7 OTA push. Future normal OTA releases leave it disabled. The token is sensitive and should be used only via Firebase Console test-message tooling, not posted in public GitHub or chats. No notification is sent and no school data is changed by this release.

## Parent-only automatic FCM signal after an approved OTA release (private test stage)

The GitHub Actions publisher now has a post-publication-only FCM HTTP v1 step. It runs **after** `parents-updates/latest.json` and its bundle are pushed, and it targets exactly one test device. There is no broadcast to parent users, no database access, and no effect on `main`, `pilot-updates`, teachers or admin apps. It remains disabled (cleanly skipped) until **both** repository Actions secrets are configured:

- `PARENTS_FCM_SERVICE_ACCOUNT_JSON`: a *server-side* Firebase/Google Cloud service-account credential JSON from the `hamza-wasl-app` project, dedicated to FCM sending with minimal permissions. This is different from the client `google-services.json`; never send the service-account JSON in chat, put it in OTA bundles or commit it to Git.
- `PARENTS_FCM_TEST_TOKEN`: the FCM registration token copied from the tester's phone. Do not share it in public logs or chat.

Use GitHub Settings → Secrets and variables → Actions → New repository secret for both. The sender validates the Firebase project, approved parent audience and OTA version, requests a short-lived OAuth2 token, and posts one `data`-only `parents_ota_update` message with `audience=parent` and `version` to the FCM HTTP v1 API. The native app checks the canonical parents manifest when the signal is received in foreground; background delivery and automatic application are **not guaranteed** by Android.

**Never test this by sending a campaign to all devices.** For an end-to-end check, explicitly approve a *new* parent OTA version after configuring secrets; source workflow edits alone do not publish the next OTA. The `1.0.7` release remains the latest approved release until then. The GitHub workflow publishes OTA independently of the FCM test: missing FCM secrets skip just that step, and an FCM send error fails the step after OTA has already published (no rollback).

## Approved private 1.0.8 OTA / FCM integration verification

The owner confirmed both GitHub Actions secrets for the one-device send have been configured and approved running the test. Version 1.0.8 is an isolated parent-only test release, using the temporary FCM token-copy dialog and same native APK. The workflow publishes a versioned OTA bundle to `parents-updates` first, then sends a single high-priority FCM data signal to the configured test device. A separate foreground 5-second polling loop remains an independent fallback and can also trigger the update; receipt of an updated version alone does not prove FCM was the transport. No other app or production school data is changed.

## Approved 1.0.9 foreground FCM integration test

The owner explicitly approved a standalone parent OTA 1.0.9 test while the app remains visible on the phone. Publish parent-only assets, then send the private single-token FCM data signal using the existing secure post-publish workflow step. The foreground 5-second polling fallback remains enabled; seeing 1.0.9 alone does not prove that FCM (rather than polling) caused the refresh. No Firebase or school database changes.

## Approved 1.0.10 closed-app notification test

With the test app closed on the owner's phone and notification permission enabled, publish the isolated parent OTA 1.0.10 and send a private FCM notification+data message to the single configured test token. Expected outcome: Android notification appears before opening the app, and upon opening the app the existing parents OTA update applies 1.0.10. The user explicitly confirmed the app was closed before this release. No school data modifications or other audience changes.

## Approved isolated 1.0.11 remediation test release

The owner requested correcting all currently identified parents-app security and behavior issues. After source verification, the parents preview's web-only fixes are staged for private OTA 1.0.11. This does not publish to families or modify any source branch other than apps/parents-preview. The independent parents-updates feed and the existing one-test-device FCM sender are used; native Android code remains unchanged. Shared Lovable database RLS fixes were applied separately and verified by read-only policy inspection. Live behavior with at least one approved and one pending test parent still requires human validation. The secure additional-child workflow requires administrator verification; no unauthorized self-link is allowed.

## 1.0.12 parents-only attachment preview

Approved user-requested parents-app UI fix: homework attachments now open in a fullscreen in-app preview above all fixed news and school date/header UI. The underlying header remains unchanged and returns on close. Includes image/PDF rendering where Android WebView supports it and external-open fallback for other file types. Includes source/build test assertions. Web/OTA-only; no native plugin, database, official app, teachers app, or admin app modifications.

## 1.0.13 actual landing-page poster preview fix

Screenshot of 1.0.12 showed the real issue: parent landing page poster fullscreen overlay remained behind its sticky news/date header because the preview lived inside a nested CSS stacking context. The isolated parents-only PostersCarousel preview now uses React createPortal into document.body with higher z-index and accessible dialog labeling. The fullscreen viewer preserves close/image behavior and ensures the header appears again after close. Source/build regression assertion added; no changes to teacher/admin source branches or shared data.

## 1.0.14 single parent login navigation

The standalone parents app now renders the existing embedded login inside the landing page, with the news ticker and date/time header, for the /login/parent route. It no longer renders the separate green LoginParent screen in the standalone parent audience. Tapping the parent card goes to /login/parent; the Android system Back button and the in-page Back button return to the landing page. Other audiences retain their original login components. This only changes parents preview code and OTA; no database writes or school-record changes.
