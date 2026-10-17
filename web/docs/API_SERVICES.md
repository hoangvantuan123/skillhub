# Frontend API services

Configured in web/.env.local (copy from .env.example):

    VITE_API_BASE_URL=http://localhost:8081/api
    API_PROXY_TARGET=http://127.0.0.1:8081

Restart Vite after changing environment files. Open http://localhost:5173/login when using the localhost API URL: cookie authentication requires the frontend and API to use the same hostname. For 127.0.0.1 frontend, change API base URL to http://127.0.0.1:8081/api. For production, use HTTPS and configure the exact frontend origin in SKILLHUB_ORIGINS; VITE_* is public browser configuration, never secrets.

Structure:

    src/shared/config/api.js               API base URL, timeout, URL builder
    src/services/http/httpClient.js        fetch, credentials, timeout, errors
    src/services/auth/auth.endpoints.js    register/login/refresh/logout/me/history paths
    src/services/auth/auth.service.js      auth operations, token state, refresh retry
    src/app/providers.jsx                 React state; calls authService

Login request: POST http://localhost:8081/api/auth/login
Body: { "username": "your-account", "password": "your-password", "remember": true }

Refresh token stays in an HttpOnly cookie. Access token stays in service memory. Browser talks HTTP/JSON to the gateway; gateway talks gRPC internally.

Alternative same-origin mode: set VITE_API_BASE_URL=/api and keep API_PROXY_TARGET set to the backend. Vite dev/preview will proxy /api. In deployment, configure the web server proxy separately.

The old shared/api/client.js still serves mock course/exam data. It is separate from the real authService; those business APIs are not implemented yet.

## Navigation organization

The compact rail now has Overview followed by Learning, Training management, System administration. A group opens a named list instead of displaying every function as a separate icon. Empty groups are omitted after permission/role filtering. Learning order: courses, exams, practice, knowledge. System order: accounts, module permissions, catalogs. Learner accounts have no training/system groups; account information and login history are available from the avatar. Training reports are reserved for exam managers/admins (the learner results business screen is not implemented). Mobile uses expandable in-drawer groups. Grouping does not grant backend permissions.

## Fixed secondary navigation

The selected rail group now renders an adjacent fixed 232px secondary column on desktop. The main workspace reserves its width instead of displaying a floating overlay. There is a Collapse submenu control. Mobile keeps nested links inside the drawer. User management now follows shared ManagementFrame/Tabs/VirtualDataTable/Modal/Input/Select with the real people/group service; the old mock provisioning controls were removed.

## User table and filter framework

Accounts/groups/directory screens use SearchInput + dynamic FilterToggleMenu (enabled fields on the same toolbar), compact Select controls, 56px VirtualDataTable rows, sortable headers, and a bottom page-size/page/count bar. Fields can be toggled on/off without separate filter dialogs or remove crosses. User filter fields: department, position, job role, permission group, enabled state. Group filters: organization criteria and enabled state; directory filters: kind. Search matches displayed organization names with Vietnamese diacritic-insensitive comparison. Selection is preserved across pages; select-all adds/removes only visible page rows. Bulk actions are capped at 200 selected accounts. Row clicks still open the corresponding modal, while checkbox/action controls remain independent.
