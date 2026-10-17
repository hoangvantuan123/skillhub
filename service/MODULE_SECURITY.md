# Module and permission structure

## Account popup and storage

The six accounts previously shown were demo mockUsers, not saved login history. AccountLoginHistory now calls POST /api/auth/history; BE derives the user from a verified JWT and an active database session. User IDs in request data cannot select another user's history. The popup shows up to 50 events for the current account, timestamp/result/IP/device. It does not store account history or tokens in browser storage. Old demo current-user localStorage keys are removed on startup. Theme and unrelated offline demo data still use localStorage.

Passwords: bcrypt. Refresh token: random, only SHA-256 hash in skillhub_sessions. Access token: short-lived JWT in JavaScript memory; JWT is signed, not encrypted. Refresh cookie is HttpOnly and SameSite Strict, Secure=true in HTTPS deployments.

Session/login-event IP and User-Agent: AES-256-GCM with random nonce and authenticated ciphertext (enc1 format). SKILLHUB_HISTORY_KEY is a separate 32-byte key encoded as 64 hex characters in the backend .env only. Existing metadata is encrypted transactionally at startup; rate limiting uses a keyed HMAC index. Back up this key securely; deleting/changing it without re-encryption makes existing history unreadable. This is field encryption, not encryption of the entire PostgreSQL database or user-name columns. Production transport still requires HTTPS.

## Files

- BE internal/skillauth/modules.go: module manifest validation, registry CRUD/import/export, user grants, effective permissions, server checks, transactional security audit.
- BE internal/skillauth/metadata.go: encryption and migration.
- BE internal/skillauth/integration_test.go: opt-in integration checks with temporary fixtures and cleanup.
- FE services/security/security.service.js: actual backend operations.
- FE features/security/pages/ModulePermissionsPage.jsx: /admin/modules.
- FE features/security/module-template/modules.example.json: importable manifest template.

## Module manifest

A module has key, label, enabled, actions. Default actions: view/create/update/delete/import/export. Additional action names (approve/publish/etc.) can be registered. Key/action codes are validated; view is required. Adding a module automatically registers these permission keys as module:action. System modules allow label changes and extra actions; core actions, enabled status and deletion remain protected. Import is all-or-nothing (1–50 modules); duplicate/invalid rows fail the whole transaction. Export is checked on the backend as modules:export.

## API and authorization

POST /api/auth/{modules,module_create,module_update,module_delete,module_import,module_export,grants,grant_save}
Authenticated requests use the normal access-token service. Body: {payload: ...}.
Create/update payload: module manifest. Delete: {key}. Import: {modules:[...]}. Grant: {user_id,module,actions:[...]}; replaces the selected user's grants for one module; empty actions revokes them. Unknown actions are rejected; permissions cannot be self-granted without permissions:update. Admin accounts are excluded from grant editing. Permissions are loaded from DB for every backend request; UI visibility is not a security boundary.

Registry administration permissions are modules:view/create/update/delete/import/export and permissions:view/update. Every operation writes an audit entry with actor, operation, resource, timestamp. Disabled module grants are ineffective; deleting a module cascades its grants. Admin role gets actions from enabled manifests. No real account is elevated automatically. On 2026-10-17 the user explicitly approved promoting the imported admin and superadmin accounts to the SkillHub admin role. Both promotions were applied and recorded in skillhub_security_audit.

This registers modules and their authorization contracts, not arbitrary business CRUD implementations. Existing learning/question screens still use demo data; register a module then implement its domain service and enforce the matching module:action on that backend operation. Do not treat the demo domain APIs as production-secured simply because a manifest exists.

## Verification

From service/server-core: $env:SKILLHUB_INTEGRATION='1'; go test ./internal/skillauth ./cmd/skillhub -count=1 -v
Fixtures are removed after the integration test. Checks include encrypted metadata round trip and wrong-key rejection, manifest validation, view/create denial, privilege-escalation denial, create/update/delete, grant propagation/revocation, invalid grants, atomic import rollback, system-module protection, and history isolation.


2026-10-17 system-module editor: system modules can now be opened via code/name or Edit. Their labels and additional actions are editable; server validates that core actions remain present and system modules stay enabled. Deletion remains prohibited. The UI uses the standard shared Input, Select, Textarea, Modal, SearchInput and Tabs. required_actions is returned by the server for read-only core checkboxes. Regression test: SKILLHUB_EXISTING_ADMIN_TEST=1 go test ./internal/skillauth -run TestExistingAdminModuleUpdate -count=1 -v; uses the existing authorized admin, restores original module values, and creates no admin identity.


## People and permission groups (2026-10-17)

`/admin/users` now uses PostgreSQL via `people.service.js`, replacing the old mock user page. Tabs: Accounts, Permission groups, Organization & job roles. Usernames and names open a detail/edit dialog. Checkboxes support selecting up to 200 users for bulk organization updates or group assignment/removal. New accounts created here are learners; the UI cannot change the protected system admin role. Disabling a non-admin account revokes its sessions. Admin/self disabling is rejected.

Tables: skillhub_directory(kind/key/label), skillhub_permission_groups, skillhub_group_permissions, skillhub_group_members; user metadata columns department/position/job_role. Job role is organization metadata, separate from system admin role. All state persists on BE, never in localStorage. No existing real users have been assigned to newly created groups automatically by this change.

A group's members are manual assignments OR users matching all its nonempty organization criteria (AND). Empty criteria means manual only. Effective permissions are the union of baseline learner permissions, direct user grants, enabled group grants; disabled/removed module actions are excluded. There is no explicit-deny layer. Removing a manual assignment does not remove a matching automatic rule; the UI explains this. Disabling/deleting a group revokes that source of permissions, preserving direct grants or other groups.

POST /api/auth/{people,user_create,user_update,directory_save,group_list,group_save,group_delete,group_members}. All require a verified active session; users:* or permissions:* rights are checked on every call. Bulk updates and group saves are transactional and audited. User lists never return hashes or passwords.

Workflow: create department/position/job-role catalogs; create a group and choose module actions; optionally define organization criteria; select accounts and use Assign group or Update organization. Group edits affect all matching members on the next BE request. FE refreshes the current user permissions periodically or on reload. Business module handlers must still enforce their action permissions; this does not create missing course/exam domain APIs.

QA: `SKILLHUB_PEOPLE_TEST=1 go test ./internal/skillauth -run TestPeopleGroupsIntegration -count=1 -v`. Uses the already-authorized admin and disposable learner fixtures plus a QA-only module; no admin identity created/elevated. Tests automatic AND matching, bulk assignment, live group edit, manual removal versus automatic rules, rollback on invalid user, invalid permissions, admin lock protection, no password leakage and group deletion. Fixture users/groups/module/catalogs are removed; audit entries retained. Browser component QA uses /tests/ui/people-preview.html with clearly labeled in-memory fixture adapters, no DB calls; actual backend DB integration is tested separately.

People/group browser QA completed: username opens editable detail; saved name updates table; selecting all exposes bulk actions; group Select opens in modal and selection saves across two fixture users; group name opens the permission matrix; 390px viewport renders the group dialog as one column with fixed footer. UI fixture adapters are in-memory only. DB integration passed separately and restored disposable fixtures.
