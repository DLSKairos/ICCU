import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROVINCE_TO_PROCESS: Record<string, string> = {
  'bajo-magdalena':   'pausas-activas',
  'ubate':            'cumpleanos',
  'almeidas':         'lunes-miercoles',
  'guavio':           'dia-salud',
  'medina':           'sst',
  'oriente':          'bienestar-laboral',
  'rionegro':         'clima-organizacional',
  'magdalena-centro': 'capacitacion',
  'gualiva':          'seleccion',
  'sabana-centro':    'evaluacion',
  'sabana-occidente': 'seguridad-industrial',
  'soacha':           'medicina-preventiva',
  'tequendama':       'recreacion',
  'alto-magdalena':   'apoyo-social',
  'sumapaz':          'gestion-conocimiento',
  'nueva-provincia':  'cultura-organizacional',
};

const PROCESSES = [
  { id: 'pausas-activas',       name: 'Pausas Activas',              provinceId: 'bajo-magdalena',   description: 'Espacios programados de descanso activo para promover la salud física y mental de los colaboradores durante la jornada laboral.' },
  { id: 'cumpleanos',           name: 'Cumpleaños',                   provinceId: 'ubate',            description: 'Celebración mensual de los cumpleaños de los colaboradores del ICCU, fomentando el sentido de pertenencia y el bienestar institucional.' },
  { id: 'lunes-miercoles',      name: 'Lunes y Miércoles de Actívate', provinceId: 'almeidas',        description: 'Programa bisemanal de actividad física y bienestar que convoca a los colaboradores los días lunes y miércoles.' },
  { id: 'dia-salud',            name: 'Día de la Salud',              provinceId: 'guavio',           description: 'Jornada anual de valoraciones médicas, actividades preventivas y promoción de hábitos saludables para todos los colaboradores del ICCU.' },
  { id: 'sst',                  name: 'SST',                          provinceId: 'medina',           description: 'Sistema de Gestión de Seguridad y Salud en el Trabajo. Implementación de actividades de prevención, capacitación e inspección.' },
  { id: 'bienestar-laboral',    name: 'Bienestar Laboral',            provinceId: 'oriente',          description: 'Actividades orientadas a mejorar la calidad de vida y el sentido de pertenencia de los colaboradores.' },
  { id: 'clima-organizacional', name: 'Clima Organizacional',         provinceId: 'rionegro',         description: 'Medición, análisis e intervención del ambiente laboral para identificar fortalezas y oportunidades de mejora.' },
  { id: 'capacitacion',         name: 'Capacitación y Desarrollo',    provinceId: 'magdalena-centro', description: 'Plan de formación continua para fortalecer las competencias técnicas y transversales de los colaboradores del ICCU.' },
  { id: 'seleccion',            name: 'Selección y Vinculación',      provinceId: 'gualiva',          description: 'Procesos de convocatoria, evaluación y vinculación del talento humano requerido por el ICCU.' },
  { id: 'evaluacion',           name: 'Evaluación de Desempeño',      provinceId: 'sabana-centro',    description: 'Sistema de evaluación y retroalimentación del desempeño orientado a la mejora continua y el desarrollo profesional.' },
  { id: 'seguridad-industrial', name: 'Seguridad Industrial',         provinceId: 'sabana-occidente', description: 'Actividades de identificación y control de riesgos industriales en las obras y proyectos del ICCU.' },
  { id: 'medicina-preventiva',  name: 'Medicina Preventiva',          provinceId: 'soacha',           description: 'Programa de vigilancia epidemiológica y exámenes ocupacionales para la detección temprana de enfermedades laborales.' },
  { id: 'recreacion',           name: 'Recreación y Deporte',         provinceId: 'tequendama',       description: 'Programa de actividades recreativas, deportivas y culturales que promueven estilos de vida saludables.' },
  { id: 'apoyo-social',         name: 'Apoyo Social',                 provinceId: 'alto-magdalena',   description: 'Programa de acompañamiento y apoyo a colaboradores que atraviesan situaciones de vulnerabilidad social, emocional o económica.' },
  { id: 'gestion-conocimiento', name: 'Gestión del Conocimiento',     provinceId: 'sumapaz',          description: 'Iniciativas para capturar, documentar y transferir el conocimiento institucional del ICCU.' },
  { id: 'cultura-organizacional', name: 'Cultura Organizacional',     provinceId: 'nueva-provincia',  description: 'Fortalecimiento de la identidad institucional y los valores corporativos del ICCU.' },
];

const SUBACTIVITIES: Array<{ id: string; processId: string; name: string; target2025: number }> = [
  { id: 'pa-sesiones',         processId: 'pausas-activas',       name: 'Sesiones de Pausa Activa',         target2025: 156 },
  { id: 'cum-celebraciones',   processId: 'cumpleanos',           name: 'Celebraciones Mensuales',           target2025: 12  },
  { id: 'lm-sesiones',         processId: 'lunes-miercoles',      name: 'Sesiones Lunes/Miércoles',          target2025: 96  },
  { id: 'ds-jornada',          processId: 'dia-salud',            name: 'Jornada de Salud',                  target2025: 2   },
  { id: 'ds-taller',           processId: 'dia-salud',            name: 'Talleres Preventivos',              target2025: 4   },
  { id: 'sst-cap',             processId: 'sst',                  name: 'Capacitaciones SST',                target2025: 24  },
  { id: 'sst-insp',            processId: 'sst',                  name: 'Inspecciones de Seguridad',         target2025: 12  },
  { id: 'sst-sim',             processId: 'sst',                  name: 'Simulacros de Emergencia',          target2025: 2   },
  { id: 'bl-integra',          processId: 'bienestar-laboral',    name: 'Jornadas de Integración',           target2025: 4   },
  { id: 'bl-recrea',           processId: 'bienestar-laboral',    name: 'Actividades Recreativas',           target2025: 6   },
  { id: 'co-encuesta',         processId: 'clima-organizacional', name: 'Encuestas de Clima',                target2025: 2   },
  { id: 'co-taller',           processId: 'clima-organizacional', name: 'Talleres de Mejora',                target2025: 4   },
  { id: 'cap-tecnica',         processId: 'capacitacion',         name: 'Capacitaciones Técnicas',           target2025: 18  },
  { id: 'cap-trans',           processId: 'capacitacion',         name: 'Formación Transversal',             target2025: 8   },
  { id: 'cap-virt',            processId: 'capacitacion',         name: 'Cursos Virtuales',                  target2025: 30  },
  { id: 'sel-conv',            processId: 'seleccion',            name: 'Convocatorias',                     target2025: 6   },
  { id: 'sel-ind',             processId: 'seleccion',            name: 'Inducciones',                       target2025: 12  },
  { id: 'ev-eval',             processId: 'evaluacion',           name: 'Evaluaciones Anuales',              target2025: 2   },
  { id: 'ev-retro',            processId: 'evaluacion',           name: 'Sesiones de Retroalimentación',    target2025: 12  },
  { id: 'si-insp',             processId: 'seguridad-industrial', name: 'Inspecciones de Obra',              target2025: 24  },
  { id: 'si-epp',              processId: 'seguridad-industrial', name: 'Entrega de EPP',                    target2025: 4   },
  { id: 'mp-examen',           processId: 'medicina-preventiva',  name: 'Exámenes Ocupacionales',            target2025: 140 },
  { id: 'mp-vigi',             processId: 'medicina-preventiva',  name: 'Seguimiento Epidemiológico',        target2025: 4   },
  { id: 'rec-dep',             processId: 'recreacion',           name: 'Actividades Deportivas',            target2025: 8   },
  { id: 'rec-cult',            processId: 'recreacion',           name: 'Actividades Culturales',            target2025: 4   },
  { id: 'as-aten',             processId: 'apoyo-social',         name: 'Atenciones Individuales',           target2025: 60  },
  { id: 'as-grupo',            processId: 'apoyo-social',         name: 'Talleres Grupales',                 target2025: 6   },
  { id: 'gc-doc',              processId: 'gestion-conocimiento', name: 'Documentación de Procesos',         target2025: 10  },
  { id: 'gc-trans',            processId: 'gestion-conocimiento', name: 'Transferencia de Conocimiento',     target2025: 6   },
  { id: 'co2-iden',            processId: 'cultura-organizacional', name: 'Talleres de Identidad',           target2025: 4   },
  { id: 'co2-val',             processId: 'cultura-organizacional', name: 'Vivencia de Valores',             target2025: 6   },
];

const HISTORICAL: Array<{ processId: string; year: number; percentage: number }> = [
  { processId: 'pausas-activas',        year: 2023, percentage: 78  }, { processId: 'pausas-activas',        year: 2024, percentage: 91  },
  { processId: 'cumpleanos',            year: 2023, percentage: 100 }, { processId: 'cumpleanos',            year: 2024, percentage: 100 },
  { processId: 'lunes-miercoles',       year: 2023, percentage: 85  }, { processId: 'lunes-miercoles',       year: 2024, percentage: 89  },
  { processId: 'dia-salud',            year: 2023, percentage: 100 }, { processId: 'dia-salud',            year: 2024, percentage: 100 },
  { processId: 'sst',                   year: 2023, percentage: 72  }, { processId: 'sst',                   year: 2024, percentage: 87  },
  { processId: 'bienestar-laboral',     year: 2023, percentage: 65  }, { processId: 'bienestar-laboral',     year: 2024, percentage: 83  },
  { processId: 'clima-organizacional',  year: 2023, percentage: 80  }, { processId: 'clima-organizacional',  year: 2024, percentage: 88  },
  { processId: 'capacitacion',          year: 2023, percentage: 61  }, { processId: 'capacitacion',          year: 2024, percentage: 74  },
  { processId: 'seleccion',             year: 2023, percentage: 90  }, { processId: 'seleccion',             year: 2024, percentage: 95  },
  { processId: 'evaluacion',            year: 2023, percentage: 94  }, { processId: 'evaluacion',            year: 2024, percentage: 97  },
  { processId: 'seguridad-industrial',  year: 2023, percentage: 68  }, { processId: 'seguridad-industrial',  year: 2024, percentage: 79  },
  { processId: 'medicina-preventiva',   year: 2023, percentage: 70  }, { processId: 'medicina-preventiva',   year: 2024, percentage: 81  },
  { processId: 'recreacion',            year: 2023, percentage: 75  }, { processId: 'recreacion',            year: 2024, percentage: 88  },
  { processId: 'apoyo-social',          year: 2023, percentage: 55  }, { processId: 'apoyo-social',          year: 2024, percentage: 72  },
  { processId: 'gestion-conocimiento',  year: 2023, percentage: 45  }, { processId: 'gestion-conocimiento',  year: 2024, percentage: 60  },
  { processId: 'cultura-organizacional',year: 2023, percentage: 52  }, { processId: 'cultura-organizacional',year: 2024, percentage: 68  },
];

async function main() {
  console.log('Iniciando seed ICCU...');

  // Limpiar datos con UUID primero (idempotente)
  await prisma.$transaction([
    prisma.historicalPercentageSubactivity.deleteMany(),
    prisma.historicalPercentage.deleteMany(),
    prisma.annualTarget.deleteMany(),
  ]);

  // Upsert procesos
  for (const p of PROCESSES) {
    await prisma.process.upsert({
      where: { id: p.id },
      update: { name: p.name, description: p.description, provinceId: p.provinceId },
      create: p,
    });
  }
  console.log(`OK: ${PROCESSES.length} procesos`);

  // Upsert subactividades
  for (const s of SUBACTIVITIES) {
    await prisma.subactivity.upsert({
      where: { id: s.id },
      update: { name: s.name, processId: s.processId },
      create: { id: s.id, processId: s.processId, name: s.name },
    });
  }
  console.log(`OK: ${SUBACTIVITIES.length} subactividades`);

  // Crear AnnualTargets 2025 (uno por subactividad)
  for (const s of SUBACTIVITIES) {
    await prisma.annualTarget.upsert({
      where: { subactivityId_year: { subactivityId: s.id, year: 2025 } },
      update: { target: s.target2025 },
      create: { subactivityId: s.id, year: 2025, target: s.target2025, isLocked: false },
    });
  }
  console.log(`OK: ${SUBACTIVITIES.length} metas 2025`);

  // Crear históricos 2023 y 2024
  for (const h of HISTORICAL) {
    await prisma.historicalPercentage.upsert({
      where: { processId_year: { processId: h.processId, year: h.year } },
      update: { percentage: h.percentage },
      create: h,
    });
  }
  console.log(`OK: ${HISTORICAL.length} registros históricos`);

  console.log('');
  console.log('Seed completado exitosamente');
  console.log('');
  console.log('Para aplicar la migración y seed con Docker:');
  console.log('  docker-compose exec backend npx prisma migrate dev --name init');
  console.log('  docker-compose exec backend npx prisma db seed');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
