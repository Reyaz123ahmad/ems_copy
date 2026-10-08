import api from './api.js';

export const authService = {
  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    // Backend returns: { status: 'ok', data: { user, accessToken, refreshToken } }
    return response.data?.data || response.data;
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Ignore errors — always clear client
      console.warn('Logout API failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh JWT Token
   * @param {string} refreshToken 
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data?.data || response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data?.data || response.data;
  },

  /**
   * Change current user's password
   * @param {string} oldPassword 
   * @param {string} newPassword 
   */
  async changePassword(oldPassword, newPassword) {
    const response = await api.put('/auth/change-password', { oldPassword, newPassword });
    return response.data?.data || response.data;
  },

  /**
   * Direct password reset for authenticated user
   * @param {string} newPassword 
   */
  async resetPasswordDirect(newPassword) {
    const response = await api.post('/auth/reset-password-direct', { newPassword });
    return response.data?.data || response.data;
  },

  /**
   * Reset password with email (Public - no OTP, no email)
   * @param {string} email
   * @param {string} newPassword
   */
  async resetPasswordWithEmail(email, newPassword) {
    const response = await api.post('/auth/reset-password-with-email', { email, newPassword });
    return response.data?.data || response.data;
  }
};

export default authService;
