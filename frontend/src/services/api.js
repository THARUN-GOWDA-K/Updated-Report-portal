import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (credentials) => apiClient.post('/auth/login', credentials),
};

// Admin APIs
export const adminService = {
  getPendingApprovals: () => apiClient.get('/admin/pending-approvals'),
  approveUser: (userId) => apiClient.post(`/admin/approve-user/${userId}`),
  getAllUsers: () => apiClient.get('/admin/users'),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
};

// Lecturer APIs
export const lecturerService = {
  markAttendance: (data) => apiClient.post('/lecturer/attendance', data),
  inputGrades: (data) => apiClient.post('/lecturer/grades', data),
  submitFeedback: (data) => apiClient.post('/lecturer/feedback', data),
  createLecture: (data) => apiClient.post('/lecturer/create-lecture', data),
  getClassPerformance: (courseId) => apiClient.get(`/lecturer/class-performance/${courseId}`),
  getAnalytics: () => apiClient.get('/lecturer/analytics'),
};

// Student APIs
export const studentService = {
  getAttendance: () => apiClient.get('/student/attendance'),
  getGrades: () => apiClient.get('/student/grades'),
  getFeedback: () => apiClient.get('/student/feedback'),
  getProfile: () => apiClient.get('/student/profile'),
  getStudentsList: () => apiClient.get('/student/list'),
};

// Reports API
export const reportService = {
  generateReport: () => apiClient.get('/reports/generate'),
};

export default apiClient;
