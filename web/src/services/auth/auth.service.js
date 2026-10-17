import { httpRequest } from '../http/httpClient';
import { authEndpoints } from './auth.endpoints';

let accessToken = '';
let refreshPromise;
async function call(action, body = {}) {
  const result = await httpRequest(authEndpoints[action], { body, token: accessToken });
  if (result.access_token) accessToken = result.access_token;
  return result;
}

export const authService = {
  login: (username, password, remember) => call('login', { username, password, remember }),
  register: (name, username, password, remember) => call('register', { name, username, password, remember }),
  refresh: () => refreshPromise ||= call('refresh').catch(error => {
    if (error.status === 401) accessToken = '';
    throw error;
  }).finally(() => { refreshPromise = null; }),
  async logout() { try { await call('logout'); } finally { accessToken = ''; } },
  async request(action, body) {
    if (!authEndpoints[action]) throw new Error(`Unknown auth operation: ${action}`);
    try { return await call(action, body); }
    catch (error) {
      if (error.status !== 401) throw error;
      await this.refresh();
      return call(action, body);
    }
  },
  me() { return this.request('me'); },
  history() { return this.request('history'); },
  updateProfile(payload) { return this.request('profile_update', { payload }); },
  changePassword(payload) { return this.request('password_change', { payload }); },
};
