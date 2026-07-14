-- Marca de subactividad hardcodeada: el admin no puede borrarla, pero sí
-- parametriza su meta anual y puede seguir agregando otras subactividades.
ALTER TABLE "Subactivity" ADD COLUMN "isFixed" BOOLEAN NOT NULL DEFAULT false;

-- Clima Organizacional deja de ser un proceso: se absorbe como la subactividad
-- fija "Cultura Organizacional" de Salud Mental, y su provincia
-- (magdalena-centro) pasa a ser el proceso Incentivos.
--
-- Todas las FKs contra Process("id") son ON UPDATE CASCADE, así que las filas
-- hijas (subactividades, actividades, históricos, ausencias) siguen al nuevo id.
UPDATE "Process"
SET id          = 'incentivos',
    name        = 'Incentivos',
    description = 'Reconocimiento al desempeño y la permanencia de los colaboradores del ICCU mediante estímulos pecuniarios y no pecuniarios.'
WHERE id = 'clima-organizacional';

-- Subactividades fijas (mismas que crea el seed).
INSERT INTO "Subactivity" ("id", "processId", "name", "isFixed") VALUES
  ('sm-cultura-organizacional', 'salud-mental', 'Cultura Organizacional', true),
  ('inc-pecuniarios',           'incentivos',   'Pecuniarios',            true),
  ('inc-no-pecuniarios',        'incentivos',   'No Pecuniarios',         true)
ON CONFLICT ("id") DO NOTHING;
