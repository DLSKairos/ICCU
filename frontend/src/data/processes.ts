export interface Execution {
  date: string; // ISO YYYY-MM-DD
  count: number;
}

export interface Subactivity {
  id: string;
  name: string;
  annualTarget: number;
  executions: Execution[];
}

export interface Activity {
  id: string;
  subactivityId: string;
  title: string;
  description: string;
  message: string;
  date: string;
  attendees: number;
  departments: string[];
  photos: string[];
}

export interface HistoricalYear {
  year: number;
  percentage: number;
}

export interface Process {
  id: string;
  name: string;
  description: string;
  subactivities: Subactivity[];
  activities: Activity[];
  historicalPercentages: HistoricalYear[];
}

// Mapeo 1:1 entre el ID de la provincia SVG y el ID del proceso
export const PROVINCE_TO_PROCESS: Record<string, string> = {
  'bajo-magdalena':    'pausas-activas',
  'ubate':             'cumpleanos',
  'almeidas':          'lunes-miercoles',
  'guavio':            'dia-salud',
  'medina':            'sst',
  'oriente':           'bienestar-laboral',
  'rionegro':          'clima-organizacional',
  'magdalena-centro':  'capacitacion',
  'gualiva':           'seleccion',
  'sabana-centro':     'evaluacion',
  'sabana-occidente':  'seguridad-industrial',
  'soacha':            'medicina-preventiva',
  'tequendama':        'recreacion',
  'alto-magdalena':    'apoyo-social',
  'sumapaz':           'gestion-conocimiento',
  'nueva-provincia':   'cultura-organizacional',
};

export const PROCESS_TO_PROVINCE: Record<string, string> = Object.fromEntries(
  Object.entries(PROVINCE_TO_PROCESS).map(([k, v]) => [v, k])
);
