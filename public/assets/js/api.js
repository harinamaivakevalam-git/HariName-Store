/**
 * Sample Store - Unified API Client
 */

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.tokenKey = 'hn_auth_token';
    this.userKey = 'hn_user_profile';
    this.sessionKey = 'hn_guest_session';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  getUser() {
    const raw = localStorage.getItem(this.userKey);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  setUser(user) {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  getSessionId() {
    let sid = localStorage.getItem(this.sessionKey);
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(this.sessionKey, sid);
    }
    return sid;
  }

  // Protected Authentication Storage Keys (Never wiped by application cache refresh)
  static AUTH_KEYS = [
    'hn_auth_token',
    'token',
    'hn_user_profile',
    'hn_user',
    'user',
    'hn_guest_session',
    'supabase.auth.token'
  ];

  static isAuthKey(key) {
    if (!key) return false;
    return ApiClient.AUTH_KEYS.includes(key) || key.startsWith('sb-') || key.includes('auth-token');
  }

  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('token');
    localStorage.removeItem('hn_user');
    localStorage.removeItem('user');
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-session-id': this.getSessionId(),
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If uploading FormData, delete Content-Type to let browser set boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(url, {
        cache: options.cache || 'no-store',
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle 401 Unauthorized token expiry
        if (response.status === 401 && token) {
          console.warn('[API] Auth token invalid or expired. Logging out.');
          this.clearAuth();
          window.dispatchEvent(new CustomEvent('hn:auth-changed', { detail: { user: null } }));
        }
        const errorMessage = (data && data.message) || response.statusText || 'An error occurred';
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();
window.api = api;
