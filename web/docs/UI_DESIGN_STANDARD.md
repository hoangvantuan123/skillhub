# Management interface standard

Reference implementation: `/manage/questions`.

## Shared building blocks

- `src/shared/ui/ManagementFrame.jsx`: full-height management shell, with header, filters, body and status slots. The body owns scrolling; do not add outer page padding.
- `src/shared/ui/VirtualDataTable.jsx`: custom DOM table, visible rows plus overscan, configurable rows (44px default), 36px sticky header, resizable columns, selection and formatter callback. No grid library or canvas needed. Use `formatCell(column, row)` for domain labels; filter against the same values.
- `src/shared/ui/FilterToggleMenu.jsx`: icon-only filter button with checkbox menu. Toggling a field adds/removes its control from the toolbar. No remove crosses on controls; no separate all-fields filter form.
- `src/shared/ui/Modal.jsx`: common flat dialog shell, fixed header/footer, scrolling content, focus containment, Escape and focus restoration.
- `Button`, `Select`, `SearchInput`, `Input`: shared controls; extend them instead of creating separate visual systems.

## Placement

1. Tabs on the left and actions on the right of the same header row. Wrap on narrow screens.
2. Search, enabled filter controls, then the icon-only filter menu in one wrapping toolbar.
3. The table fills the remaining space. Do not show permanent instructional text above it.
4. Bottom status bar: screen name (for example Ngân hàng câu hỏi), counts/selection, then page size and pagination. Avoid a duplicate large title above the tabs.

## Appearance

White/slate-950 surface, slate-100/slate-900 table and modal headers, slate-200/slate-800 1px borders. Emerald focus/active accents. Small 6–8px corner radius. No decorative circles, heavy shadows or oversized cards. Preserve dark mode. Table text and toolbar controls are compact (12px, 32px controls). Content can be selected/copied on management screens; exam restrictions are scoped to exam-taking screens.

## Dialog densities

Use `density="compact"` for column settings and data previews. Use `density="comfortable"` for create/edit/registration forms: 14px labels and inputs, 40px input controls, 32px action buttons with 12px text, 24px content padding (16px on mobile). Keep the same flat shell. Do not shrink form text to match dense tables.

Use `size="lg"` for simple forms such as folder creation and `size="xl"` for account registration. Width stays within the viewport. Place actions in `footer`; submit forms with the button's `form` attribute. Keep long content readable and copyable; use one column on mobile and two where useful on larger screens.

## Example

```jsx
<ManagementFrame
  header={<><Tabs /> <Actions /></>}
  filters={<><SearchInput size="sm" /><EnabledFilters /><FilterToggleMenu columns={fields} filters={filters} onToggle={toggleField} /></>}
  status={<><span>Screen name · Total: {rows.length}</span><Pagination /></>}
>
  <VirtualDataTable columns={columns} rows={rows} formatCell={formatCell}
    selectedIds={selection} onSelectedIdsChange={setSelection}
    onOpen={openDetail} onSort={sort} />
</ManagementFrame>

<Modal open={open} onClose={close} title="Create item" size="lg"
  density="comfortable"
  footer={<><Button variant="outline" onClick={close}>Cancel</Button>
    <Button type="submit" form="create-item">Save</Button></>}>
  <form id="create-item" onSubmit={save}>...</form>
</Modal>
```

Validate builds after structural changes. Check narrow screens, both themes, long text, scrolling, resizing, filter toggle removal, keyboard focus and form submission. A successful build alone does not establish visual QA or measured performance.

Comfortable dialogs use a 760px form width (960px for xl) and up to 680px height, always capped at viewport minus 32px. Only the body scrolls. Select menus use fixed positioning inside the dialog portal, constrained to available viewport space, so scroll containers do not clip them.

## Dynamic attribute catalog

`src/features/catalog/services/attributeCatalog.js` owns catalog data. The current adapter uses browser localStorage (`skillhub_attribute_catalog_v1`); it is not a database integration. Replace `get(key)` and `save(key, draft)` with backend requests later, preserving their `{ data }` responses. Catalog shape: `{ key, label, options: [{ value, label, active }] }`. The initial registered attribute is `level`; default ISA-95 values are seed data, not form markup.

Use `useAttributeCatalog(key)` in consumers and `AttributeCatalogModal` to manage options. Codes are stable references, display labels may change, and disabled codes remain readable in old records. Validate codes on writes; future backend must enforce uniqueness, references, access permissions and validation too. Current management entry points are the question toolbar and the level field in the folder dialog. Folder, question editor, import and question table use the same source.

## Toast notifications

All screens must call `useToast().addToast(message, type, duration)`; do not mount additional toasters or use browser alert for operation feedback. The shared adapter is `src/shared/lib/notify.js`, with one `GooeyToaster` in `src/app/providers.jsx`.

- Types: `success` for completed operations; `info` for neutral updates; `warning` for recoverable conditions requiring attention; `error` for failed operations. Legacy `danger` maps to `error`.
- Strings use a standard Vietnamese title and render the message as the description. For specific feedback pass `{ title, description }`, for example `addToast({ title: 'Đã lưu câu hỏi', description: 'Nội dung mới đã được cập nhật.' }, 'success')`.
- Explain the outcome and a next action when needed. Do not claim success before the operation finishes. Keep titles short and descriptions concrete; do not include credentials or raw server errors.
- Success/info display for 4.5 seconds; warnings/errors for 6 seconds. Override only for content needing more reading time. Use inline validation for field errors; use dialogs for decisions requiring confirmation.
- Position: top right, maximum three visible, queue capped at five. Use subtle animation, progress, close button, Escape dismissal, mobile swipe, and synchronized light/dark theme. Respect reduced motion through the global stylesheet.
- The notification bell remains the persistent notification history; transient action feedback uses toast.

Notifications are currently disabled centrally via `NOTIFICATIONS_ENABLED = false` in `src/shared/lib/notify.js`. Keep them disabled until notification flows are explicitly requested. Existing callers remain compatible but produce no toast; inline form validation stays active.

## Loading states

Use `src/shared/ui/LoadingPage.jsx` for page loading, with a short task-specific `message`. Routes use React lazy imports and Suspense; loaded modules are reused for subsequent visits in the same session. This caches page code, not API data. Do not add artificial delays or a separate /loading redirect route. Preserve the workspace shell while route code loads. For blocking submissions such as login, use `fullScreen`, prevent duplicate submission, and always clear pending state on errors. Data-fetching screens must connect their own pending state; Suspense does not automatically track requests started in effects. Keep field errors inline and retain existing data during background refresh.

## Shared table density

`shared/lib/tablePreferences.js` owns row height (44px default, integer 36–64px), cached in IndexedDB `skillhub-ui-preferences`, store `settings`, key `table:<userId>`. Initialize from `main.jsx` and switch account scope from `Providers`; use `useTablePreferences()` for virtual/canvas row geometry. Native tables inherit CSS variables from the same store. Avoid per-screen fixed heights. Cài đặt cá nhân → Hiển thị & Múi giờ saves only after transaction completion, reports storage failures inline, and offers a reset draft that must be saved. Preferences are local to this browser/origin. Native rows can grow for wrapped content and comfortable form controls.

## Personal settings

`/app/settings` is available to every authenticated user; `/admin/settings` redirects there. Keep it in the utility rail, outside administration groups, and hide contextual subnavigation on this route. Preferences belong to the current account in this browser. The activity tab uses authenticated `auth/history` (server filters by user ID, latest 50 login events), never global mock audit data. Use the standard full-height virtual table, filter toolbar, resizable columns, sorting, footer pagination and detail modal. Profile updates use authenticated `profile_update` and password changes use `password_change`; organization and authorization fields remain read-only.

## Filter dropdown states (required)

All categorical filters use shared `Select`, including status, level, role and department. Never switch to a text input based on option count. Free-text and date-range filters keep controls appropriate to their data.

- Closed: compact 32px trigger for table toolbars; show the selected label or “Tất cả …”. Opening does not change the filter.
- Open: flat white/slate-900 popover, 1px border, 8px radius, constrained to the viewport; search stays at the top while options scroll below. The search is ALWAYS visible, including lists with one or two items. Do not disable it with `searchable={false}`.
- Search: focus the search input on opening. Match labels and codes, case-insensitively and with or without Vietnamese accents. Typing only narrows choices; selecting a choice applies the filter. Clearing search does not clear the selected value.
- Option: full-width text row, subtle gray hover/keyboard highlight; selected value has a check on the right and `aria-selected`. Preserve disabled values as readable but unselectable.
- “Tất cả …”: one empty-value option to reset the filter, without duplicating an existing empty option. No extra remove cross on toolbar filter controls.
- Empty result: “Không tìm thấy tùy chọn nào”; keep search editable. Do not silently reset the applied filter.
- Keyboard: Arrow Up/Down navigate enabled options; Enter selects; Escape closes and returns focus; Tab closes and continues focus order. Search and selection work in dialogs without closing the parent dialog.
- Menu placement: portal into the enclosing dialog or document, fixed positioning, automatic up/down placement; reposition on scroll/resize. Support narrow screens, long labels and both themes.
- Filter field picker: keep its icon-only trigger and checkbox behavior, with a search field above the field list. This picker toggles which filters appear; it does not select filter values.

Implementation: `shared/ui/Select.jsx`, `shared/ui/FilterToggleMenu.jsx`, and `shared/lib/searchOptions.js`.

## Permission module tree

`/admin/modules` opens the menu/function tree, with separate tabs for module registration and permission groups/membership. `features/security/permissionTree.js` maps the actual menu routes to registered module keys; `PermissionTree` is reused in both group editors. Search tree labels, paths and actions. Branch checkboxes show partial selection and operate on visible enabled descendants; enabling a write action includes view, clearing view clears dependent actions.

Groups are stored by existing group APIs. The learner preset is a draft (learning, exams, attempts, practice, knowledge) restricted to registered enabled read/take/run capabilities; it never grants authoring or administration. A user can belong to multiple groups. Effective permissions are the union of default capabilities, direct grants and enabled matching groups; removing a direct membership does not remove organization-derived membership. `group_members` accepts legacy `key` or batch `keys` (1–50), and 1–200 user IDs. The whole operation and audit entry use one server transaction.

New core menu modules are seeded idempotently by `ModuleSchema` on API startup. Frontend route and menu visibility use their view capability. Registering a module or an action does not implement its business API; each new backend operation must enforce its own capability. Personal settings remain available to all signed-in users.

### Permission inventory as folder tables

Render the permission inventory using the question-bank folder-table pattern, not nested accordion cards: root menu groups → menu/module → child screen/tab and action rows. Use `VirtualDataTable`, breadcrumbs, Back, search, optional categorical filters, resizable columns and footer pagination. Reuse the same explorer inside group-edit dialogs with selection checkboxes.

Inventory must include every configured navigation menu even when the backend registry is incomplete. Show missing modules as “Chưa đăng ký”, never silently hide or grant them. Distinguish menu inventory from registered API module count. Include the General/Personal branch (dashboard, settings, notifications), marked “Mọi tài khoản” without grant controls. Child screens/tabs describe actual routes; screens sharing a module also share its capability keys and are not represented as independent backend permissions. Custom registered modules remain visible under the supplemental branch.

## Personal profile and display forms

Use a responsive profile layout with avatar/identity sidebar, personal-information form, organization summary, effective groups/permissions, and a separate password dialog. The profile API only updates the authenticated user; contact email does not change the login identifier. Avatar uploads are locally resized to 160px JPEG, validated by the server, and persisted with the profile. Never cache passwords in browser storage or include them in audit data. Password changes verify the current password, throttle failures, and revoke other sessions in one transaction. Short dialogs can use `fitContent` on the shared Modal with comfortable controls and viewport height limits.

Display settings use separate density/timezone panels and a live draft preview; saving retains per-user IndexedDB scope. Sample table rows must be clearly labeled as illustrative.
