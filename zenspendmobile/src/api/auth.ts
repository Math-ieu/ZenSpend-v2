// Authentication endpoints (unauthenticated requests use `auth: false`).
import { apiRequest } from './client';
import { tokenStore } from './tokenStore';
import type { AuthResponse, User } from '../types';

export interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  preferred_currency: string;
  user_segment?: string;
  password: string;
  password_confirm: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  register: (data: SignupData) =>
    apiRequest('/auth/register/', { method: 'POST', body: data, auth: false }),

  requestPasswordReset: (email: string) =>
    apiRequest('/auth/password-reset/request/', {
      method: 'POST',
      body: { email },
      auth: false,
    }),

  async logout() {
    const refresh = await tokenStore.getRefresh();
    if (refresh) {
      try {
        await apiRequest('/auth/logout/', { method: 'POST', body: { refresh_token: refresh } });
      } catch {
        // Local cleanup proceeds even if the server call fails.
      }
    }
  },
};

export type { User };
