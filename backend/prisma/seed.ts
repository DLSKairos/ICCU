import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


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

  // Limpiar datos preservando solo los Procesos (idempotente para fresh install)
  await prisma.$transaction([
    prisma.activityPhoto.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.execution.deleteMany(),
    prisma.historicalPercentageSubactivity.deleteMany(),
    prisma.annualTarget.deleteMany(),
    prisma.subactivity.deleteMany(),
    prisma.historicalPercentage.deleteMany(),
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
