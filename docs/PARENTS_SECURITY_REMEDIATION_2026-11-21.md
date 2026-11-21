# Parents-only hardening audit (2026-11-21)

Scope: parents preview frontend and shared Lovable Cloud PostgreSQL authorization rules. The administrator/teacher source branches, school records and OTA release channel were not changed. Database DDL was explicitly authorized by the owner; no student, user, message, grade or attendance rows were inserted, changed or removed.

## Changes applied to shared live database
- Removed the permissive `profiles` policy `Require authentication for profiles` which had unintentionally allowed any authenticated user to SELECT and UPDATE every profile and self-approve.
- Replaced own-profile UPDATE policy with approved-user-owned-record USING/WITH CHECK; retained administrators' management policy and own-profile SELECT.
- Restricted parent-side SELECT of students, attendance, grades, parent links, class schedules, homework and teacher links to approved accounts and linked children; retained administrator and teacher access.
- `link_parent_to_student` now requires `auth.uid() = _parent_id`, an unapproved profile and an authenticated caller. Additional children after approval must be verified/linked by administration rather than blindly attached by an ID.
- Added approved parent ability to delete **only own** parent-student links. Frontend verifies the deletion result.
- Public `check_student_exists` returns only a generic existence marker (no pupil names or UUIDs) to non-admin callers; administrators may still retrieve details. Public existence probing is **not fully mitigated**, and future enrolment must move to a rate-limited verified backend.
- Replaced public homework storage SELECT rules with an approved-authenticated-user policy, and restricted private achievement visibility to related parents/teachers and admins, while retaining public *featured* achievements. Homework storage authorization still needs an object-path relationship model before it can isolate every file by class/student.

## Frontend-only changes on `apps/parents-preview`
- Offline cache keys include authenticated user ID. Legacy unscoped parent cache is no longer read by this build.
- Parent registration stores national school ID in account metadata; registration precheck validates format locally, and pending parent-student links are completed on confirmed sign-in before account approval.
- Disabled self-service addition of extra children to approved accounts; explicit instruction to contact school administration is shown.
- Linked-child deletion verifies deleted rows, refreshes child list, and repairs selected child state.
- Message/document save operation no longer falsely reports failure if its *subsequent* notification fails; document deletion verifies the deleted row.
- Aligns parent password reset minimum length with signup policy.
- Adds static build assertions for cache/account isolation and operation feedback.

## Operational notes and follow-up gates
- The official `main` code was not edited. The **shared** database policy updates affect every client; registered parents require approval before reading pupil information. Manual admin approval should always confirm the claimed parent-student relationship; metadata and school number alone are not proof of guardianship.
- User-requested production release is **not yet approved**; the last published parents OTA remains v1.0.10.
- Native UI and OTA client testing with separate approved/unapproved parent accounts, and a verified safe administrative child-addition workflow, remain necessary. Successful GitHub frontend verification alone is not a runtime/RLS penetration test.

Additional live RLS refinements: document-request INSERT requires approved ownership; message INSERT prevents parents attaching unrelated student IDs. A pre-approval parent may claim at most one pending student link, requiring school verification before approval. The anonymous school-number lookup provides a generic existence marker for compatibility with the existing combined app, but cannot return a pupil's name or UUID. Production code changes in the original app were deliberately not made.
