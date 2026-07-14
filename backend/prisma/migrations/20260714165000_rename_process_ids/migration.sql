-- Renombra los ids de los 15 procesos al juego de slugs actual.
--
-- El commit "cambio de provincias" cambió los ids en el seed (pausas-activas →
-- fechas-especiales, lunes-miercoles → salud-mental, etc.) sin migración. Las
-- bases creadas desde cero ya tienen los ids nuevos, pero las que venían de
-- antes conservan los viejos, y con ellos: (a) el alcance de provincias de los
-- operadores (backend/src/auth/users.config.ts) no coincide con nada, y (b) la
-- migración siguiente (incentivos) rompe porque referencia 'salud-mental'.
--
-- Cada UPDATE va anclado al provinceId, que es lo único que nunca cambió, y
-- filtra por el id viejo. En una base que ya tiene los ids nuevos ninguna fila
-- coincide y la migración no hace nada: es segura de aplicar en cualquier caso.
--
-- Las FKs contra Process("id") son ON UPDATE CASCADE, así que subactividades,
-- actividades, ejecuciones, históricos y ausencias siguen a su proceso.

-- ORDEN IMPORTANTE: 'clima-organizacional' existe en los dos juegos de ids pero
-- en provincias distintas (rionegro en el viejo, magdalena-centro en el nuevo).
-- Primero se libera el id renombrando el de rionegro; si se hiciera al revés,
-- el UPDATE chocaría contra la llave primaria.
UPDATE "Process" SET
  id          = 'pre-pensionados',
  name        = 'Pre pensionados',
  description = 'Medición, análisis e intervención del ambiente laboral para identificar fortalezas y oportunidades de mejora.'
WHERE id = 'clima-organizacional' AND "provinceId" = 'rionegro';

-- Magdalena Centro solo cambia de id: la migración siguiente lo convierte en
-- 'incentivos' y le pone su nombre y descripción definitivos.
UPDATE "Process" SET id = 'clima-organizacional'
WHERE id = 'capacitacion' AND "provinceId" = 'magdalena-centro';

UPDATE "Process" SET
  id          = 'fechas-especiales',
  name        = 'Fechas Especiales',
  description = 'Espacios programados de descanso activo para promover la salud física y mental de los colaboradores durante la jornada laboral.'
WHERE id = 'pausas-activas' AND "provinceId" = 'bajo-magdalena';

UPDATE "Process" SET
  id          = 'feria-servicios',
  name        = 'Feria de Servicios',
  description = 'Celebración mensual de los cumpleaños de los colaboradores del ICCU, fomentando el sentido de pertenencia y el bienestar institucional.'
WHERE id = 'cumpleanos' AND "provinceId" = 'ubate';

UPDATE "Process" SET
  id          = 'salud-mental',
  name        = 'Salud Mental',
  description = 'Programa bisemanal de actividad física y bienestar que convoca a los colaboradores los días lunes y miércoles.'
WHERE id = 'lunes-miercoles' AND "provinceId" = 'almeidas';

UPDATE "Process" SET
  id          = 'actividades-deportivas',
  name        = 'Actividades Deportivas y Recreativas',
  description = 'Jornada anual de valoraciones médicas, actividades preventivas y promoción de hábitos saludables para todos los colaboradores del ICCU.'
WHERE id = 'dia-salud' AND "provinceId" = 'guavio';

UPDATE "Process" SET
  id          = 'dia-salud-sst',
  name        = 'Día de la Salud - SST',
  description = 'Sistema de Gestión de Seguridad y Salud en el Trabajo. Implementación de actividades de prevención, capacitación e inspección.'
WHERE id = 'sst' AND "provinceId" = 'medina';

UPDATE "Process" SET
  id          = 'teletrabajo',
  name        = 'Teletrabajo y Trabajo en Casa',
  description = 'Procesos de convocatoria, evaluación y vinculación del talento humano requerido por el ICCU.'
WHERE id = 'seleccion' AND "provinceId" = 'gualiva';

UPDATE "Process" SET
  id          = 'capacitaciones',
  name        = 'Capacitaciones',
  description = 'Sistema de evaluación y retroalimentación del desempeño orientado a la mejora continua y el desarrollo profesional.'
WHERE id = 'evaluacion' AND "provinceId" = 'sabana-centro';

UPDATE "Process" SET
  id          = 'atencion-psicosocial',
  name        = 'Atención Psicosocial',
  description = 'Actividades de identificación y control de riesgos industriales en las obras y proyectos del ICCU.'
WHERE id = 'seguridad-industrial' AND "provinceId" = 'sabana-occidente';

UPDATE "Process" SET
  id          = 'copasst',
  name        = 'COPASST',
  description = 'Programa de actividades recreativas, deportivas y culturales que promueven estilos de vida saludables.'
WHERE id = 'recreacion' AND "provinceId" = 'tequendama';

UPDATE "Process" SET
  id          = 'comite-convivencia',
  name        = 'Comité de Convivencia Laboral',
  description = 'Programa de acompañamiento y apoyo a colaboradores que atraviesan situaciones de vulnerabilidad social, emocional o económica.'
WHERE id = 'apoyo-social' AND "provinceId" = 'alto-magdalena';

UPDATE "Process" SET
  id          = 'atencion-emergencias',
  name        = 'Atención de Emergencias',
  description = 'Iniciativas para capturar, documentar y transferir el conocimiento institucional del ICCU.'
WHERE id = 'gestion-conocimiento' AND "provinceId" = 'sumapaz';

UPDATE "Process" SET
  id          = 'seguridad-vial',
  name        = 'Seguridad Vial',
  description = 'Fortalecimiento de la identidad institucional y los valores corporativos del ICCU.'
WHERE id = 'cultura-organizacional' AND "provinceId" = 'nueva-provincia';

-- Soacha (medicina-preventiva, Ausentismo) conserva su id: no cambió.
