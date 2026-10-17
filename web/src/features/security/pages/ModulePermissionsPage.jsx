import PermissionTree from '../components/PermissionTree';
import PermissionGroupsPage from '../components/PermissionGroupsPage';
import React, { useEffect, useMemo, useState } from 'react';
import ManagementFrame from '../../../shared/ui/ManagementFrame';
import VirtualDataTable from '../../../shared/ui/VirtualDataTable';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import Select from '../../../shared/ui/Select';
import Textarea from '../../../shared/ui/Textarea';
import Tabs from '../../../shared/ui/Tabs';
import SearchInput from '../../../shared/ui/SearchInput';
import { useAuth } from '../../../shared/hooks/useAuth';
import { securityService } from '../../../services/security/security.service';

const defaults = ['view', 'create', 'update', 'delete', 'import', 'export'];
const labels = { view: 'Xem', create: 'Thêm', update: 'Sửa', delete: 'Xóa', import: 'Nhập dữ liệu', export: 'Xuất dữ liệu', approve: 'Duyệt', publish: 'Xuất bản' };
const columns = [{ id: 'key', label: 'Mã phạm vi quyền', width: 150 }, { id: 'name', label: 'Tên phạm vi quyền', width: 240 }, { id: 'actions', label: 'Quyền chức năng', width: 340 }, { id: 'enabled', label: 'Trạng thái', width: 120 }, { id: 'operations', label: 'Thao tác', width: 150 }];
export default function ModulePermissionsPage() {
 const {hasPermission}=useAuth();
 const [tab,setTab]=useState('tree');
 const tabs=[{id:'tree',label:'Module & Chức năng'},{id:'modules',label:'Đăng ký quyền chức năng'},...(hasPermission('permissions:view')?[{id:'groups',label:'Nhóm quyền & Thành viên'}]:[])];
 return tab==='groups'?<PermissionGroupsPage tabs={tabs} onTabChange={setTab}/>:<ModuleRegistry tab={tab} tabs={tabs} onTabChange={setTab}/>;
}
function ModuleRegistry({tab,tabs,onTabChange}) {
  const { hasPermission } = useAuth();
  const [hierarchy,setHierarchy]=useState([]);
  const [modules, setModules] = useState([]), [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [dialog, setDialog] = useState(null), [draft, setDraft] = useState(null), [importText, setImportText] = useState(''), [extraActions, setExtraActions] = useState('');
  const [target, setTarget] = useState(''), [moduleKey, setModuleKey] = useState(''), [actions, setActions] = useState([]), [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const load = async () => {
    const data = await securityService.modules(); setModules(data.modules); setHierarchy(data.hierarchy||[]);
    if (hasPermission('permissions:view')) { const data = await securityService.users(); setUsers(data.users); }
  };
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { setActions(users.find(u => u.id === target)?.grants.filter(g => g.module === moduleKey).map(g => g.action) || []); }, [target, moduleKey, users]);
  const run = async operation => { if (busy) return; setBusy(true); setError(''); setMessage(''); try { await operation(); await load(); setDialog(null); setMessage('Đã lưu thay đổi trên hệ thống.'); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const openEditor = module => {
    if (module && !hasPermission('modules:update')) return;
    setError('');
    setDraft(module ? { ...module, actions: [...module.actions] } : { key: '', label: '', actions: defaults, enabled: true, required_actions: ['view'] });
    setExtraActions(module ? module.actions.filter(a => !labels[a]).join(', ') : '');
    setDialog(module ? 'edit' : 'create');
  };
  const close = () => { if (!busy) { setDialog(null); setError(''); } };
  const save = e => {
    e.preventDefault();
    if (dialog === 'create' || dialog === 'edit') {
      const module = { ...draft, actions: [...draft.actions.filter(a => labels[a]), ...extraActions.split(',').map(a => a.trim()).filter(Boolean)] };
      return run(() => dialog === 'edit' ? securityService.update(module) : securityService.create(module));
    }
    if (dialog === 'delete') return run(() => securityService.remove(draft.key));
    if (dialog === 'grant') { if (!target || !moduleKey) return setError('Vui lòng chọn tài khoản và module.'); return run(() => securityService.grant(target, moduleKey, actions)); }
    try { const data = JSON.parse(importText); if (!Array.isArray(data.modules)) throw new Error('JSON cần có mảng modules.'); run(() => securityService.import(data.modules)); } catch (e) { setError(e.message); }
  };
  const exportModules = async () => { try { const data = await securityService.export(); const blob = new Blob([JSON.stringify({ modules: data.modules.filter(m => !m.system) }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'skillhub-modules.json'; link.click(); URL.revokeObjectURL(url); } catch (e) { setError(e.message); } };
  const selectedModule = modules.find(m => m.key === moduleKey);
  const rows = useMemo(() => modules.filter(m => `${m.key} ${m.label}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')) && (!status || String(m.enabled) === status)).map(m => ({ ...m, id: m.key, name: m.label })), [modules, search, status]);
  const required = draft?.required_actions || ['view'];
  return <ManagementFrame header={<><Tabs tabs={tabs} activeTab={tab} onChange={onTabChange} /><div className="management-actions flex flex-wrap gap-2 pb-2">
    {hasPermission('permissions:update') && <Button size="sm" variant="outline" disabled={loading || busy} onClick={() => { setError(''); setDialog('grant'); }}>Phân quyền tài khoản</Button>}
    {hasPermission('modules:import') && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setError(''); setDialog('import'); }}>Nhập JSON</Button>}
    {hasPermission('modules:export') && <Button size="sm" variant="outline" disabled={loading || busy} onClick={exportModules}>Xuất JSON</Button>}
    {hasPermission('modules:create') && <Button size="sm" disabled={busy} onClick={() => openEditor(null)}>Thêm module</Button>}
  </div></>} filters={tab==='tree'?<>{loading&&<span role="status" className="text-xs">Đang tải module…</span>}{error&&!dialog&&<p role="alert" className="text-sm text-red-600">{error}</p>}</>:<><div className="w-full sm:w-64"><SearchInput size="sm" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã hoặc tên module…" /></div><Select size="sm" className="w-40" aria-label="Lọc trạng thái" value={status} onChange={e => setStatus(e.target.value)} options={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Tạm ngưng' }]} />{loading && <span role="status" className="text-xs text-slate-500">Đang tải…</span>}{error && !dialog && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}{message && <p role="status" className="w-full text-xs text-emerald-700">{message}</p>}</>} status={tab==='tree'?null:<><strong>Module & Phân quyền</strong><span>{rows.length} / {modules.length} module đã đăng ký API</span></>}>
    {tab==='tree'?<div className="flex-1 min-h-0"><PermissionTree hierarchy={hierarchy} modules={modules} value={[]} disabled fill /></div>:<VirtualDataTable columns={columns} rows={rows} onOpen={openEditor} renderCell={(column, row) => column.id === 'operations' ? <div className="flex gap-3">{hasPermission('modules:update') && <button className="text-emerald-700 dark:text-emerald-400" onClick={() => openEditor(row)} aria-label={`Sửa ${row.label}`}>Sửa</button>}{!row.system && hasPermission('modules:delete') && <button className="text-red-600" onClick={() => { setDraft(row); setError(''); setDialog('delete'); }}>Xóa</button>}</div> : column.id === 'name' || column.id === 'key' ? <button type="button" className="text-left text-emerald-700 dark:text-emerald-400 hover:underline" disabled={!hasPermission('modules:update')} onClick={() => openEditor(row)}>{row[column.id]}{column.id === 'name' && row.system && <span className="block text-[10px] text-slate-400 mt-1">Module hệ thống</span>}</button> : column.id === 'actions' ? <span className="line-clamp-2 leading-5" title={row.actions.join(', ')}>{row.actions.map(a => labels[a] || a).join(' · ')}</span> : column.id === 'enabled' ? (row.enabled ? 'Hoạt động' : 'Tạm ngưng') : row[column.id]} />}
    <Modal open={!!dialog} onClose={close} title={{ create: 'Thêm module', edit: 'Sửa nhóm chức năng', import: 'Nhập module', grant: 'Cấp quyền chức năng', delete: 'Xóa module' }[dialog] || ''} size="lg" density="comfortable" footer={<><Button size="sm" variant="outline" disabled={busy} onClick={close}>Hủy</Button><Button size="sm" form="security-form" type="submit" loading={busy}>{dialog === 'delete' ? 'Xác nhận xóa' : 'Lưu thay đổi'}</Button></>}>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      <form id="security-form" className="space-y-5" onSubmit={save}>
        {(dialog === 'create' || dialog === 'edit') && <><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input density="comfortable" label="Mã module" required disabled={dialog === 'edit' || busy} value={draft?.key || ''} onChange={e => setDraft({ ...draft, key: e.target.value })} placeholder="training" /><Input density="comfortable" label="Tên nhóm chức năng" required maxLength={120} disabled={busy} value={draft?.label || ''} onChange={e => setDraft({ ...draft, label: e.target.value })} /></div>
          {draft?.system && <p className="text-xs leading-5 text-slate-500">Module hệ thống: có thể đổi tên và bổ sung quyền. Mã, trạng thái và các quyền cốt lõi được giữ cố định.</p>}
          <fieldset disabled={busy}><legend className="text-sm font-medium mb-3">Quyền chức năng</legend><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Object.keys(labels).map(a => <label key={a} className="flex gap-2 items-center text-sm"><input className="accent-emerald-600" type="checkbox" disabled={required.includes(a)} checked={!!draft?.actions.includes(a)} onChange={e => setDraft({ ...draft, actions: e.target.checked ? [...draft.actions, a] : draft.actions.filter(v => v !== a) })} />{labels[a]}{required.includes(a) && <span className="text-slate-400 text-[10px]">Cốt lõi</span>}</label>)}</div></fieldset>
          <Input density="comfortable" label="Quyền mở rộng" disabled={busy} value={extraActions} onChange={e => setExtraActions(e.target.value)} placeholder="Ví dụ: assign, archive" />
          <Select size="lg" label="Trạng thái" aria-label="Trạng thái module" disabled={!!draft?.system || busy} value={String(draft?.enabled)} onChange={e => setDraft({ ...draft, enabled: e.target.value === 'true' })} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Tạm ngưng' }]} />
        </>}
        {dialog === 'import' && <Textarea label="Dữ liệu JSON (tối đa 50 module)" required rows={10} disabled={busy} value={importText} onChange={e => setImportText(e.target.value)} placeholder={'{"modules":[{"key":"training","label":"Đào tạo","actions":["view","create"],"enabled":true}]}'} />}
        {dialog === 'delete' && <p className="text-sm">Xóa module <strong>{draft?.label}</strong> và các quyền đã cấp cho module này?</p>}
        {dialog === 'grant' && <><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Select size="lg" label="Tài khoản" aria-label="Chọn tài khoản" disabled={busy} searchable value={target} onChange={e => setTarget(e.target.value)} options={users.filter(u => u.role !== 'admin').map(u => ({ value: u.id, label: `${u.username} · ${u.name}` }))} placeholder="Chọn tài khoản" /><Select size="lg" label="Module" aria-label="Chọn module" disabled={busy} searchable value={moduleKey} onChange={e => setModuleKey(e.target.value)} options={modules.filter(m => m.enabled).map(m => ({ value: m.key, label: m.label }))} placeholder="Chọn module" /></div><fieldset disabled={busy || !selectedModule}><legend className="text-sm font-medium mb-3">Quyền được cấp</legend><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{selectedModule?.actions.map(a => <label key={a} className="flex gap-2 text-sm"><input className="accent-emerald-600" type="checkbox" checked={actions.includes(a)} onChange={e => setActions(e.target.checked ? [...actions, a] : actions.filter(v => v !== a))} />{labels[a] || a}</label>)}</div></fieldset></>}
      </form>
    </Modal>
  </ManagementFrame>;
}
