#!/usr/bin/env python3
"""Private one-device FCM teacher notification test; no database access or broadcasts."""
import json,os,sys,urllib.request,urllib.error
from google.oauth2 import service_account
from google.auth.transport.requests import Request

def main():
    raw=os.environ["TEACHERS_FCM_SERVICE_ACCOUNT_JSON"]
    token=os.environ["TEACHERS_FCM_TEST_TOKEN"].strip()
    assert os.environ.get("APPROVAL")=="TEST-TEACHERS-FCM"
    assert 20 <= len(token) <= 4096 and not any(c.isspace() for c in token)
    service=json.loads(raw)
    assert service.get("type")=="service_account"
    assert service.get("project_id")=="hamza-wasl-app"
    creds=service_account.Credentials.from_service_account_info(
        service,scopes=["https://www.googleapis.com/auth/firebase.messaging"])
    creds.refresh(Request())
    payload={"message":{
        "token":token,
        "notification":{"title":"همزة وصل – الأساتذة","body":"رسالة تجريبية خاصة لاختبار الإشعارات الفورية."},
        "data":{"type":"teacher_test","audience":"teacher"},
        "android":{"priority":"HIGH"}
    }}
    request=urllib.request.Request(
        "https://fcm.googleapis.com/v1/projects/hamza-wasl-app/messages:send",
        data=json.dumps(payload).encode(),
        headers={"Authorization":"Bearer "+creds.token,"Content-Type":"application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(request,timeout=25) as response:
            assert json.loads(response.read()).get("name")
    except urllib.error.HTTPError as e:
        raise RuntimeError("FCM request failed: HTTP "+str(e.code)) from None
    print("FCM accepted one private teacher test message.")

if __name__=="__main__":
    try: main()
    except Exception as e:
        print("Teacher FCM test failed ("+type(e).__name__+").",file=sys.stderr)
        sys.exit(1)
