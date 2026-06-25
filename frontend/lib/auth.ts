/**
 * Authentication Utilities
 * Helper functions untuk manage authentication state
 */

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role?: string;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

/**
 * Clear all auth data (logout)
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Clear cookies
  document.cookie = 'token=; max-age=0; path=/; SameSite=Lax';
  document.cookie = 'refresh_token=; max-age=0; path=/; SameSite=Lax';
}

/**
 * Save auth data
 */
export function saveAuth(token: string, user: User, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
}

/**
 * Get user profile from API
 */
export async function getProfile(): Promise<{ status: string; data: User }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/apicorpu/1.0/accounts/profile/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      throw new Error('Session expired');
    }
    throw new Error('Failed to fetch profile');
  }

  const data = await response.json();
  
  // Update user in localStorage
  if (data.data || data) {
    const userData = data.data || data;
    localStorage.setItem('user', JSON.stringify(userData));
  }
  
  return data;
}
