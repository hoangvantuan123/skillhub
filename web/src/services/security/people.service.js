import { authService } from '../auth/auth.service';
const call = (action, payload) => authService.request(action, { payload });
export const peopleService = {
  list: () => call('people'),
  groups: () => call('group_list'),
  update: payload => call('user_update', payload),
  create: payload => call('user_create', payload),
  saveGroup: payload => call('group_save', payload),
  deleteGroup: key => call('group_delete', { key }),
  members: (key, ids, remove = false) => call('group_members', { key, ids, remove }),
  membersMany: (keys, ids, remove = false) => call('group_members', { keys, ids, remove }),
  saveDirectory: payload => call('directory_save', payload),
};
