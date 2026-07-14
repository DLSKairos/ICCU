-- Elimina los porcentajes históricos de demo (2023 y 2024) que insertaba el seed.
-- El dashboard arranca sin histórico: a partir de ahora estas tablas solo se
-- llenan cuando el reinicio anual cierra un año (ver annual-reset.service).
--
-- No afecta a AbsenceRecord, Activity ni Execution: son tablas distintas y sus
-- datos reales quedan intactos.

DELETE FROM "HistoricalPercentageSubactivity";

DELETE FROM "HistoricalPercentage";
