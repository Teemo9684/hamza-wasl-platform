"""Read-only release checks. Set PILOT_BACKEND_URL to the configured backend origin."""
import hashlib
import io
import json
import os
import unittest
import urllib.request
import zipfile

ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36"


class PilotReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.origin = os.environ["PILOT_BACKEND_URL"].rstrip("/")
        cls.bundle = cls.origin + "/storage/v1/object/public/app-updates/pilot%2F1.2.70%2Fhamza-wasl-pilot-update.zip"

    def check_update(self, channel):
        request = urllib.request.Request(
            self.origin + "/functions/v1/" + channel,
            data=json.dumps({"currentVersion": "1.2.69", "platform": "android"}).encode(),
            headers={"Content-Type": "application/json", "User-Agent": ANDROID_UA},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            self.assertEqual(response.status, 200)
            return json.load(response)

    def test_android_1269_receives_pilot_1270_and_exact_link(self):
        result = self.check_update("check-pilot-update")
        self.assertIs(result["hasUpdate"], True)
        self.assertEqual(result["version"], "1.2.70")
        self.assertEqual(result["bundleUrl"], self.bundle)

    def test_returned_bundle_downloads_anonymously_on_android(self):
        result = self.check_update("check-pilot-update")
        request = urllib.request.Request(result["bundleUrl"], headers={"User-Agent": ANDROID_UA})
        with urllib.request.urlopen(request, timeout=30) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["Access-Control-Allow-Origin"], "*")
            data = response.read()
        self.assertEqual(hashlib.sha256(data).hexdigest(), "fb85fd202d2fb65a4cc5b4eb911df116936526527fd789a05f71f3ae385000b0")
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            self.assertIsNone(archive.testzip())
            self.assertIn("index.html", archive.namelist())

    def test_parent_channel_remains_on_preexisting_release(self):
        result = self.check_update("check-app-update")
        self.assertEqual(result["version"], "1.2.391")
        self.assertEqual(result["bundleUrl"], self.origin + "/storage/v1/object/public/app-updates/bundle-1.2.391-1792197829939/bundle.zip")


if __name__ == "__main__":
    unittest.main()