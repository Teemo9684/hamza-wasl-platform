# Architecture rules

- Release verification scripts perform read-only HTTP checks against an explicitly configured backend origin; they must never activate or publish releases, so testing cannot change rollout state.
- One-off admin recovery must validate both the caller's identity and server-side admin role, consume a securely collected password only on the backend, and remove the deployed recovery function and temporary secret after verification to avoid a lasting recovery surface.