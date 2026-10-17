# SkillHub authentication

Run from service/server-core (separate entry point from the legacy ERP server):

    go run ./cmd/skillhub

Uses the existing .env POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_PORT. Host is localhost, database is skillhub. Automatically creates the database if missing (requires CREATEDB) and creates auth tables on startup. Does not migrate legacy ERP accounts.

Add to .env:

    SKILLHUB_JWT_SECRET=<random secret of at least 32 characters>
    SKILLHUB_ORIGIN=http://localhost:5173
    SKILLHUB_COOKIE_SECURE=false

Use COOKIE_SECURE=false only for local HTTP. For deployment use HTTPS, COOKIE_SECURE=true, the exact frontend origin, and proxy /api/auth/ to 127.0.0.1:8081. gRPC is private on 127.0.0.1:60052; HTTP gateway invokes the protobuf service in proto/skillhub.proto. Both listeners must remain private behind the web proxy.

Frontend: cd web; npm run dev. Open http://localhost:5173. Registration requires a valid email, name, password 12–72 bytes. Self registration always assigns learner. Access token lasts 10 minutes in memory; refresh token is random, hashed in DB, rotated transactionally with replay revocation. Refresh expiry is 24 hours or 30 days when Remember is selected. Logout revokes the session. Never put tokens in localStorage.

POST /api/auth/register, login, refresh, logout, me, history. JSON bodies; cookies and exact Origin required. me/history require Authorization: Bearer <access token>. history returns last 50 login attempts for the authenticated user with IP, user agent, time, success. IP comes from RemoteAddr; forwarded IP headers are deliberately ignored. Behind a reverse proxy this is the proxy IP; configure a trusted-proxy design before claiming end-user IP attribution. IP does not establish geographic location.

Learning/course/question data still uses the existing frontend mocks. This change implements authentication; it does not implement those domain APIs or secure the legacy ERP entry point. Protect future learning APIs with the same session validation and server-side authorization. Do not expose legacy ERP services as SkillHub APIs.

Verified locally: frontend production build, Go package tests, PostgreSQL startup and automatic schema creation, registration, authenticated me, login history, refresh rotation, logout revocation. Verification created one learner account with email auth-check-0a1120f2d85e44adabffe48300569c60@example.test (random password not retained).

Update: registration/login accept username (3–64 ASCII letters/digits or . _ @ + -), no email required. Legacy email accounts still work. Use scripts/run.ps1 or root start-api.ps1 to start the SkillHub entry point. Vite dev and preview both proxy /api and use strict port 5173. Local HTTP accepts both localhost:5173 and 127.0.0.1:5173; production uses explicit SKILLHUB_ORIGINS.

Legacy account import (completed)
--------------------------------
Source: POSTGRES_DB=GsHub, table _ERPUsers. Destination: skillhub_users.
Command from service/server-core: go run ./cmd/import-skillhub-users
11 users imported; bcrypt Password2 copied without plaintext conversion. Existing destination accounts are skipped; rerun verified inserted=0, skipped=11. Source DB unchanged.
Login enabled only when StatusAcc=false, CheckPass1=true and Active=true. Currently admin and superadmin are enabled; 9 imported users are disabled. Role defaults to learner: ERP permissions have not been mapped to SkillHub admin permissions.

Browser verification: created ui_test_1792169685951 using the real registration form at http://localhost:5173/login, reached /app showing the new name, reloaded and remained signed in, confirmed bcrypt record in PostgreSQL. Test password was random and is not documented. Existing source account passwords were not known, so a password login for imported admin was not performed.

2026-10-17: User explicitly approved SkillHub administrator access for both imported admin and superadmin accounts. Applied role=admin for those two enabled GsHub accounts and recorded authorized_admin_bootstrap audit entries. Passwords were not changed. Effective permissions are read from DB on each request; frontend refreshes /me periodically and on reload.
