
/**
 * ElimuSmart API Service
 * Centralizes all communication with the Render Backend
 */

// Detect the API base URL from environment or fallback to relative path for unified serving
const env = (import.meta as any).env;
const rawBaseUrl = env?.VITE_API_URL || '/api';
const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const apiService = {
  getAuthToken() {
    return localStorage.getItem('elimusmart_token');
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem('elimusmart_token');
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
