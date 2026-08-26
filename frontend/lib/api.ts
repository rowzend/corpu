/**
 * API Client for ASN CORPU
 * Handles all HTTP requests to Django backend
 */

/** ESIMPEG public media URL for serving photos directly */
export const ESIMPEG_MEDIA_URL = process.env.NEXT_PUBLIC_ESIMPEG_MEDIA_URL
    || 'https://esimpeg.pesisirselatankab.go.id/media/minio';

// Use dynamic base URL based on browser location
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return `${window.location.origin}/apicorpu/1.0`;
  }
  // Server-side: use env variable
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/apicorpu/1.0';
};

// Knowledge API uses public endpoint
const getKnowledgeURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  // Server-side: use env variable
  return process.env.NEXT_PUBLIC_KNOWLEDGE_API_URL || 'http://localhost:3000/apicorpu/public/1.0';
};

// Profile API uses public endpoint too, but profile model-viewset prints full URL in photo field
const getProfileURL = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/apicorpu/public/1.0';
};

const getAuthURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return `${window.location.origin}/apicorpu/auth/1.0/`;
  }
  // Server-side: use env variable
  return process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000/apicorpu/auth/1.0/';
};

const API_BASE_URL = getBaseURL();
const KNOWLEDGE_BASE_URL = getKnowledgeURL();
const AUTH_BASE_URL = getAuthURL();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public errors?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Friendly Indonesian message per HTTP status, used when the server sends no message. */
export function getFriendlyStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Permintaan tidak valid. Silakan periksa kembali data Anda.';
    case 401:
      return 'Sesi Anda telah berakhir. Silakan login kembali.';
    case 403:
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini. Jika akses dibatasi oleh role aktif, silakan pilih role yang sesuai atau hubungi administrator.';
    case 404:
      return 'Data yang Anda cari tidak ditemukan.';
    case 405:
      return 'Metode permintaan tidak diizinkan.';
    case 422:
      return 'Data yang Anda kirim tidak valid. Silakan periksa kembali.';
    case 429:
      return 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.';
    case 500:
      return 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
    case 502:
    case 503:
    case 504:
      return 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.';
    default:
      return `Permintaan gagal dengan status ${status}. Silakan coba lagi.`;
  }
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

class ApiClient {
  private baseURL: string;
  private knowledgeURL: string;
  private authURL: string;

  constructor() {
    this.baseURL = getBaseURL();
    this.knowledgeURL = getKnowledgeURL();
    this.authURL = getAuthURL();
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getActiveGroupId(): string | null {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)active_group_id=([^;]*)/);
    return match ? match[1] : null;
  }

  private addActiveGroupHeader(headers: HeadersInit): HeadersInit {
    // Send the active role (group_id) so backend scopes permissions to it
    const activeGroupId = this.getActiveGroupId();
    if (activeGroupId) {
      (headers as Record<string, string>)['X-Active-Group-Id'] = activeGroupId;
    }
    return headers;
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return this.addActiveGroupHeader(headers);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    // Handle 204 No Content (common for DELETE requests)
    if (response.status === 204) {
      return { success: true, message: 'Operation completed successfully' } as T;
    }

    // Check if response has JSON content
    const hasJsonContent = contentType && contentType.includes('application/json');

    // If no JSON content but response is OK, return success
    if (!hasJsonContent && response.ok) {
      return { success: true, message: 'Operation completed successfully' } as T;
    }

    // If no JSON content and response is not OK, throw error
    if (!hasJsonContent && !response.ok) {
      await response.text();
      throw new ApiError(
        getFriendlyStatusMessage(response.status),
        response.status,
        'INVALID_RESPONSE'
      );
    }

    // Parse JSON response
    const data = await response.json();

    // Check if response is not OK (4xx, 5xx)
    if (!response.ok) {
      // Handle different error formats
      const serverMessage = data.message || data.detail || data.error || '';
      const errorCode = data.code || 'API_ERROR';

      throw new ApiError(
        serverMessage || getFriendlyStatusMessage(response.status),
        response.status,
        errorCode,
        data.errors || data
      );
    }

    // Handle different success response formats
    // 1. Django REST Framework pagination format: {count, results, next, previous}
    if (data.hasOwnProperty('results')) {
      return data as T;
    }

    // 2. Custom API format: {success: true, data: ...} or {status: "success", data: ...}
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess) {
      return data as T;
    }

    // 3. Direct data response (like stats endpoint)
    return data as T;
  }

  async get<T>(endpoint: string, params?: Record<string, any>, useKnowledgeAPI = false): Promise<T> {
    // Build full URL
    let fullUrl: string;
    if (endpoint.startsWith('http')) {
      fullUrl = endpoint;
    } else {
      // Remove leading slash if present, baseURL already has trailing part
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const baseUrl = useKnowledgeAPI ? this.knowledgeURL : this.baseURL;
      fullUrl = `${baseUrl}/${cleanEndpoint}`;
    }

    const url = new URL(fullUrl);

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async getBlob(endpoint: string): Promise<Blob> {
    let fullUrl: string;
    if (endpoint.startsWith('http')) {
      fullUrl = endpoint;
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      fullUrl = `${this.baseURL}/${cleanEndpoint}`;
    }
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new ApiError('Download gagal', response.status);
    }
    return response.blob();
  }

  async post<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    // Build full URL
    let fullUrl: string;
    if (endpoint.startsWith('http')) {
      fullUrl = endpoint;
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      fullUrl = `${this.baseURL}/${cleanEndpoint}`;
    }

    const url = new URL(fullUrl);

    // If data is FormData, send without JSON headers
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.addActiveGroupHeader(headers),
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    // Build full URL
    let fullUrl: string;
    if (endpoint.startsWith('http')) {
      fullUrl = endpoint;
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      fullUrl = `${this.baseURL}/${cleanEndpoint}`;
    }

    const url = new URL(fullUrl);

    // If data is FormData, send without JSON headers
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: this.addActiveGroupHeader(headers),
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    // Build full URL
    let fullUrl: string;
    if (endpoint.startsWith('http')) {
      fullUrl = endpoint;
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      fullUrl = `${this.baseURL}/${cleanEndpoint}`;
    }

    const url = new URL(fullUrl);

    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: this.addActiveGroupHeader(headers),
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    // Build full URL
    let fullUrl: string;
    if (endpoint.startsWith('http')) {
      fullUrl = endpoint;
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      fullUrl = `${this.baseURL}/${cleanEndpoint}`;
    }

    const url = new URL(fullUrl);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Auth-specific methods
  async login(credentials: { username: string; password: string }) {
    console.log('API login called with:', credentials.username); // Debug
    console.log('Auth URL:', this.authURL); // Debug

    const url = new URL('login/', this.authURL);
    console.log('Full login URL:', url.toString()); // Debug

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(credentials),
    });

    console.log('Login response status:', response.status); // Debug
    return this.handleResponse(response);
  }

  async verifyToken(token: string) {
    const url = new URL('verify/', this.authURL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ token }),
    });

    return this.handleResponse(response);
  }

  async refreshToken(refreshToken: string) {
    const url = new URL('refresh/', this.authURL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ refresh: refreshToken }),
    });

    return this.handleResponse(response);
  }

  async logout() {
    const url = new URL('logout/', this.authURL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Knowledge API methods (uses public endpoints)
  async getKnowledgeArticles(params?: Record<string, any>) {
    return this.get('knowledge/articles/', params, true);
  }

  async getKnowledgeCategories(params?: Record<string, any>) {
    return this.get('knowledge/categories/', params, true);
  }

  async getKnowledgeStats(params?: Record<string, any>) {
    // Use authenticated endpoint for admin stats (will show all articles if user has permission)
    return this.get('knowledge/stats/', params, false);
  }

  async getKnowledgeArticle(slug: string) {
    return this.get(`knowledge/articles/${slug}/`, undefined, true);
  }

  async getKnowledgeCategory(slug: string) {
    return this.get(`knowledge/categories/${slug}/`, undefined, true);
  }

  // Admin Knowledge API methods (uses authenticated endpoints)
  async getAdminArticles(params?: Record<string, any>) {
    return this.get('knowledge/articles/', params, false); // Use authenticated endpoint
  }

  async getAdminCategories(params?: Record<string, any>) {
    return this.get('knowledge/categories/', params, false); // Use authenticated endpoint
  }
}

export const api = new ApiClient();

// Helper function for error handling
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    // Try to extract detailed error message from response
    const payload = error.errors;
    if (payload) {
      // Handle validation errors (422)
      if (error.status === 422 || error.status === 400) {
        if (typeof payload === 'object') {
          // Extract field-specific errors
          const fieldErrors: string[] = [];
          for (const [field, messages] of Object.entries(payload)) {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              fieldErrors.push(`${field}: ${messages}`);
            }
          }
          if (fieldErrors.length > 0) {
            return fieldErrors.join('\n');
          }
        }
      }
      
      // Handle error with detail field
      if (payload.detail) {
        return payload.detail;
      }
      
      // Handle error with message field
      if (payload.message) {
        return payload.message;
      }
    }
    
    // Fallback: friendly message mapped from the HTTP status code
    return getFriendlyStatusMessage(error.status);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Terjadi kesalahan yang tidak terduga.';
}