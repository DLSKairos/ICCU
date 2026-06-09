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

// 15 procesos placeholder — los nombres definitivos serán confirmados por el área de TH del ICCU
export const PROCESSES: Process[] = [
  {
    id: 'pausas-activas',
    name: 'Pausas Activas',
    description: 'Espacios programados de descanso activo para promover la salud física y mental de los colaboradores durante la jornada laboral.',
    subactivities: [
      {
        id: 'pa-sesiones',
        name: 'Sesiones de Pausa Activa',
        annualTarget: 156,
        executions: [
          { date: '2025-01-08', count: 1 }, { date: '2025-01-13', count: 1 },
          { date: '2025-01-15', count: 1 }, { date: '2025-01-20', count: 1 },
          { date: '2025-01-22', count: 1 }, { date: '2025-01-27', count: 1 },
          { date: '2025-02-03', count: 1 }, { date: '2025-02-05', count: 1 },
          { date: '2025-02-10', count: 1 }, { date: '2025-02-12', count: 1 },
          { date: '2025-02-17', count: 1 }, { date: '2025-02-19', count: 1 },
          { date: '2025-02-24', count: 1 }, { date: '2025-02-26', count: 1 },
          { date: '2025-03-03', count: 1 }, { date: '2025-03-05', count: 1 },
          { date: '2025-03-10', count: 1 }, { date: '2025-03-12', count: 1 },
          { date: '2025-03-17', count: 1 }, { date: '2025-03-19', count: 1 },
          { date: '2025-03-24', count: 1 }, { date: '2025-03-26', count: 1 },
          { date: '2025-04-02', count: 1 }, { date: '2025-04-07', count: 1 },
          { date: '2025-04-09', count: 1 }, { date: '2025-04-14', count: 1 },
          { date: '2025-04-28', count: 1 }, { date: '2025-04-30', count: 1 },
          { date: '2025-05-05', count: 1 }, { date: '2025-05-07', count: 1 },
          { date: '2025-05-12', count: 1 }, { date: '2025-05-14', count: 1 },
          { date: '2025-05-19', count: 1 }, { date: '2025-05-21', count: 1 },
          { date: '2025-05-26', count: 1 }, { date: '2025-05-28', count: 1 },
          { date: '2025-06-02', count: 1 }, { date: '2025-06-04', count: 1 },
          { date: '2025-06-09', count: 1 },
        ],
      },
    ],
    activities: [
      {
        id: 'pa-act-1', subactivityId: 'pa-sesiones',
        title: 'Pausa Activa sede Administrativa', description: 'Sesión de estiramiento y ejercicios de movilidad articular con todo el personal administrativo de la sede principal.',
        message: '¡Un cuerpo activo es una mente activa! Gracias a todos los participantes por su energía.', date: '2025-06-04', attendees: 42, departments: ['Financiero', 'Talento Humano', 'Jurídica'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=Pausa+Activa+1', 'https://placehold.co/600x400/0087CF/FFDD00?text=Pausa+Activa+2', 'https://placehold.co/600x400/D4AF37/134174?text=Pausa+Activa+3'],
      },
      {
        id: 'pa-act-2', subactivityId: 'pa-sesiones',
        title: 'Pausa Activa sector técnico', description: 'Activación muscular y ejercicios de respiración para el equipo de ingeniería y técnicos de campo.',
        message: '¡La salud es nuestra mejor herramienta de trabajo!', date: '2025-05-28', attendees: 28, departments: ['Ingeniería', 'Obras', 'Supervisión'],
        photos: ['https://placehold.co/600x400/134174/FFDD00?text=Pausa+T%C3%A9cnica+1', 'https://placehold.co/600x400/134174/D4AF37?text=Pausa+T%C3%A9cnica+2'],
      },
      {
        id: 'pa-act-3', subactivityId: 'pa-sesiones',
        title: 'Pausa Activa área de contratos', description: 'Ejercicios de relajación visual y postural para el equipo de contratos.',
        message: '¡Desconectarse para reconectarse con más energía!', date: '2025-05-21', attendees: 19, departments: ['Contratos', 'Planeación'],
        photos: ['https://placehold.co/600x400/0087CF/134174?text=Pausa+Contratos'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 78 }, { year: 2024, percentage: 91 }],
  },
  {
    id: 'cumpleanos',
    name: 'Cumpleaños',
    description: 'Celebración mensual de los cumpleaños de los colaboradores del ICCU, fomentando el sentido de pertenencia y el bienestar institucional.',
    subactivities: [
      {
        id: 'cum-celebraciones',
        name: 'Celebraciones Mensuales',
        annualTarget: 12,
        executions: [
          { date: '2025-01-31', count: 1 }, { date: '2025-02-28', count: 1 },
          { date: '2025-03-31', count: 1 }, { date: '2025-04-30', count: 1 },
          { date: '2025-05-30', count: 1 },
        ],
      },
    ],
    activities: [
      {
        id: 'cum-act-1', subactivityId: 'cum-celebraciones',
        title: 'Celebración cumpleaños mayo 2025', description: 'Reconocimiento y festejo de los colaboradores que cumplen años en el mes de mayo.',
        message: '¡Muchas felicidades a nuestros ICCU que en mayo celebran un año más de vida! 🎂', date: '2025-05-30', attendees: 67, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/E00914/FFDD00?text=Cumplea%C3%B1os+Mayo+1', 'https://placehold.co/600x400/FFDD00/134174?text=Cumplea%C3%B1os+Mayo+2', 'https://placehold.co/600x400/134174/FFDD00?text=Cumplea%C3%B1os+Mayo+3', 'https://placehold.co/600x400/D4AF37/134174?text=Cumplea%C3%B1os+Mayo+4'],
      },
      {
        id: 'cum-act-2', subactivityId: 'cum-celebraciones',
        title: 'Celebración cumpleaños abril 2025', description: 'Reconocimiento mensual de cumpleaños con torta institucional y palabras de la Dirección.',
        message: 'El ICCU celebra con orgullo a cada uno de sus colaboradores.', date: '2025-04-30', attendees: 54, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/E00914/134174?text=Cumplea%C3%B1os+Abril'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 100 }, { year: 2024, percentage: 100 }],
  },
  {
    id: 'lunes-miercoles',
    name: 'Lunes y Miércoles de Actívate',
    description: 'Programa bisemanal de actividad física y bienestar que convoca a los colaboradores los días lunes y miércoles antes o después de la jornada laboral.',
    subactivities: [
      {
        id: 'lm-sesiones',
        name: 'Sesiones Lunes/Miércoles',
        annualTarget: 96,
        executions: Array.from({ length: 45 }, (_, i) => ({
          date: new Date(2025, 0, 6 + i * 3.5).toISOString().split('T')[0],
          count: 1,
        })),
      },
    ],
    activities: [
      {
        id: 'lm-act-1', subactivityId: 'lm-sesiones',
        title: 'Actívate — sesión de cardio', description: 'Rutina de cardio de 45 minutos con instructor certificado en las instalaciones del ICCU.',
        message: '¡El movimiento es salud! Cada paso cuenta.', date: '2025-06-02', attendees: 23, departments: ['Financiero', 'Ingeniería', 'Jurídica'],
        photos: ['https://placehold.co/600x400/134174/FFDD00?text=Act%C3%ADvate+1', 'https://placehold.co/600x400/0087CF/D4AF37?text=Act%C3%ADvate+2'],
      },
      {
        id: 'lm-act-2', subactivityId: 'lm-sesiones',
        title: 'Actívate — yoga y meditación', description: 'Sesión de yoga y técnicas de mindfulness para reducir el estrés laboral.',
        message: 'La paz interior es la base de la productividad.', date: '2025-05-28', attendees: 18, departments: ['Talento Humano', 'Contratos'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=Yoga+1'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 85 }, { year: 2024, percentage: 89 }],
  },
  {
    id: 'dia-salud',
    name: 'Día de la Salud',
    description: 'Jornada anual de valoraciones médicas, actividades preventivas y promoción de hábitos saludables para todos los colaboradores del ICCU.',
    subactivities: [
      { id: 'ds-jornada', name: 'Jornada de Salud', annualTarget: 2, executions: [{ date: '2025-04-10', count: 1 }] },
      { id: 'ds-taller', name: 'Talleres Preventivos', annualTarget: 4, executions: [{ date: '2025-02-15', count: 1 }, { date: '2025-04-10', count: 1 }] },
    ],
    activities: [
      {
        id: 'ds-act-1', subactivityId: 'ds-jornada',
        title: 'Jornada de Salud 2025 — Primer semestre', description: 'Valoraciones de optometría, odontología preventiva, presión arterial, glicemia y talla-peso para todos los colaboradores.',
        message: 'Tu salud es nuestra prioridad. El ICCU cuida de ti.', date: '2025-04-10', attendees: 112, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=D%C3%ADa+Salud+1', 'https://placehold.co/600x400/0087CF/FFDD00?text=D%C3%ADa+Salud+2', 'https://placehold.co/600x400/D4AF37/134174?text=D%C3%ADa+Salud+3'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 100 }, { year: 2024, percentage: 100 }],
  },
  {
    id: 'sst',
    name: 'SST',
    description: 'Sistema de Gestión de Seguridad y Salud en el Trabajo. Implementación de actividades de prevención, capacitación e inspección para garantizar ambientes laborales seguros.',
    subactivities: [
      { id: 'sst-cap', name: 'Capacitaciones SST', annualTarget: 24, executions: Array.from({ length: 10 }, (_, i) => ({ date: new Date(2025, 0, 15 + i * 15).toISOString().split('T')[0], count: 1 })) },
      { id: 'sst-insp', name: 'Inspecciones de Seguridad', annualTarget: 12, executions: Array.from({ length: 4 }, (_, i) => ({ date: new Date(2025, i, 25).toISOString().split('T')[0], count: 1 })) },
      { id: 'sst-sim', name: 'Simulacros de Emergencia', annualTarget: 2, executions: [{ date: '2025-03-20', count: 1 }] },
    ],
    activities: [
      {
        id: 'sst-act-1', subactivityId: 'sst-cap',
        title: 'Capacitación: Manejo de cargas y ergonomía', description: 'Taller práctico sobre técnicas correctas de levantamiento de cargas y postura en el trabajo de campo.',
        message: 'Un trabajador seguro es un trabajador productivo. ¡La seguridad es responsabilidad de todos!', date: '2025-05-15', attendees: 35, departments: ['Obras', 'Ingeniería', 'Supervisión'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=SST+Ergonomia+1', 'https://placehold.co/600x400/E00914/134174?text=SST+Ergonomia+2'],
      },
      {
        id: 'sst-act-2', subactivityId: 'sst-sim',
        title: 'Simulacro de evacuación 2025', description: 'Ejercicio de evacuación general de las instalaciones administrativas del ICCU.',
        message: 'Prepararse hoy salva vidas mañana.', date: '2025-03-20', attendees: 98, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/E00914/FFDD00?text=Simulacro+1', 'https://placehold.co/600x400/134174/E00914?text=Simulacro+2'],
      },
      {
        id: 'sst-act-3', subactivityId: 'sst-insp',
        title: 'Inspección de instalaciones eléctricas', description: 'Revisión de tableros eléctricos, cables expuestos y equipos de protección en áreas de trabajo.',
        message: 'El orden y la prevención son la mejor póliza de seguridad.', date: '2025-04-25', attendees: 5, departments: ['Mantenimiento', 'SST'],
        photos: ['https://placehold.co/600x400/0087CF/134174?text=Inspecci%C3%B3n+1'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 72 }, { year: 2024, percentage: 87 }],
  },
  {
    id: 'bienestar-laboral',
    name: 'Bienestar Laboral',
    description: 'Actividades orientadas a mejorar la calidad de vida y el sentido de pertenencia de los colaboradores a través de eventos recreativos, culturales y de integración.',
    subactivities: [
      { id: 'bl-integra', name: 'Jornadas de Integración', annualTarget: 4, executions: [{ date: '2025-03-14', count: 1 }, { date: '2025-05-23', count: 1 }] },
      { id: 'bl-recrea', name: 'Actividades Recreativas', annualTarget: 6, executions: [{ date: '2025-02-20', count: 1 }, { date: '2025-04-18', count: 1 }, { date: '2025-05-30', count: 1 }] },
    ],
    activities: [
      {
        id: 'bl-act-1', subactivityId: 'bl-integra',
        title: 'Día de integración primer semestre', description: 'Tarde de juegos, actividades deportivas y almuerzo compartido para fortalecer los lazos entre colaboradores.',
        message: '¡Juntos somos más! El ICCU es familia.', date: '2025-05-23', attendees: 87, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/FFDD00/134174?text=Integraci%C3%B3n+1', 'https://placehold.co/600x400/D4AF37/134174?text=Integraci%C3%B3n+2', 'https://placehold.co/600x400/134174/FFDD00?text=Integraci%C3%B3n+3'],
      },
      {
        id: 'bl-act-2', subactivityId: 'bl-recrea',
        title: 'Torneo interno de microfútbol', description: 'Primera fase del torneo interno de microfútbol con 8 equipos representando las diferentes áreas del ICCU.',
        message: '¡El deporte une, la ICCU compite con lealtad!', date: '2025-05-30', attendees: 64, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/0087CF/FFDD00?text=Torneo+1', 'https://placehold.co/600x400/134174/0087CF?text=Torneo+2'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 65 }, { year: 2024, percentage: 83 }],
  },
  {
    id: 'clima-organizacional',
    name: 'Clima Organizacional',
    description: 'Medición, análisis e intervención del ambiente laboral para identificar fortalezas y oportunidades de mejora en la cultura organizacional del ICCU.',
    subactivities: [
      { id: 'co-encuesta', name: 'Encuestas de Clima', annualTarget: 2, executions: [{ date: '2025-03-01', count: 1 }] },
      { id: 'co-taller', name: 'Talleres de Mejora', annualTarget: 4, executions: [{ date: '2025-04-08', count: 1 }, { date: '2025-05-13', count: 1 }] },
    ],
    activities: [
      {
        id: 'co-act-1', subactivityId: 'co-encuesta',
        title: 'Encuesta de clima organizacional primer semestre', description: 'Aplicación de la encuesta anual de clima laboral con participación del 89% de los colaboradores.',
        message: 'Tu voz construye el ICCU del mañana. ¡Gracias por participar!', date: '2025-03-01', attendees: 124, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=Clima+Encuesta+1'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 80 }, { year: 2024, percentage: 88 }],
  },
  {
    id: 'capacitacion',
    name: 'Capacitación y Desarrollo',
    description: 'Plan de formación continua para fortalecer las competencias técnicas y transversales de los colaboradores del ICCU.',
    subactivities: [
      { id: 'cap-tecnica', name: 'Capacitaciones Técnicas', annualTarget: 18, executions: Array.from({ length: 8 }, (_, i) => ({ date: new Date(2025, 0, 20 + i * 20).toISOString().split('T')[0], count: 1 })) },
      { id: 'cap-trans', name: 'Formación Transversal', annualTarget: 8, executions: Array.from({ length: 3 }, (_, i) => ({ date: new Date(2025, i + 1, 10).toISOString().split('T')[0], count: 1 })) },
      { id: 'cap-virt', name: 'Cursos Virtuales', annualTarget: 30, executions: Array.from({ length: 12 }, (_, i) => ({ date: new Date(2025, Math.floor(i / 2), 5 + (i % 2) * 15).toISOString().split('T')[0], count: 1 })) },
    ],
    activities: [
      {
        id: 'cap-act-1', subactivityId: 'cap-tecnica',
        title: 'Diplomado en gestión vial — módulo 3', description: 'Tercer módulo del diplomado en gestión vial: mantenimiento rutinario y periódico de vías terciarias.',
        message: 'El conocimiento es la base de la excelencia en las obras del Departamento.', date: '2025-05-22', attendees: 22, departments: ['Ingeniería', 'Obras', 'Supervisión'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=Diplomado+1', 'https://placehold.co/600x400/0087CF/134174?text=Diplomado+2'],
      },
      {
        id: 'cap-act-2', subactivityId: 'cap-trans',
        title: 'Taller de comunicación asertiva', description: 'Formación en habilidades de comunicación efectiva para líderes de equipo y profesionales de área.',
        message: 'Comunicar bien es liderar mejor.', date: '2025-04-10', attendees: 31, departments: ['Talento Humano', 'Jurídica', 'Planeación'],
        photos: ['https://placehold.co/600x400/134174/FFDD00?text=Taller+Com+1'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 61 }, { year: 2024, percentage: 74 }],
  },
  {
    id: 'seleccion',
    name: 'Selección y Vinculación',
    description: 'Procesos de convocatoria, evaluación y vinculación del talento humano requerido por el ICCU, garantizando la idoneidad y transparencia en cada proceso.',
    subactivities: [
      { id: 'sel-conv', name: 'Convocatorias', annualTarget: 6, executions: [{ date: '2025-02-01', count: 1 }, { date: '2025-04-15', count: 1 }, { date: '2025-05-20', count: 1 }] },
      { id: 'sel-ind', name: 'Inducciones', annualTarget: 12, executions: Array.from({ length: 5 }, (_, i) => ({ date: new Date(2025, i, 28).toISOString().split('T')[0], count: 1 })) },
    ],
    activities: [
      {
        id: 'sel-act-1', subactivityId: 'sel-ind',
        title: 'Inducción nuevos colaboradores — mayo', description: 'Programa de inducción institucional para los 7 nuevos colaboradores que se integran al ICCU en mayo.',
        message: '¡Bienvenidos a la familia ICCU! Juntos construimos Cundinamarca.', date: '2025-05-28', attendees: 7, departments: ['Talento Humano'],
        photos: ['https://placehold.co/600x400/134174/FFDD00?text=Inducci%C3%B3n+1', 'https://placehold.co/600x400/D4AF37/134174?text=Inducci%C3%B3n+2'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 90 }, { year: 2024, percentage: 95 }],
  },
  {
    id: 'evaluacion',
    name: 'Evaluación de Desempeño',
    description: 'Sistema de evaluación y retroalimentación del desempeño de los colaboradores orientado a la mejora continua y el desarrollo profesional dentro del ICCU.',
    subactivities: [
      { id: 'ev-eval', name: 'Evaluaciones Anuales', annualTarget: 2, executions: [{ date: '2025-02-28', count: 1 }] },
      { id: 'ev-retro', name: 'Sesiones de Retroalimentación', annualTarget: 12, executions: Array.from({ length: 4 }, (_, i) => ({ date: new Date(2025, i + 1, 15).toISOString().split('T')[0], count: 1 })) },
    ],
    activities: [
      {
        id: 'ev-act-1', subactivityId: 'ev-eval',
        title: 'Evaluación de desempeño primer semestre', description: 'Proceso de evaluación del primer semestre con análisis de indicadores de gestión y metas individuales.',
        message: 'La evaluación es un camino de crecimiento, no un juicio.', date: '2025-02-28', attendees: 118, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=Evaluaci%C3%B3n+1'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 94 }, { year: 2024, percentage: 97 }],
  },
  {
    id: 'seguridad-industrial',
    name: 'Seguridad Industrial',
    description: 'Actividades de identificación y control de riesgos industriales en las obras y proyectos del ICCU para garantizar la integridad física de los trabajadores.',
    subactivities: [
      { id: 'si-insp', name: 'Inspecciones de Obra', annualTarget: 24, executions: Array.from({ length: 9 }, (_, i) => ({ date: new Date(2025, 0, 10 + i * 17).toISOString().split('T')[0], count: 1 })) },
      { id: 'si-epp', name: 'Entrega de EPP', annualTarget: 4, executions: [{ date: '2025-01-15', count: 1 }, { date: '2025-04-20', count: 1 }] },
    ],
    activities: [
      {
        id: 'si-act-1', subactivityId: 'si-insp',
        title: 'Inspección obras vía Zipaquirá-Ubaté', description: 'Inspección de condiciones de seguridad en el proyecto de rehabilitación de la vía Zipaquirá-Ubaté, km 12 al km 28.',
        message: 'Cero accidentes es nuestra meta. La seguridad no tiene precio.', date: '2025-05-30', attendees: 8, departments: ['Ingeniería', 'SST', 'Supervisión'],
        photos: ['https://placehold.co/600x400/E00914/134174?text=Inspecci%C3%B3n+Obra+1', 'https://placehold.co/600x400/134174/E00914?text=Inspecci%C3%B3n+Obra+2'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 68 }, { year: 2024, percentage: 79 }],
  },
  {
    id: 'medicina-preventiva',
    name: 'Medicina Preventiva',
    description: 'Programa de vigilancia epidemiológica y exámenes ocupacionales para la detección temprana y prevención de enfermedades laborales en el ICCU.',
    subactivities: [
      { id: 'mp-examen', name: 'Exámenes Ocupacionales', annualTarget: 140, executions: Array.from({ length: 62 }, (_, i) => ({ date: new Date(2025, Math.floor(i / 10), 5 + i % 28).toISOString().split('T')[0], count: 1 })) },
      { id: 'mp-vigi', name: 'Seguimiento Epidemiológico', annualTarget: 4, executions: [{ date: '2025-02-10', count: 1 }, { date: '2025-04-08', count: 1 }] },
    ],
    activities: [
      {
        id: 'mp-act-1', subactivityId: 'mp-examen',
        title: 'Jornada de exámenes médicos periódicos', description: 'Aplicación de exámenes médicos periódicos a colaboradores con más de un año de antigüedad.',
        message: 'Tu salud nos importa. El ICCU invierte en tu bienestar.', date: '2025-05-15', attendees: 34, departments: ['Obras', 'Ingeniería', 'Administrativo'],
        photos: ['https://placehold.co/600x400/0087CF/134174?text=Ex%C3%A1menes+1', 'https://placehold.co/600x400/134174/0087CF?text=Ex%C3%A1menes+2'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 70 }, { year: 2024, percentage: 81 }],
  },
  {
    id: 'recreacion',
    name: 'Recreación y Deporte',
    description: 'Programa de actividades recreativas, deportivas y culturales que promueven estilos de vida saludables y el esparcimiento de los colaboradores del ICCU.',
    subactivities: [
      { id: 'rec-dep', name: 'Actividades Deportivas', annualTarget: 8, executions: [{ date: '2025-02-28', count: 1 }, { date: '2025-03-28', count: 1 }, { date: '2025-04-25', count: 1 }, { date: '2025-05-30', count: 1 }] },
      { id: 'rec-cult', name: 'Actividades Culturales', annualTarget: 4, executions: [{ date: '2025-03-07', count: 1 }, { date: '2025-05-19', count: 1 }] },
    ],
    activities: [
      {
        id: 'rec-act-1', subactivityId: 'rec-dep',
        title: 'Final torneo de microfútbol ICCU 2025', description: 'Gran final del torneo interno de microfútbol con premiación y reconocimiento a los equipos participantes.',
        message: '¡El ICCU juega en equipo dentro y fuera de la cancha!', date: '2025-05-30', attendees: 95, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/134174/FFDD00?text=Final+Torneo+1', 'https://placehold.co/600x400/FFDD00/134174?text=Final+Torneo+2', 'https://placehold.co/600x400/D4AF37/134174?text=Final+Torneo+3'],
      },
      {
        id: 'rec-act-2', subactivityId: 'rec-cult',
        title: 'Muestra cultural: danzas folclóricas', description: 'Presentación de grupos de danza folclórica con participación de colaboradores y sus familias.',
        message: '¡Celebremos la riqueza cultural de Colombia!', date: '2025-05-19', attendees: 72, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/E00914/FFDD00?text=Danzas+1'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 75 }, { year: 2024, percentage: 88 }],
  },
  {
    id: 'apoyo-social',
    name: 'Apoyo Social',
    description: 'Programa de acompañamiento y apoyo a colaboradores que atraviesan situaciones de vulnerabilidad social, emocional o económica.',
    subactivities: [
      { id: 'as-aten', name: 'Atenciones Individuales', annualTarget: 60, executions: Array.from({ length: 28 }, (_, i) => ({ date: new Date(2025, Math.floor(i / 5), 5 + i % 28).toISOString().split('T')[0], count: 1 })) },
      { id: 'as-grupo', name: 'Talleres Grupales', annualTarget: 6, executions: [{ date: '2025-02-25', count: 1 }, { date: '2025-04-22', count: 1 }] },
    ],
    activities: [
      {
        id: 'as-act-1', subactivityId: 'as-grupo',
        title: 'Taller: manejo del estrés y resiliencia', description: 'Taller grupal de herramientas de manejo emocional y desarrollo de resiliencia personal y laboral.',
        message: 'El ICCU te acompaña. Juntos somos más fuertes.', date: '2025-04-22', attendees: 16, departments: ['Talento Humano', 'Financiero', 'Contratos'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=Taller+Estr%C3%A9s+1', 'https://placehold.co/600x400/0087CF/134174?text=Taller+Estr%C3%A9s+2'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 55 }, { year: 2024, percentage: 72 }],
  },
  {
    id: 'gestion-conocimiento',
    name: 'Gestión del Conocimiento',
    description: 'Iniciativas para capturar, documentar y transferir el conocimiento institucional del ICCU, promoviendo la innovación y la mejora continua de los procesos.',
    subactivities: [
      { id: 'gc-doc', name: 'Documentación de Procesos', annualTarget: 10, executions: Array.from({ length: 4 }, (_, i) => ({ date: new Date(2025, i, 20).toISOString().split('T')[0], count: 1 })) },
      { id: 'gc-trans', name: 'Transferencia de Conocimiento', annualTarget: 6, executions: [{ date: '2025-03-18', count: 1 }, { date: '2025-05-06', count: 1 }] },
    ],
    activities: [
      {
        id: 'gc-act-1', subactivityId: 'gc-trans',
        title: 'Comunidad de práctica: gestión de proyectos', description: 'Espacio de intercambio de experiencias y lecciones aprendidas entre profesionales de proyectos del ICCU.',
        message: 'El conocimiento compartido multiplica el valor de todos.', date: '2025-05-06', attendees: 24, departments: ['Ingeniería', 'Planeación', 'Obras'],
        photos: ['https://placehold.co/600x400/134174/FFDD00?text=Com+Pr%C3%A1ctica+1', 'https://placehold.co/600x400/D4AF37/134174?text=Com+Pr%C3%A1ctica+2'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 45 }, { year: 2024, percentage: 60 }],
  },
  {
    id: 'cultura-organizacional',
    name: 'Cultura Organizacional',
    description: 'Fortalecimiento de la identidad institucional y los valores corporativos del ICCU a través de iniciativas que promueven el sentido de pertenencia y la cohesión del equipo.',
    subactivities: [
      { id: 'co2-iden', name: 'Talleres de Identidad', annualTarget: 4, executions: [{ date: '2025-03-12', count: 1 }, { date: '2025-05-14', count: 1 }] },
      { id: 'co2-val', name: 'Vivencia de Valores', annualTarget: 6, executions: [{ date: '2025-02-07', count: 1 }, { date: '2025-04-03', count: 1 }] },
    ],
    activities: [
      {
        id: 'co2-act-1', subactivityId: 'co2-iden',
        title: 'Taller de identidad institucional ICCU', description: 'Espacio participativo para fortalecer el conocimiento y apropiación de la misión, visión y valores del ICCU.',
        message: 'Somos ICCU: construimos infraestructura y futuro para Cundinamarca.', date: '2025-05-14', attendees: 45, departments: ['Todos los procesos'],
        photos: ['https://placehold.co/600x400/134174/D4AF37?text=Cultura+1', 'https://placehold.co/600x400/D4AF37/134174?text=Cultura+2'],
      },
    ],
    historicalPercentages: [{ year: 2023, percentage: 52 }, { year: 2024, percentage: 68 }],
  },
];

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

export function getProcessById(id: string): Process | undefined {
  return PROCESSES.find(p => p.id === id);
}
