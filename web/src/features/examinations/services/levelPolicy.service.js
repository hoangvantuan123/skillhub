import { authService } from '../../../services/auth/auth.service';
export const levelPolicyService = {
  get: () => authService.request('level_config'),
  save: (policy, expected_version) => authService.request('level_save', { payload: { policy, expected_version } }),
  simulate: (policy, attempts) => authService.request('level_simulate', { payload: { policy, attempts } }),
};
