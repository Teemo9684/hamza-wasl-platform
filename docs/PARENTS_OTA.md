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
