import { useSyncExternalStore } from 'react';

export const DEFAULT_TABLE_HEIGHT = 44;
const listeners = new Set();
let snapshot = { rowHeight: DEFAULT_TABLE_HEIGHT, loading: true, error: '' };
let database;
let initialization;
let owner = '';
let generation = 0;
const valid = value => Number.isInteger(value) && value >= 36 && value <= 64;
function publish(patch) {
  snapshot = { ...snapshot, ...patch };
  document.documentElement.style.setProperty('--table-row-height', snapshot.rowHeight + 'px');
  document.documentElement.style.setProperty('--table-cell-padding', Math.max(4, (snapshot.rowHeight - 24) / 2) + 'px');
  listeners.forEach(listener => listener());
}
function openDatabase() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open('skillhub-ui-preferences', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('settings');
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database blocked'));
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); database = undefined; }; resolve(db); };
  }).catch(error => { database = undefined; throw error; });
  return database;
}
export function setTablePreferenceUser(userId) {
  const next = String(userId || '');
  if (owner === next && initialization) return initialization;
  owner = next; generation += 1; initialization = undefined;
  publish({ rowHeight: DEFAULT_TABLE_HEIGHT, timezone: 'Asia/Ho_Chi_Minh', loading: true, error: '' });
  return initializeTablePreferences();
}
export function initializeTablePreferences() {
  if (initialization) return initialization;
  const currentGeneration = generation;
  const storageKey = 'table:' + (owner || 'anonymous');
  initialization = (async () => {
    try {
      const db = await openDatabase();
      const stored = await new Promise((resolve, reject) => {
        const transaction = db.transaction('settings', 'readonly');
        const request = transaction.objectStore('settings').get(storageKey);
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = transaction.onabort = () => reject(transaction.error);
      });
      if (currentGeneration !== generation) return;
      publish({ timezone: stored?.timezone === 'UTC' ? 'UTC' : 'Asia/Ho_Chi_Minh', rowHeight: valid(stored?.rowHeight) ? stored.rowHeight : DEFAULT_TABLE_HEIGHT, loading: false, error: '' });
    } catch { if (currentGeneration !== generation) return; publish({ loading: false, error: 'Không đọc được IndexedDB. Đang dùng chiều cao mặc định 44px.' }); }
  })();
  return initialization;
}
export async function saveTablePreferences(rowHeight, timezone = snapshot.timezone || 'Asia/Ho_Chi_Minh') {
  if (!valid(rowHeight)) throw new Error('Chiều cao hàng phải là số nguyên từ 36 đến 64px.');
  if (!owner) throw new Error('Vui lòng đăng nhập để lưu cài đặt cá nhân.');
  if (!['UTC', 'Asia/Ho_Chi_Minh'].includes(timezone)) throw new Error('Múi giờ không hợp lệ.');
  const savedOwner = owner;
  const savedGeneration = generation;
  await initializeTablePreferences();
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readwrite');
      transaction.objectStore('settings').put({ rowHeight, timezone }, 'table:' + savedOwner);
      transaction.oncomplete = resolve;
      transaction.onerror = transaction.onabort = () => reject(transaction.error);
    });
    if (generation === savedGeneration) publish({ rowHeight, timezone, error: '' });
  } catch { throw new Error('Không lưu được IndexedDB. Vui lòng kiểm tra quyền lưu trữ của trình duyệt và thử lại.'); }
}
export function useTablePreferences() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => snapshot);
}
