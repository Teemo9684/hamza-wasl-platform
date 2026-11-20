# Architecture rules

- Release verification scripts perform read-only HTTP checks against an explicitly configured backend origin; they must never activate or publish releases, so testing cannot change rollout state.