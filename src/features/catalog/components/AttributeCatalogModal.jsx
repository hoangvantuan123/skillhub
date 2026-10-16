import React, { useEffect, useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import { Plus } from 'lucide-react';
import { attributeCatalog } from '../services/attributeCatalog';

export default function AttributeCatalogModal({ open, onClose, attributeKey = 'level' }) {
  const [draft, setDraft] = useState(null);
  const [savedCodes, setSavedCodes] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setDraft(null); setError('');
    attributeCatalog.get(attributeKey).then(({ data }) => {
      if (active) { setDraft(data); setSavedCodes(data.options.map(option => option.value)); }
    }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [open, attributeKey]);
  const updateOption = (index, patch) => setDraft(previous => ({ ...previous, options: previous.options.map((option, position) => position === index ? { ...option, ...patch } : option) }));
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try { await attributeCatalog.save(attributeKey, draft); onClose(); }
    catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  };
  const input = 'w-full min-w-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm';
  return <Modal open={open} onClose={() => { if (!saving) onClose(); }} title="Cấu hình thuộc tính · Cấp độ" size="xl" density="comfortable"
    footer={<><Button variant="outline" disabled={saving} onClick={onClose}>Hủy</Button><Button type="submit" form="attribute-catalog" loading={saving} disabled={!draft}>Lưu danh mục</Button></>}>
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
    {draft ? <form id="attribute-catalog" onSubmit={save} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 font-semibold text-sm">Tên thuộc tính
        <input required className={input} value={draft.label} onChange={event => setDraft(previous => ({ ...previous, label: event.target.value }))} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Các giá trị lựa chọn</span><Button size="sm" variant="outline" icon={Plus} onClick={() => setDraft(previous => ({ ...previous, options: [...previous.options, { value: '', label: '', active: true }] }))}>Thêm giá trị</Button></div>
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="p-2 font-semibold">Mã</th><th className="p-2 font-semibold">Tên hiển thị</th><th className="p-2 font-semibold">Sử dụng</th><th className="p-2" /></tr></thead>
          <tbody>{draft.options.map((option, index) => <tr key={index} className="border-t border-slate-200 dark:border-slate-800">
            <td className="p-2 w-32"><input aria-label={`Mã giá trị ${index + 1}`} required readOnly={savedCodes.includes(option.value)} className={input + ' read-only:bg-slate-50 dark:read-only:bg-slate-800'} value={option.value} onChange={event => updateOption(index, { value: event.target.value })} /></td>
            <td className="p-2 min-w-64"><input aria-label={`Tên giá trị ${index + 1}`} required className={input} value={option.label} onChange={event => updateOption(index, { label: event.target.value })} /></td>
            <td className="p-2 text-center"><input type="checkbox" aria-label={`Sử dụng ${option.label || index + 1}`} checked={option.active} onChange={event => updateOption(index, { active: event.target.checked })} /></td>
            <td className="p-2">{!savedCodes.includes(option.value) && <button type="button" className="text-xs text-rose-600" onClick={() => setDraft(previous => ({ ...previous, options: previous.options.filter((_, position) => position !== index) }))}>Bỏ</button>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">Mã đã lưu được giữ cố định để liên kết dữ liệu. Bỏ chọn “Sử dụng” để ngừng cho chọn mới; dữ liệu cũ vẫn giữ nguyên.</p>
    </form> : !error && <p role="status">Đang tải danh mục…</p>}
  </Modal>;
}
