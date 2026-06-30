import { PrismaClient, ProcessType } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();


const PROCESSES: Array<{ id: string; name: string; provinceId: string; description: string; type?: ProcessType }> = [
  { id: 'fechas-especiales',      name: 'Fechas Especiales',                    provinceId: 'bajo-magdalena',   description: 'Espacios programados de descanso activo para promover la salud física y mental de los colaboradores durante la jornada laboral.' },
  { id: 'feria-servicios',        name: 'Feria de Servicios',                   provinceId: 'ubate',            description: 'Celebración mensual de los cumpleaños de los colaboradores del ICCU, fomentando el sentido de pertenencia y el bienestar institucional.' },
  { id: 'salud-mental',           name: 'Salud Mental',                         provinceId: 'almeidas',         description: 'Programa bisemanal de actividad física y bienestar que convoca a los colaboradores los días lunes y miércoles.' },
  { id: 'actividades-deportivas', name: 'Actividades Deportivas y Recreativas', provinceId: 'guavio',           description: 'Jornada anual de valoraciones médicas, actividades preventivas y promoción de hábitos saludables para todos los colaboradores del ICCU.' },
  { id: 'dia-salud-sst',          name: 'Día de la Salud - SST',                provinceId: 'medina',           description: 'Sistema de Gestión de Seguridad y Salud en el Trabajo. Implementación de actividades de prevención, capacitación e inspección.' },
  { id: 'pre-pensionados',        name: 'Pre pensionados',                      provinceId: 'rionegro',         description: 'Medición, análisis e intervención del ambiente laboral para identificar fortalezas y oportunidades de mejora.' },
  { id: 'clima-organizacional',   name: 'Clima Organizacional',                 provinceId: 'magdalena-centro', description: 'Plan de formación continua para fortalecer las competencias técnicas y transversales de los colaboradores del ICCU.' },
  { id: 'teletrabajo',            name: 'Teletrabajo y Trabajo en Casa',        provinceId: 'gualiva',          description: 'Procesos de convocatoria, evaluación y vinculación del talento humano requerido por el ICCU.' },
  { id: 'capacitaciones',         name: 'Capacitaciones',                       provinceId: 'sabana-centro',    description: 'Sistema de evaluación y retroalimentación del desempeño orientado a la mejora continua y el desarrollo profesional.' },
  { id: 'atencion-psicosocial',   name: 'Atención Psicosocial',                 provinceId: 'sabana-occidente', description: 'Actividades de identificación y control de riesgos industriales en las obras y proyectos del ICCU.' },
  { id: 'medicina-preventiva',    name: 'Ausentismo',                           provinceId: 'soacha',           description: 'Control y seguimiento de ausencias laborales: incapacidades, permisos y licencias de los colaboradores del ICCU.', type: ProcessType.AUSENTISMO },
  { id: 'copasst',                name: 'COPASST',                              provinceId: 'tequendama',       description: 'Programa de actividades recreativas, deportivas y culturales que promueven estilos de vida saludables.' },
  { id: 'comite-convivencia',     name: 'Comité de Convivencia Laboral',        provinceId: 'alto-magdalena',   description: 'Programa de acompañamiento y apoyo a colaboradores que atraviesan situaciones de vulnerabilidad social, emocional o económica.' },
  { id: 'atencion-emergencias',   name: 'Atención de Emergencias',              provinceId: 'sumapaz',          description: 'Iniciativas para capturar, documentar y transferir el conocimiento institucional del ICCU.' },
  { id: 'seguridad-vial',         name: 'Seguridad Vial',                       provinceId: 'nueva-provincia',  description: 'Fortalecimiento de la identidad institucional y los valores corporativos del ICCU.' },
];

const HISTORICAL: Array<{ processId: string; year: number; percentage: number }> = [
  { processId: 'fechas-especiales',      year: 2023, percentage: 78  }, { processId: 'fechas-especiales',      year: 2024, percentage: 91  },
  { processId: 'feria-servicios',        year: 2023, percentage: 100 }, { processId: 'feria-servicios',        year: 2024, percentage: 100 },
  { processId: 'salud-mental',           year: 2023, percentage: 85  }, { processId: 'salud-mental',           year: 2024, percentage: 89  },
  { processId: 'actividades-deportivas', year: 2023, percentage: 100 }, { processId: 'actividades-deportivas', year: 2024, percentage: 100 },
  { processId: 'dia-salud-sst',          year: 2023, percentage: 72  }, { processId: 'dia-salud-sst',          year: 2024, percentage: 87  },
  { processId: 'pre-pensionados',        year: 2023, percentage: 80  }, { processId: 'pre-pensionados',        year: 2024, percentage: 88  },
  { processId: 'clima-organizacional',   year: 2023, percentage: 61  }, { processId: 'clima-organizacional',   year: 2024, percentage: 74  },
  { processId: 'teletrabajo',            year: 2023, percentage: 90  }, { processId: 'teletrabajo',            year: 2024, percentage: 95  },
  { processId: 'capacitaciones',         year: 2023, percentage: 94  }, { processId: 'capacitaciones',         year: 2024, percentage: 97  },
  { processId: 'atencion-psicosocial',   year: 2023, percentage: 68  }, { processId: 'atencion-psicosocial',   year: 2024, percentage: 79  },
  { processId: 'medicina-preventiva',    year: 2023, percentage: 70  }, { processId: 'medicina-preventiva',    year: 2024, percentage: 81  },
  { processId: 'copasst',                year: 2023, percentage: 75  }, { processId: 'copasst',                year: 2024, percentage: 88  },
  { processId: 'comite-convivencia',     year: 2023, percentage: 55  }, { processId: 'comite-convivencia',     year: 2024, percentage: 72  },
  { processId: 'atencion-emergencias',   year: 2023, percentage: 45  }, { processId: 'atencion-emergencias',   year: 2024, percentage: 60  },
  { processId: 'seguridad-vial',         year: 2023, percentage: 52  }, { processId: 'seguridad-vial',         year: 2024, percentage: 68  },
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

  // Eliminar procesos que ya no están en la lista (limpieza de obsoletos)
  const knownIds = PROCESSES.map(p => p.id);
  await prisma.process.deleteMany({ where: { id: { notIn: knownIds } } });

  // Upsert procesos
  for (const p of PROCESSES) {
    await prisma.process.upsert({
      where: { id: p.id },
      update: { name: p.name, description: p.description, provinceId: p.provinceId, type: p.type ?? ProcessType.STANDARD },
      create: { ...p, type: p.type ?? ProcessType.STANDARD },
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

  // ── Importar catálogo CIE-10 (solo si la tabla está vacía) ──────────────────
  const cie10Count = await prisma.cie10Code.count();
  if (cie10Count === 0) {
    const cie10Raw = readFileSync(join(__dirname, 'cie10_codes.json'), 'utf-8');
    const cie10Codes: { code: string; description: string }[] = JSON.parse(cie10Raw);
    // Insertar en lotes de 500 para no saturar la conexión
    const batchSize = 500;
    for (let i = 0; i < cie10Codes.length; i += batchSize) {
      await prisma.cie10Code.createMany({
        data: cie10Codes.slice(i, i + batchSize),
        skipDuplicates: true,
      });
    }
    console.log(`OK: ${cie10Codes.length} códigos CIE-10 importados`);
  } else {
    console.log(`OK: catálogo CIE-10 ya presente (${cie10Count} códigos)`);
  }

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
