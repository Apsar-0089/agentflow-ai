import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor to attach Bearer JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('agentflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'Network error occurred';
    const code = error.response?.data?.error?.code || 'API_ERROR';
    return Promise.reject({ message, code, status: error.response?.status, raw: error });
  }
);

// Auth API Endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Workflows API Endpoints
export const workflowApi = {
  getDashboard: () => api.get('/workflows/dashboard'),
  getWorkflows: (params) => api.get('/workflows', { params }),
  getWorkflowById: (id) => api.get(`/workflows/${id}`),
  createWorkflow: (data) => api.post('/workflows', data),
  generateWorkflow: (prompt) => api.post('/workflows/generate', { prompt }),
  updateWorkflow: (id, data) => api.put(`/workflows/${id}`, data),
  duplicateWorkflow: (id) => api.post(`/workflows/${id}/duplicate`),
  executeWorkflow: (id, inputs = {}) => api.post(`/workflows/${id}/execute`, { inputs }),
  deleteWorkflow: (id) => api.delete(`/workflows/${id}`),
};

// Executions API Endpoints
export const executionApi = {
  getExecutions: (params) => api.get('/executions', { params }),
  getExecutionById: (id) => api.get(`/executions/${id}`),
  getTimeline: (id) => api.get(`/executions/${id}/timeline`),
  pause: (id) => api.post(`/executions/${id}/pause`),
  resume: (id) => api.post(`/executions/${id}/resume`),
  cancel: (id) => api.post(`/executions/${id}/cancel`),
};

// Integrations API Endpoints
export const integrationApi = {
  getIntegrations: () => api.get('/integrations'),
  getStatus: () => api.get('/integrations/status'),
  saveCredentials: (data) => api.post('/integrations', data),
  disconnect: (provider) => api.delete(`/integrations/${provider}`),
};

// Notifications API Endpoints
export const notificationApi = {
  getNotifications: (limit) => api.get('/notifications', { params: { limit } }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export default api;
