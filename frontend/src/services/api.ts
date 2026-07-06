import axios from 'axios';

// ── Tipos para el módulo de ausentismo ──────────────────────────────────────

export interface AbsenceStats {
  period: string;
  dateRange: { from: string; to: string };
  summary: { totalCases: number; totalDays: number };
  byDepartment: { department: string; cases: number; days: number }[];
  byStartWeekday: { weekday: string; dayIndex: number; cases: number }[];
  topConcepts: { diagnosticCode: string | null; diagnosticConcept: string | null; cases: number }[];
}

export interface PersonAbsenceStats {
  identification: string;
  employeeName: string;
  department: string;
  currentYearCases: number;
  currentYearDays: number;
  byStartWeekday: { weekday: string; dayIndex: number; cases: number }[];
  byDiagnostic: { diagnosticCode: string | null; diagnosticConcept: string | null; cases: number }[];
  absences: {
    id: string;
    startDate: string;
    endDate: string;
    requestDate: string;
    days: number;
    incapacityType: string;
    diagnosticCode: string | null;
    diagnosticConcept: string | null;
  }[];
}

export interface EmployeeSearchResult {
  identification: string;
  employeeName: string;
}

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
  createActivity: (data: {
    processId: string;
    subactivityId: string;
    title: string;
    description: string;
    message: string;
    date: string;
    attendees: number;
    departments: string[];
  }) =>
    api.post('/activities', data).then(r => r.data),
  uploadActivityPhoto: (activityId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api
      .post(`/upload/activities/${activityId}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data);
  },
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
  updateAbsence: (id: string, data: Record<string, unknown>) =>
    api.patch(`/absence/${id}`, data).then(r => r.data),
  deleteAbsence: (id: string) =>
    api.delete(`/absence/${id}`),
};

export const absenceApi = {
  searchCie10: (q: string) =>
    api.get(`/absence/cie10/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  searchEmployees: (q: string): Promise<EmployeeSearchResult[]> =>
    api.get(`/absence/employees/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  getStats: (processId: string, period: string): Promise<AbsenceStats> =>
    api.get(`/absence/stats?processId=${encodeURIComponent(processId)}&period=${encodeURIComponent(period)}`).then(r => r.data),
  getPerson: (identification: string, processId: string): Promise<PersonAbsenceStats> =>
    api.get(`/absence/person/${encodeURIComponent(identification)}?processId=${encodeURIComponent(processId)}`).then(r => r.data),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
};

export default api;
