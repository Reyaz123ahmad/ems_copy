import api from './api.js';

export const biometricCardsService = {
  listCards: async (params = {}) => {
    const response = await api.get('/biometric-cards', { params });
    return response.data?.data || response.data;
  },

  getMyCard: async () => {
    const response = await api.get('/biometric-cards/my');
    return response.data?.data || response.data;
  },

  generateCard: async (data) => {
    const response = await api.post('/biometric-cards/generate', data);
    return response.data?.data || response.data;
  },

  assignCard: async (data) => {
    const response = await api.post('/biometric-cards/assign', data);
    return response.data?.data || response.data;
  },

  getCard: async (id) => {
    const response = await api.get(`/biometric-cards/${id}`);
    return response.data?.data || response.data;
  },

  getCardByEmployee: async (employeeId) => {
    const response = await api.get(`/biometric/cards/employee/${employeeId}`);
    return response.data?.data || response.data;
  },

  regenerateQR: async (cardId) => {
    const response = await api.post(`/biometric-cards/${cardId}/regenerate`);
    return response.data?.data || response.data;
  },

  deactivateCard: async (cardId, reason) => {
    const response = await api.post(`/biometric-cards/${cardId}/deactivate`, { reason });
    return response.data?.data || response.data;
  },

  downloadCard: async (cardId) => {
    const response = await api.get(`/biometric-cards/${cardId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  verifyQR: async (qrData) => {
    const response = await api.post('/biometric-cards/verify-qr', { qrData });
    return response.data?.data || response.data;
  }
};

export default biometricCardsService;
