import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: agrega token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iccu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: desenvuelve {data, message, error} y maneja 401
api.interceptors.response.use(
  (response) => {
    // El backend envuelve en {data, message, error} — desenvolver automáticamente
    if (response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('iccu_token');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

// Funciones tipadas para cada endpoint
export const processesApi = {
  getAll: (year = new Date().getFullYear()) =>
    api.get(`/processes?year=${year}`).then(r => r.data),
  getOne: (id: string, year = new Date().getFullYear()) =>
    api.get(`/processes/${id}?year=${year}`).then(r => r.data),
};

export const adminApi = {
  getProcesses: (year = new Date().getFullYear()) =>
    api.get(`/processes?year=${year}`).then(r => r.data),
  getProcess: (id: string, year = new Date().getFullYear()) =>
    api.get(`/processes/${id}?year=${year}`).then(r => r.data),
  setTarget: (subactivityId: string, year: number, target: number) =>
    api.patch(`/activities/subactivity/${subactivityId}/targets/${year}`, { target }).then(r => r.data),
  lockTargets: (subactivityId: string, year: number) =>
    api.patch(`/activities/subactivity/${subactivityId}/targets/${year}/lock`).then(r => r.data),
  createSubactivity: (processId: string, name: string, year: number, target: number) =>
    api.post('/activities/subactivities', { processId, name, year, target }).then(r => r.data),
  createGlobalActivity: (name: string, year: number, target: number) =>
    api.post('/activities/subactivities/global', { name, year, target }).then(r => r.data),
  deleteSubactivity: (id: string) =>
    api.delete(`/activities/subactivities/${id}`),
  createActivity: (formData: FormData) =>
    api.post('/activities', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  deleteActivity: (id: string) =>
    api.delete(`/activities/${id}`),
  resetPreview: (year: number) =>
    api.get(`/annual-reset/preview?year=${year}`).then(r => r.data),
  resetYear: (yearToClose: number) =>
    api.post('/annual-reset', { yearToClose }).then(r => r.data),
  createAbsence: (data: Record<string, unknown>) =>
    api.post('/absence', data).then(r => r.data),
  getAbsenceRecords: (processId: string, year: number) =>
    api.get(`/absence/process/${processId}?year=${year}`).then(r => r.data),
};

export const absenceApi = {
  searchCie10: (q: string) =>
    api.get(`/absence/cie10/search?q=${encodeURIComponent(q)}`).then(r => r.data),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
};

export default api;
