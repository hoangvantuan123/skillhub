import { apiConfig, apiUrl } from '../../shared/config/api';

export class ApiError extends Error {
  constructor(message, status = 0, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function httpRequest(path, { method = 'POST', body = {}, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  try {
    const response = await fetch(apiUrl(path), {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch { throw new ApiError('API trả về dữ liệu không hợp lệ. Kiểm tra VITE_API_BASE_URL và server.', response.status, 'INVALID_RESPONSE'); }
    if (!response.ok) throw new ApiError(data.message || 'Không thể xử lý yêu cầu.', response.status, data.code);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.name === 'AbortError'
      ? 'API phản hồi quá lâu. Vui lòng thử lại.'
      : 'Không kết nối được API. Kiểm tra server và VITE_API_BASE_URL.', 0, 'NETWORK_ERROR');
  } finally { clearTimeout(timer); }
}
