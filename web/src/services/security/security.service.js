import { authService } from '../auth/auth.service';
export const securityService = {
  export: () => authService.request('module_export'),
  modules: () => authService.request('modules'),
  create: module => authService.request('module_create', { payload: module }),
  update: module => authService.request('module_update', { payload: module }),
  remove: key => authService.request('module_delete', { payload: { key } }),
  import: modules => authService.request('module_import', { payload: { modules } }),
  users: () => authService.request('grants'),
  grant: (user_id, module, actions) => authService.request('grant_save', { payload: { user_id, module, actions } }),
};

