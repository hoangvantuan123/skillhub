/**
 * Date and data formatters
 * Always displays in configured timezone (default Asia/Ho_Chi_Minh)
 */

export function formatDate(dateInput, includeTime = true) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const options = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = false;
  }

  return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n) => String(n).padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatScore(score, maxScore = 10) {
  if (score == null) return '—';
  const formatted = Number(score).toFixed(1).replace(/\.0$/, '');
  return `${formatted}/${maxScore}`;
}

export function generateIdempotencyKey() {
  return 'idemp_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
}
