# Pilot release 1.2.70

- [x] Inspect uploaded ZIP and confirm pilot update endpoint and bundled version.
- [x] Upload ZIP under a dedicated pilot storage path and verify anonymous Android download and SHA-256.
- [x] Activate 1.2.70 only in pilot_app_versions, without forcing the update.
- [x] Check Android 1.2.69 receives hasUpdate=true, version 1.2.70 and the exact uploaded URL.
- [x] Verify parent app_versions rows remain unchanged; do not publish the parent app.
- [x] Run saved read-only release tests (3 passed).