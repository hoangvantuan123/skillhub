# Management interface standard

Reference implementation: `/manage/questions`.

## Shared building blocks

- `src/shared/ui/ManagementFrame.jsx`: full-height management shell, with header, filters, body and status slots. The body owns scrolling; do not add outer page padding.
- `src/shared/ui/VirtualDataTable.jsx`: custom DOM table, visible rows plus overscan, 56px rows, 36px sticky header, resizable columns, selection and formatter callback. No grid library or canvas needed. Use `formatCell(column, row)` for domain labels; filter against the same values.
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
