# Security review before enabling three school apps

Read-only inspection of Lovable Cloud PostgreSQL on 2026-11-20. No production data or policies were modified.

## Verified

- RLS is enabled on `profiles`, `user_roles`, `students`, `parent_students`, `teacher_students`, `messages`, `grades`, `attendance`, and `homework`.
- `parent_students` has a parent-owned SELECT policy and an admin management policy.
- `user_roles` has a user-owned SELECT policy and an admin management policy.
- App-side route guards are not security boundaries. Each Supabase query/function must enforce authorization server-side.

## High-priority finding: permissive profile policy

At inspection time, `public.profiles` had a policy named **Require authentication for profiles** on command **ALL** with condition `auth.uid() IS NOT NULL`. As PostgreSQL RLS policies are permissive by default, this policy can OR together with stricter profile policies and allow broadly authenticated access. The exposed actions are also affected by table GRANTs, which must be audited separately.

**Do not run any policy change against the live Lovable Cloud database without a snapshot/backup, confirmed ownership, and end-to-end regression tests.**

Safe next actions:
1. Clone the schema to a separate test Lovable/Supabase project (no real student data).
2. Audit existing `GRANT`s, profile RLS policies, SECURITY DEFINER functions, RPC EXECUTE permissions, and Edge Function authorization.
3. In the **test environment**, remove or replace the broad `ALL` policy with narrowly scoped SELECT/INSERT/UPDATE/DELETE policies. Preserve registration/profile creation flows.
4. Test admin, approved parent, unapproved parent, teacher, other-parent access, and anonymous access with synthetic accounts.
5. Apply an approved migration to production only after backups and functional verification.

## Release gates

- Three separate deployment origins and Android application IDs
- Distinct role-specific PWA manifests
- Teacher account creation through an authenticated admin-only backend service (not browser service-role key)
- Isolated staging data for any write tests
- Independent OTA feeds and rollback plans; no shared pilot feed
- Full access-control and account-recovery test matrix
