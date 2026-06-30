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
  type?: 'STANDARD' | 'AUSENTISMO';
}

// Mapeo 1:1 entre el ID de la provincia SVG y el ID del proceso
export const PROVINCE_TO_PROCESS: Record<string, string> = {
  'bajo-magdalena':    'fechas-especiales',
  'ubate':             'feria-servicios',
  'almeidas':          'salud-mental',
  'guavio':            'actividades-deportivas',
  'medina':            'dia-salud-sst',
  'rionegro':          'pre-pensionados',
  'magdalena-centro':  'clima-organizacional',
  'gualiva':           'teletrabajo',
  'sabana-centro':     'capacitaciones',
  'sabana-occidente':  'atencion-psicosocial',
  'soacha':            'medicina-preventiva',
  'tequendama':        'copasst',
  'alto-magdalena':    'comite-convivencia',
  'sumapaz':           'atencion-emergencias',
  'nueva-provincia':   'seguridad-vial',
};

export const PROCESS_TO_PROVINCE: Record<string, string> = Object.fromEntries(
  Object.entries(PROVINCE_TO_PROCESS).map(([k, v]) => [v, k])
);
