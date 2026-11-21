#!/usr/bin/env python3
"""Send a parent OTA signal to ONE private test device after successful publication.

No Firestore, Lovable Cloud or push_tokens reads. This is not a production broadcast.
Requires google-auth installed by the isolated GitHub Actions workflow.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request


PROJECT = "hamza-wasl-app"
SCOPE = "https://www.googleapis.com/auth/firebase.messaging"


def main():
    version = os.environ.get("VITE_PARENT_APP_VERSION", "")
    audience = os.environ.get("APP_AUDIENCE", "")
    approval = os.environ.get("OTA_APPROVAL", "")
    raw_credentials = os.environ.get("PARENTS_FCM_SERVICE_ACCOUNT_JSON", "")
    target = os.environ.get("PARENTS_FCM_TEST_TOKEN", "").strip()

    if not raw_credentials or not target:
        print("FCM test signal skipped: both sender service-account JSON and test device token are required.")
        return 0
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
        raise ValueError("Invalid parents OTA version")
    if audience != "parent" or approval != "PUBLISH-PARENTS-OTA":
        raise ValueError("Refusing to send FCM outside explicitly approved parent OTA release")
    if any(char.isspace() for char in target) or len(target) > 4096 or len(target) < 20:
        raise ValueError("Invalid private test device token")

    config = json.loads(raw_credentials)
    if config.get("type") != "service_account" or config.get("project_id") != PROJECT:
        raise ValueError("Sender account must belong to the established Hamza Wasl Firebase project")

    # Sign/refresh a short-lived OAuth2 access token with the private service
    # account. The credential must never be embedded in Android/OTA assets.
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request
    creds = service_account.Credentials.from_service_account_info(config, scopes=[SCOPE])
    creds.refresh(Request())

    payload = {
        "message": {
            "token": target,
            # Data-only for foreground OTA refresh; no unwanted school-wide
            # notification banner. Background delivery is OS-dependent.
            "data": {
                "type": "parents_ota_update",
                "audience": "parent",
                "version": version,
            },
            "android": {"priority": "HIGH"},
        }
    }
    request = urllib.request.Request(
        f"https://fcm.googleapis.com/v1/projects/{PROJECT}/messages:send",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode("utf-8"))
            if not isinstance(data.get("name"), str):
                raise RuntimeError("FCM accepted response lacks message identifier")
    except urllib.error.HTTPError as exc:
        # Do not echo the response body: it might contain test token information.
        raise RuntimeError(f"FCM HTTP v1 send failed with status {exc.code}") from None

    print(f"FCM parent-only OTA signal accepted for private test device (version {version}).")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        # Avoid printing credential or token values in exception messages.
        print(f"FCM test sender failed ({type(exc).__name__}).", file=sys.stderr)
        sys.exit(1)
