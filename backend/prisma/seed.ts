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
  { id: 'incentivos',             name: 'Incentivos',                           provinceId: 'magdalena-centro', description: 'Reconocimiento al desempeño y la permanencia de los colaboradores del ICCU mediante estímulos pecuniarios y no pecuniarios.' },
  { id: 'teletrabajo',            name: 'Teletrabajo y Trabajo en Casa',        provinceId: 'gualiva',          description: 'Procesos de convocatoria, evaluación y vinculación del talento humano requerido por el ICCU.' },
  { id: 'capacitaciones',         name: 'Capacitaciones',                       provinceId: 'sabana-centro',    description: 'Sistema de evaluación y retroalimentación del desempeño orientado a la mejora continua y el desarrollo profesional.' },
  { id: 'atencion-psicosocial',   name: 'Atención Psicosocial',                 provinceId: 'sabana-occidente', description: 'Actividades de identificación y control de riesgos industriales en las obras y proyectos del ICCU.' },
  { id: 'medicina-preventiva',    name: 'Ausentismo',                           provinceId: 'soacha',           description: 'Control y seguimiento de ausencias laborales: incapacidades, permisos y licencias de los colaboradores del ICCU.', type: ProcessType.AUSENTISMO },
  { id: 'copasst',                name: 'COPASST',                              provinceId: 'tequendama',       description: 'Programa de actividades recreativas, deportivas y culturales que promueven estilos de vida saludables.' },
  { id: 'comite-convivencia',     name: 'Comité de Convivencia Laboral',        provinceId: 'alto-magdalena',   description: 'Programa de acompañamiento y apoyo a colaboradores que atraviesan situaciones de vulnerabilidad social, emocional o económica.' },
  { id: 'atencion-emergencias',   name: 'Atención de Emergencias',              provinceId: 'sumapaz',          description: 'Iniciativas para capturar, documentar y transferir el conocimiento institucional del ICCU.' },
  { id: 'seguridad-vial',         name: 'Seguridad Vial',                       provinceId: 'nueva-provincia',  description: 'Fortalecimiento de la identidad institucional y los valores corporativos del ICCU.' },
];

// Subactividades hardcodeadas. El admin no puede borrarlas: solo parametriza su
// meta anual. Puede agregar libremente otras subactividades a estos procesos.
const FIXED_SUBACTIVITIES: Array<{ id: string; processId: string; name: string }> = [
  { id: 'sm-cultura-organizacional', processId: 'salud-mental', name: 'Cultura Organizacional' },
  { id: 'inc-pecuniarios',           processId: 'incentivos',   name: 'Pecuniarios' },
  { id: 'inc-no-pecuniarios',        processId: 'incentivos',   name: 'No Pecuniarios' },
];

// El dashboard arranca sin histórico: los porcentajes anuales solo se crean
// cuando el reinicio anual cierra un año (ver annual-reset.service).

async function main() {
  console.log('Iniciando seed ICCU...');

  // Limpiar todos los datos dependientes antes de recrear procesos
  await prisma.$transaction([
    prisma.activityPhoto.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.execution.deleteMany(),
    prisma.historicalPercentageSubactivity.deleteMany(),
    prisma.annualTarget.deleteMany(),
    prisma.subactivity.deleteMany(),
    prisma.historicalPercentage.deleteMany(),
    prisma.absenceRecord.deleteMany(),
  ]);

  // Borrar todos los procesos para permitir recrearlos con IDs limpios
  await prisma.process.deleteMany();

  // Upsert procesos
  for (const p of PROCESSES) {
    await prisma.process.upsert({
      where: { id: p.id },
      update: { name: p.name, description: p.description, provinceId: p.provinceId, type: p.type ?? ProcessType.STANDARD },
      create: { ...p, type: p.type ?? ProcessType.STANDARD },
    });
  }
  console.log(`OK: ${PROCESSES.length} procesos`);

  // Upsert subactividades fijas. Sin meta anual: la parametriza el admin.
  for (const s of FIXED_SUBACTIVITIES) {
    await prisma.subactivity.upsert({
      where: { id: s.id },
      update: { processId: s.processId, name: s.name, isFixed: true },
      create: { ...s, isFixed: true },
    });
  }
  console.log(`OK: ${FIXED_SUBACTIVITIES.length} subactividades fijas`);

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
