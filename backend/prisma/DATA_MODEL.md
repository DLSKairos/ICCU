# Modelo de Datos — ICCU Dashboard Talento Humano

## Diagrama de entidades

```
Process (15 fijos, seed)
│  id: String (slug)         "pausas-activas"
│  provinceId: String        "bajo-magdalena"
│  name: String
│  description: String
│
├──< Subactivity (N por proceso)
│      id: String (slug)     "pa-sesiones"
│      processId: FK→Process
│      name: String
│      │
│      ├──< AnnualTarget (1 por año)
│      │      subactivityId: FK→Subactivity
│      │      year: Int
│      │      target: Int
│      │      isLocked: Boolean
│      │
│      ├──< Execution (N por año)
│      │      subactivityId: FK→Subactivity
│      │      year: Int
│      │      date: Date
│      │      count: Int
│      │
│      └──< HistoricalPercentageSubactivity (permanente)
│             subactivityId: FK→Subactivity
│             year: Int
│             percentage: Float
│
├──< Activity (N por año)
│      processId: FK→Process
│      subactivityId: FK→Subactivity
│      year: Int
│      title, description, message: String
│      date: Date
│      attendees: Int
│      departments: String[]
│      │
│      └──< ActivityPhoto (N por actividad)
│             activityId: FK→Activity (CASCADE)
│             url: String
│             cloudinaryId: String
│
└──< HistoricalPercentage (permanente)
       processId: FK→Process
       year: Int
       percentage: Float
```

## Tabla de relaciones

| Tabla origen           | Relación | Tabla destino                      | Cardinalidad |
|------------------------|----------|------------------------------------|--------------|
| Process                | tiene    | Subactivity                        | 1:N          |
| Process                | tiene    | Activity                           | 1:N          |
| Process                | tiene    | HistoricalPercentage               | 1:N          |
| Subactivity            | tiene    | AnnualTarget                       | 1:N (max 1/año) |
| Subactivity            | tiene    | Execution                          | 1:N          |
| Subactivity            | tiene    | Activity                           | 1:N          |
| Subactivity            | tiene    | HistoricalPercentageSubactivity    | 1:N (max 1/año) |
| Activity               | tiene    | ActivityPhoto                      | 1:N          |

## Constraints notables

| Tabla                           | Constraint                         | Regla de negocio                          |
|---------------------------------|------------------------------------|-------------------------------------------|
| Process                         | provinceId UNIQUE                  | Cada provincia tiene exactamente 1 proceso |
| AnnualTarget                    | (subactivityId, year) UNIQUE       | Una sola meta por subactividad por año    |
| HistoricalPercentage            | (processId, year) UNIQUE           | Un solo % histórico por proceso por año   |
| HistoricalPercentageSubactivity | (subactivityId, year) UNIQUE       | Un solo % histórico por subactividad/año  |
| ActivityPhoto                   | activityId FK onDelete CASCADE     | Borrar Activity borra sus fotos en BD     |

## Decisiones de diseño

### 1. IDs como slugs en Process y Subactivity

Los IDs de Process (`"pausas-activas"`, `"cumpleanos"`, etc.) y Subactivity
(`"pa-sesiones"`, `"cum-celebraciones"`, etc.) son strings legibles en lugar de
UUIDs porque:

- El frontend ya tiene el mapeo `PROVINCE_TO_PROCESS` usando esos slugs
- Aparecen en URLs del API (`GET /processes/pausas-activas`)
- El seed los necesita explícitos para garantizar que los 15 procesos siempre
  tengan los mismos IDs, independientemente del entorno
- Facilitan la depuración en consultas SQL directas

Los demás modelos usan `@default(uuid())` porque sus IDs no tienen significado
de dominio externo.

### 2. provinceId como campo en Process

El mapeo 1:1 entre provincia SVG y proceso se almacena como campo `provinceId`
en la tabla `Process` (con UNIQUE constraint). Se descartó crear una tabla
`Province` separada porque:

- Son exactamente 15 provincias fijas, jamás se crean o borran desde la app
- Una tabla separada solo añadiría un JOIN sin beneficio semántico
- El frontend ya tiene el mapeo como constante; la BD lo replica como fuente
  de verdad para validación

### 3. AnnualTarget separado de Subactivity

En el frontend `Subactivity.annualTarget` es un número simple. En la BD se
separó en una tabla propia porque:

- La meta cambia cada año: necesitamos versionar por `(subactivityId, year)`
- `isLocked=true` bloquea la edición una vez parametrizada; necesita su propio
  campo de estado
- El histórico de metas (qué se planeó en 2024 vs 2025) es información valiosa
  y se pierde si se almacena como campo de Subactivity

### 4. Execution separado de Activity

`Activity` es el registro **cualitativo**: título, descripción, mensaje
institucional, fotos, lista de asistentes. Es la evidencia narrativa.

`Execution` es el registro **cuantitativo**: en qué fecha y cuántas veces se
ejecutó una subactividad. Es el contador que alimenta el cálculo de avance.

La separación permite:
- Registrar ejecuciones sin necesidad de crear una Activity (actividades
  rutinarias sin evidencia fotográfica)
- Que una Activity documente el contexto sin que su existencia sea equivalente
  a "una ejecución" (una Activity de 3 días no son 3 executions)
- Calcular avance de forma simple: `SUM(execution.count) / annualTarget`

### 5. Campo year desnormalizado en Execution y Activity

`year` es técnicamente derivable de `date` (`EXTRACT(YEAR FROM date)`). Se
desnormalizó deliberadamente porque:

- El **reinicio anual** necesita borrar `WHERE year = :targetYear` de forma
  eficiente. Con year indexado, esta operación es un index scan directo
- Las consultas del dashboard filtran constantemente por año:
  `WHERE processId = :pid AND year = :year`
- El costo de mantener year consistente con date es mínimo (se escribe una sola
  vez junto con date, nunca se actualiza)

Política: la capa de aplicación garantiza que `year = EXTRACT(YEAR FROM date)`
en toda escritura.

### 6. Reinicio anual: secuencia y protección del histórico

El reinicio anual es una operación crítica que borra datos operativos pero
preserva el histórico. La secuencia correcta es:

```
TRANSACCIÓN:
  1. Calcular % de cumplimiento por proceso
     = (SUM(execution.count) / SUM(annualTarget.target)) * 100
     para cada proceso WHERE year = :yearToClose

  2. Calcular % de cumplimiento por subactividad
     = (SUM(execution.count) / annualTarget.target) * 100
     para cada subactividad WHERE year = :yearToClose

  3. INSERT INTO HistoricalPercentage       → guarda % por proceso
  4. INSERT INTO HistoricalPercentageSubactivity → guarda % por subactividad

FIN TRANSACCIÓN (el histórico ya está protegido)

FUERA DE TRANSACCIÓN (son operaciones externas):
  5. Obtener todos los cloudinaryId de ActivityPhoto
     WHERE activity.year = :yearToClose
  6. Borrar cada imagen en Cloudinary API

TRANSACCIÓN:
  7. DELETE FROM Activity WHERE year = :yearToClose
     → Cascade borra ActivityPhoto automáticamente
  8. DELETE FROM Execution WHERE year = :yearToClose
  9. UPDATE AnnualTarget SET isLocked = false WHERE year = :yearToClose
     (o crear nuevos AnnualTargets para el nuevo año con isLocked=false)
FIN TRANSACCIÓN
```

Por qué dos transacciones separadas: el paso 6 (Cloudinary) es externo y puede
fallar parcialmente. Si la primera transacción (pasos 1-4) ya committed, el
histórico está seguro aunque Cloudinary falle. Si Cloudinary falla, los datos
operativos no se borran todavía y se puede reintentar.

### 7. AnnualTarget.isLocked: ciclo de vida

- `isLocked=false` (default): el admin puede crear o modificar la meta
- `isLocked=true`: el admin ha confirmado la meta; no se puede editar desde la UI
- El reinicio anual hace `UPDATE SET isLocked=false` en los targets del año
  cerrado, o crea nuevos targets para el año nuevo con `isLocked=false`
- La API debe rechazar con 409 Conflict cualquier intento de modificar un
  AnnualTarget con `isLocked=true`

### 8. ActivityPhoto y Cloudinary

La BD almacena:
- `url`: la URL pública de Cloudinary para renderizar en el frontend
- `cloudinaryId` (public_id de Cloudinary): necesario para llamar a
  `cloudinary.uploader.destroy(cloudinaryId)` durante el borrado

La capa de aplicación es responsable de borrar en Cloudinary ANTES de borrar
el row en BD. Si se borra el row sin borrar en Cloudinary, la imagen queda
huérfana en Cloudinary (consumiendo cuota sin referencia).

El `onDelete: Cascade` en ActivityPhoto es una red de seguridad para cuando se
borra directamente desde la BD (reinicio manual, testing), no el flujo normal.

### 9. departments como String[]

Los departamentos participantes en una Activity son valores de texto libre
(`"Financiero"`, `"Todos los procesos"`, `"Ingeniería"`, etc.). Se almacenan
como `String[]` (array nativo de PostgreSQL) porque:

- No tienen identidad propia (no hay una tabla de departamentos en el ICCU)
- No hay FK que respetar
- Los valores pueden variar libremente entre actividades
- El acceso es siempre junto con la Activity (no se consultan en aislado)

Si en el futuro el ICCU estandariza una lista fija de departamentos, se puede
migrar a una tabla Department + tabla pivote Activity_Department.

## Índices estratégicos

| Tabla        | Índice                   | Justificación                                    |
|--------------|--------------------------|--------------------------------------------------|
| Subactivity  | (processId)              | Cargar subactividades de un proceso              |
| Execution    | (subactivityId, year)    | Calcular avance: SUM count por subactividad/año  |
| Execution    | (year)                   | Reinicio anual: DELETE WHERE year = X            |
| Activity     | (processId, year)        | Dashboard: actividades de proceso en año actual  |
| Activity     | (subactivityId)          | Listar actividades de una subactividad           |
| Activity     | (year)                   | Reinicio anual: DELETE WHERE year = X            |
| ActivityPhoto| (activityId)             | Cargar fotos de una actividad                    |

Los índices de `HistoricalPercentage` y `HistoricalPercentageSubactivity` están
cubiertos por los `@@unique` que implícitamente crean un índice en PostgreSQL.

## Estimación de volumen

Con los 15 procesos actuales y ~40 subactividades totales:

| Tabla                           | Crecimiento anual estimado | A 5 años    |
|---------------------------------|----------------------------|-------------|
| Process                         | 0 (fijo)                   | 15 filas    |
| Subactivity                     | 0 (fijo)                   | ~40 filas   |
| AnnualTarget                    | ~40/año                    | ~200 filas  |
| Execution                       | ~300-500/año               | ~2.000 filas|
| Activity                        | ~100-200/año               | ~800 filas  |
| ActivityPhoto                   | ~3-5 por Activity          | ~3.000 filas|
| HistoricalPercentage            | 15/año (fijo)              | 75 filas    |
| HistoricalPercentageSubactivity | ~40/año                    | ~200 filas  |

Este volumen es modesto. No se requieren particiones ni archivado por décadas.
PostgreSQL maneja este volumen sin estrategias especiales de escalabilidad.
