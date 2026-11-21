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
