/**
 * Authentication Service
 * Handles authentication-related API calls
 */

import { api } from '../api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    user_id: number;
    username: string;
    name: string;
    email: string;
    role?: string;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role?: string;
  is_staff?: boolean;
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.login(credentials);

    // Backend returns { status, message, data: { access_token, refresh_token, user, ... } }
    const tokenData = (response as any).data ?? response;

    // Store tokens in localStorage
    if (tokenData.access_token) {
      localStorage.setItem('token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token ?? '');

      // Normalize user: backend sends 'user_id' but frontend expects 'id'
      const rawUser = tokenData.user ?? {};
      if (rawUser.user_id !== undefined && rawUser.id === undefined) {
        rawUser.id = rawUser.user_id;
      }
      localStorage.setItem('user', JSON.stringify(rawUser));

      // Also set cookies for middleware
      document.cookie = `token=${tokenData.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`; // 7 days
      if (tokenData.refresh_token) {
        document.cookie = `refresh_token=${tokenData.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`; // 30 days
      }
    }

    return tokenData as LoginResponse;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }     finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Clear cookies
      document.cookie = 'token=; max-age=0; path=/';
      document.cookie = 'refresh_token=; max-age=0; path=/';
      document.cookie = 'active_group_id=; max-age=0; path=/';
      document.cookie = 'role_type=; max-age=0; path=/';
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      const user = JSON.parse(userStr) as any;
      // Normalize: backend stores user_id, frontend expects id
      if (user.user_id !== undefined && user.id === undefined) {
        user.id = user.user_id;
      }
      return user as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Get current token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Verify token
   */
  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      await api.verifyToken(token);
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't automatically logout, just return false
      // Let the calling component decide what to do
      return false;
    }
  },

  /**
   * Get active group ID from cookie
   */
  getActiveGroupId(): number | null {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)active_group_id=([^;]*)/);
    if (!match) return null;
    const val = parseInt(match[1], 10);
    return isNaN(val) ? null : val;
  },

  /**
   * Set active group ID in cookie
   */
  setActiveGroupId(groupId: number | null): void {
    if (typeof window === 'undefined') return;
    if (groupId !== null && groupId !== undefined) {
      document.cookie = `active_group_id=${groupId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    } else {
      document.cookie = 'active_group_id=; max-age=0; path=/';
    }
  },

  /**
   * Set active role (group_id + role_type) from redirect_url
   * If groupId is null, only role_type cookie is set (for member-only users)
   */
  setActiveRole(groupId: number | null, redirectUrl: string): void {
    if (typeof window === 'undefined') return;
    const roleType = redirectUrl.startsWith('/member/') ? 'member' : 'admin';
    document.cookie = `role_type=${roleType}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    if (groupId !== null && groupId !== undefined) {
      document.cookie = `active_group_id=${groupId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    } else {
      document.cookie = 'active_group_id=; max-age=0; path=/';
    }
  },

  /**
   * Get active role type from cookie
   */
  getActiveRoleType(): string | null {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)role_type=([^;]*)/);
    return match ? match[1] : null;
  },

  /**
   * Clear active group ID (when user switches to "all" or logs out)
   */
  clearActiveGroupId(): void {
    this.setActiveGroupId(null);
    if (typeof window !== 'undefined') {
      document.cookie = 'role_type=; max-age=0; path=/';
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
      const response = await api.refreshToken(refreshToken) as { access_token?: string };

      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        return response.access_token;
      }

      return null;
    } catch {
      // Refresh failed, logout user
      this.logout();
      return null;
    }
  },
};