// Replace this adapter with HTTP calls when the catalog is stored in the DB.
// Consumers keep { key, label, options: [{ value, label, active }] } unchanged.
const STORAGE_KEY = 'skillhub_attribute_catalog_v1';
const defaults = {
  level: {
    key: 'level', label: 'Cấp độ áp dụng (ISA-95 Level)',
    options: [
      { value: 'All', label: 'Chung (Tất cả cấp độ)', active: true },
      { value: 'L0', label: 'Level 0 — Thiết bị trường & Cảm biến', active: true },
      { value: 'L1', label: 'Level 1 — PLC & Điều khiển máy', active: true },
      { value: 'L2', label: 'Level 2 — SCADA & Giao diện HMI', active: true },
      { value: 'L3', label: 'Level 3 — MES / MOM & ERP Liên vận', active: true },
    ],
  },
};
const clone = value => JSON.parse(JSON.stringify(value));
function read() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(defaults);
  const data = JSON.parse(saved);
  if (!data || typeof data !== 'object') throw new Error('Dữ liệu danh mục không hợp lệ.');
  return { ...clone(defaults), ...data };
}
export const attributeCatalog = {
  async get(key) {
    const result = read()[key];
    if (!result) throw new Error('Không tìm thấy danh mục thuộc tính.');
    return { data: clone(result) };
  },
  async save(key, draft) {
    const data = read();
    if (!draft.label?.trim()) throw new Error('Vui lòng nhập tên thuộc tính.');
    const values = new Set();
    const options = draft.options.map(option => {
      const value = option.value?.trim();
      const label = option.label?.trim();
      if (!value || !label) throw new Error('Mỗi giá trị cần có mã và tên hiển thị.');
      if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới.');
      if (values.has(value.toLowerCase())) throw new Error(`Mã ${value} bị trùng.`);
      values.add(value.toLowerCase());
      return { value, label, active: option.active !== false };
    });
    // Existing codes are stable foreign keys. Disable values rather than delete.
    for (const existing of data[key]?.options || []) {
      if (!options.some(option => option.value === existing.value)) throw new Error('Không được xóa hoặc đổi mã đã lưu. Hãy ngừng sử dụng giá trị đó.');
    }
    if (!options.some(option => option.active)) throw new Error('Cần ít nhất một giá trị đang sử dụng.');
    data[key] = { key, label: draft.label.trim(), options };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('skillhub:catalog-updated'));
    return { data: clone(data[key]) };
  },
};
