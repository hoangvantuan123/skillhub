import { gooeyToast } from 'goey-toast';

const titles = { success: 'Thành công', error: 'Không thể hoàn tất', warning: 'Cần chú ý', info: 'Thông tin' };
// Enable only when notification flows are explicitly requested.
const NOTIFICATIONS_ENABLED = false;
export function notify(message, type = 'info', duration) {
  if (!NOTIFICATIONS_ENABLED) return;
  const kind = type === 'danger' ? 'error' : titles[type] ? type : 'info';
  const options = typeof message === 'string' ? { description: message } : message;
  return gooeyToast[kind](options.title || titles[kind], {
    ...options,
    duration: duration ?? (kind === 'error' || kind === 'warning' ? 6000 : 4500),
    preset: 'subtle',
    showProgress: true,
    showTimestamp: false,
  });
}
