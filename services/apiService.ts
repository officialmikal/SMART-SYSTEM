
/**
 * ElimuSmart API Service
 * Centralizes all communication with the Render Backend
 */

const API_BASE_URL = '/api'; // Points to the local backend in this environment

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
