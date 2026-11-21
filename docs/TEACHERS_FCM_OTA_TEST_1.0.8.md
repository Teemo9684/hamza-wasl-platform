# Teachers OTA notification verification

Owner confirmed that the 1.0.7 preview is installed and the private teacher device registration token has been added to GitHub Secrets. This source change triggers the existing verified build and automatic teacher-only OTA publication, followed by the single-device FCM update alert when both required secrets are configured. The expected next version is 1.0.8. Device receipt remains unverified until the owner confirms it. No database changes, parent/admin releases or broadcast notifications are authorized by this test.
