# Plan: Construcción completa del monorepo ICCU — orden correcto

## Progreso de fases

| Fase | Agente | Estado |
|------|--------|--------|
| 1 | software-architect | ✅ Completada |
| 2 | data-architect | ✅ Completada |
| 3 | postgres-expert | ✅ Completada |
| 4 | backend-dev | ✅ Completada |
| 5 | api-designer | ✅ Completada |
| 6 | test-writer | ✅ Completada |
| 7 | frontend-dev | ✅ Completada |
| 8 | uxui-designer | ✅ Completada |

---

## Contexto

El proyecto ICCU arrancó con un prototipo frontend para validar UX/UI. Ahora que el diseño está confirmado, toca construirlo desde la base en el orden correcto: arquitectura → datos → base de datos → backend → revisión API → tests → frontend completo (+ panel admin) → pulido UX/UI del admin.

El frontend público (`/`, `/mapa`, `/provincia/:id`) ya existe y funciona con datos mock en `/Users/david/dev/ICCU/frontend/`. El objetivo de este plan es:
- Estructurar el monorepo con Docker desde la raíz
- Construir el backend NestJS + Prisma + PostgreSQL
- Agregar el panel admin completo al frontend
- Conectar todo a la API real reemplazando los datos mock

---

## Estado actual

```
/Users/david/dev/ICCU/
├── ICCU.md                       ✅ especificación completa
├── frontend/                     ✅ prototipo funcional (público solo)
│   ├── src/
│   │   ├── data/processes.ts     ✅ tipos TS + datos mock de 15 procesos
│   │   ├── utils/metrics.ts      ✅ lógica de cálculo de períodos
│   │   ├── pages/ (3 públicas)   ✅ Intro, Mapa, ProvinciaPage
│   │   └── components/           ✅ dashboard + map + ui
│   └── package.json              ✅ React 19 + Vite 5 + TS 6 + Tailwind 4
├── backend/                      ❌ no existe
├── docker-compose.yml            ❌ no existe
└── .env                          ❌ no existe
```

---

## Estructura objetivo del monorepo

```
/Users/david/dev/ICCU/
├── ICCU.md
├── .env.example                  ← variables de entorno documentadas
├── .env                          ← NO se commitea (en .gitignore)
├── .gitignore                    ← actualizado para monorepo
├── docker-compose.yml            ← dev (hot reload para los 3 servicios)
├── docker-compose.prod.yml       ← producción
├── frontend/                     ← existente + panel admin + conexión API
│   ├── Dockerfile.dev
│   ├── src/
│   │   ├── pages/
│   │   │   ├── IntroPage.tsx     ← existente
│   │   │   ├── MapaPage.tsx      ← existente
│   │   │   ├── ProvinciaPage.tsx ← existente (conectar a API)
│   │   │   └── admin/
│   │   │       ├── AdminLoginPage.tsx
│   │   │       ├── AdminDashboardPage.tsx
│   │   │       └── AdminProvinciaPage.tsx
│   │   ├── components/
│   │   │   ├── dashboard/        ← existente
│   │   │   ├── map/              ← existente
│   │   │   ├── ui/               ← existente
│   │   │   └── admin/            ← nuevo
│   │   ├── hooks/
│   │   │   ├── useMapTransition.ts  ← existente
│   │   │   ├── useTwinkle.ts        ← existente
│   │   │   └── useAuth.ts           ← nuevo
│   │   ├── services/
│   │   │   └── api.ts            ← Axios instance + todos los calls al backend
│   │   ├── context/
│   │   │   └── AuthContext.tsx   ← JWT token + estado de auth
│   │   └── data/
│   │       ├── cundinamarca-svg.ts  ← existente (no cambia)
│   │       └── processes.ts         ← se elimina mock, queda solo tipos + mapeo
└── backend/
    ├── Dockerfile.dev
    ├── package.json
    ├── tsconfig.json
    ├── nest-cli.json
    ├── .env.example
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.ts               ← seed con los 15 procesos hardcodeados
    │   └── migrations/
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── prisma/
        │   ├── prisma.module.ts
        │   └── prisma.service.ts
        ├── auth/
        │   ├── auth.module.ts
        │   ├── auth.service.ts
        │   ├── auth.controller.ts
        │   ├── dto/login.dto.ts
        │   ├── guards/jwt-auth.guard.ts
        │   └── strategies/jwt.strategy.ts
        ├── processes/
        │   ├── processes.module.ts
        │   ├── processes.service.ts
        │   └── processes.controller.ts
        ├── activities/
        │   ├── activities.module.ts
        │   ├── activities.service.ts
        │   ├── activities.controller.ts
        │   └── dto/
        │       ├── create-activity.dto.ts
        │       └── set-targets.dto.ts
        ├── upload/
        │   ├── upload.module.ts
        │   └── upload.service.ts
        └── common/
            ├── filters/http-exception.filter.ts
            └── interceptors/transform.interceptor.ts
```

---

## Modelo de datos (Prisma)

Derivado directamente de los tipos TypeScript en `frontend/src/data/processes.ts`:

```prisma
model Process {
  id                    String                @id           // ej: "pausas-activas"
  name                  String
  description           String
  provinceId            String                @unique       // ej: "bajo-magdalena"
  subactivities         Subactivity[]
  activities            Activity[]
  historicalPercentages HistoricalPercentage[]
}

model Subactivity {
  id            String         @id                          // ej: "pausas-sesiones"
  processId     String
  name          String
  process       Process        @relation(...)
  annualTargets AnnualTarget[]
  executions    Execution[]
  activities    Activity[]
}

model AnnualTarget {
  id            String      @id @default(uuid())
  subactivityId String
  year          Int
  target        Int
  isLocked      Boolean     @default(false)                // bloqueado tras parametrizar
  subactivity   Subactivity @relation(...)
  @@unique([subactivityId, year])
}

model Execution {
  id            String      @id @default(uuid())
  subactivityId String
  date          DateTime
  count         Int
  year          Int
  subactivity   Subactivity @relation(...)
}

model Activity {
  id            String        @id @default(uuid())
  processId     String
  subactivityId String
  title         String
  description   String
  message       String
  date          DateTime
  attendees     Int
  departments   String[]
  year          Int
  process       Process       @relation(...)
  subactivity   Subactivity   @relation(...)
  photos        ActivityPhoto[]
  createdAt     DateTime      @default(now())
}

model ActivityPhoto {
  id            String    @id @default(uuid())
  activityId    String
  url           String                                     // URL Cloudinary
  cloudinaryId  String                                     // public_id para borrar
  activity      Activity  @relation(..., onDelete: Cascade)
}

model HistoricalPercentage {
  id        String  @id @default(uuid())
  processId String
  year      Int
  percentage Float
  process   Process @relation(...)
  @@unique([processId, year])
}
```

---

## API REST (NestJS)

### Endpoints públicos (sin JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login admin → JWT |
| GET | `/api/processes` | Lista 15 procesos con métricas calculadas por período |
| GET | `/api/processes/:id` | Proceso completo con actividades, galería, histórico |

Query params en GET `/api/processes` y `/api/processes/:id`:
- `?period=semanal|mensual|trimestral|anual` (default: anual)
- `?year=2025` (default: año en curso)

### Endpoints admin (requieren JWT en header Authorization: Bearer)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/processes` | Lista procesos con estado de parametrización |
| GET | `/api/admin/processes/:id` | Proceso con detalle admin |
| PUT | `/api/admin/processes/:id/targets` | Parametrizar metas anuales de subactividades |
| POST | `/api/admin/activities` | Registrar actividad (+ fotos via multipart) |
| DELETE | `/api/admin/activities/:id` | Eliminar registro de actividad |
| POST | `/api/admin/processes/:id/reset` | Reinicio anual del proceso |

---

## Variables de entorno (.env.example)

```env
# Base de datos
DATABASE_URL=postgresql://iccu:PASSWORD@postgres:5432/iccu_th

# JWT
JWT_SECRET=cambiar_en_produccion
JWT_EXPIRES_IN=8h

# Admins hardcodeados (JSON array)
ADMIN_USERS=[{"username":"admin1","password":"hash_bcrypt"}]

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend
VITE_API_URL=http://localhost:5000/api

# Puertos
BACKEND_PORT=5000
FRONTEND_PORT=5555
```

---

## Orden de ejecución de subagentes

### FASE 1 — software-architect ⏳

**Qué hace:**
1. Crea `docker-compose.yml` (dev) con 3 servicios: `postgres`, `backend`, `frontend`
2. Crea `docker-compose.prod.yml` (producción)
3. Crea `backend/Dockerfile.dev` y `frontend/Dockerfile.dev`
4. Actualiza `.gitignore` raíz para monorepo (node_modules, .env, dist, etc.)
5. Crea `.env.example` raíz
6. Inicializa `backend/` con NestJS CLI: `nest new backend --skip-git --package-manager npm`
7. Define la estructura de módulos NestJS (no implementa, solo scaffolding)
8. Configura `backend/tsconfig.json` con strict mode

**Archivos que crea:**
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `frontend/Dockerfile.dev`
- `backend/Dockerfile.dev`
- `.gitignore` (raíz)
- `.env.example`
- `backend/` (scaffold completo de NestJS)

**Criterio de éxito:** `docker-compose up` levanta postgres, backend y frontend sin errores. Backend responde en `localhost:5000/api`, frontend en `localhost:5555`.

---

### FASE 2 — data-architect ⏳

**Contexto a entregar:**
- Los tipos TypeScript están en `frontend/src/data/processes.ts`
- El modelo de datos objetivo está definido en la sección "Modelo de datos" de este plan
- Las reglas de negocio: parametrización anual bloqueada, reinicio anual conserva histórico, executions con date+count

**Qué hace:**
1. Valida el modelo relacional propuesto contra las reglas de negocio del ICCU.md
2. Define la estrategia de integridad referencial (cascades, restricciones)
3. Define la estrategia del reinicio anual (qué se borra, cómo se archiva el histórico antes)
4. Documenta las decisiones de diseño en un `backend/prisma/DATA_MODEL.md`
5. Produce el esquema Prisma final validado en `backend/prisma/schema.prisma`

**Archivos que crea:**
- `backend/prisma/schema.prisma`
- `backend/prisma/DATA_MODEL.md`

**Criterio de éxito:** El schema refleja todas las reglas de negocio. La lógica de reinicio anual está documentada y no destruye histórico.

---

### FASE 3 — postgres-expert ⏳

**Contexto a entregar:**
- `backend/prisma/schema.prisma` (salida del data-architect)
- Mapeo `PROVINCE_TO_PROCESS` de `frontend/src/data/processes.ts`
- Datos mock de los 15 procesos para el seed

**Qué hace:**
1. Revisa y ajusta el schema Prisma si hay optimizaciones de índices o constraints faltantes
2. Genera la migración inicial: `prisma migrate dev --name init`
3. Escribe `backend/prisma/seed.ts` con los 15 procesos hardcodeados (IDs, nombres, provinceId, subactividades)
4. El seed NO incluye actividades ni ejecuciones (eso lo registran los admins)
5. El seed SÍ incluye un `AnnualTarget` de ejemplo para el año actual marcado como no bloqueado
6. Configura `backend/package.json` con el script `prisma:seed`

**Archivos que modifica/crea:**
- `backend/prisma/schema.prisma` (ajustes de índices)
- `backend/prisma/seed.ts`

**Criterio de éxito:** `npx prisma migrate dev` crea todas las tablas. `npx prisma db seed` inserta los 15 procesos sin errores.

---

### FASE 4 — backend-dev ⏳

**Contexto a entregar:**
- Schema Prisma final
- API REST definida en la sección "API REST" de este plan
- Variables de entorno en `.env.example`
- Reglas de negocio del ICCU.md (secciones 5, 6, 7, 8, 9)

**Qué implementa:**

**`src/prisma/`** — PrismaService global (singleton, onModuleInit + onModuleDestroy)

**`src/auth/`**
- `AuthService`: lee `ADMIN_USERS` del env, compara password con bcrypt, emite JWT
- `AuthController`: POST `/api/auth/login`
- `JwtStrategy`: valida token en requests protegidos
- `JwtAuthGuard`: guard reutilizable para decorar controladores

**`src/processes/`**
- `ProcessesService.findAll(period, year)`: retorna los 15 procesos con métricas calculadas (mismo algoritmo que `frontend/src/utils/metrics.ts`)
- `ProcessesService.findOne(id, period, year)`: proceso completo con actividades, timeline, galería y métricas
- `ProcessesController`: GET `/api/processes` y `/api/processes/:id`

**`src/activities/`**
- `ActivitiesService.create(dto)`: crea Activity + Execution (incrementa count de la subactividad)
- `ActivitiesService.remove(id)`: elimina actividad + fotos en Cloudinary + decrementa ejecución
- `ActivitiesService.setTargets(processId, dto)`: parametriza AnnualTarget y los bloquea (isLocked=true)
- `ActivitiesService.resetYear(processId)`:
  1. Calcula porcentaje final del año
  2. Guarda en `HistoricalPercentage`
  3. Elimina fotos de Cloudinary (carpeta del año)
  4. Elimina Activity + ActivityPhoto + Execution del año
  5. Desbloquea AnnualTarget (isLocked=false) para re-parametrización
- `ActivitiesController`: rutas `/api/admin/*` con `@UseGuards(JwtAuthGuard)`

**`src/upload/`**
- `UploadService.uploadPhotos(files)`: sube a Cloudinary con folder `/iccu-th/{year}/{processId}/{activityId}/`, retorna URLs y public_ids

**`src/common/`**
- `HttpExceptionFilter`: respuestas de error consistentes `{statusCode, message, timestamp}`
- `TransformInterceptor`: envuelve respuestas en `{data, success: true}`

**Buenas prácticas obligatorias:**
- DTOs con class-validator para todos los endpoints de entrada
- Nunca exponer stack traces en producción
- Bcrypt para comparar passwords (nunca texto plano)
- CORS configurado para origen del frontend

**Archivos que crea:** Todo el directorio `backend/src/`

**Criterio de éxito:** `curl http://localhost:5000/api/processes` retorna los 15 procesos. `POST /api/auth/login` retorna JWT válido. `POST /api/admin/activities` con JWT válido crea el registro.

---

### FASE 5 — api-designer ⏳

**Qué hace (solo revisión, no modifica código):**
1. Audita todos los controllers y DTOs del backend
2. Verifica:
   - Convenciones REST (verbos correctos, status codes, rutas en plural)
   - Validaciones completas en DTOs
   - Manejo de errores consistente (404 si proceso no existe, 401 sin token, 403 token inválido)
   - Que no se expongan datos sensibles (passwords, tokens internos)
   - CORS configurado correctamente
   - Paginación si aplica (actividades de un proceso pueden crecer)
3. Entrega un reporte con hallazgos y correcciones necesarias

**Archivos que toca:** ninguno (solo lee y reporta)

**Si encuentra issues:** El backend-dev debe corregirlos antes de continuar.

---

### FASE 6 — test-writer ⏳

**Contexto a entregar:**
- Estructura completa del backend
- Lógica de negocio en `ProcessesService` y `ActivitiesService`

**Qué escribe:**

**Tests unitarios** (`*.spec.ts`):
- `ProcessesService`: cálculo de métricas por período (misma lógica que `metrics.ts` del frontend)
- `ActivitiesService.resetYear`: que guarda histórico antes de borrar, que no borra de otros años
- `AuthService`: que rechaza credenciales inválidas, que acepta válidas

**Tests de integración** (`test/*.e2e-spec.ts`):
- Login → recibe JWT
- GET `/api/processes` → retorna estructura correcta sin auth
- POST `/api/admin/activities` sin JWT → 401
- POST `/api/admin/activities` con JWT válido → 201 con actividad creada
- PUT `/api/admin/processes/:id/targets` → bloquea targets después

**Archivos que crea:**
- `backend/src/processes/processes.service.spec.ts`
- `backend/src/activities/activities.service.spec.ts`
- `backend/src/auth/auth.service.spec.ts`
- `backend/test/app.e2e-spec.ts`

**Criterio de éxito:** `npm run test` y `npm run test:e2e` pasan sin errores.

---

### FASE 7 — frontend-dev ⏳

**Contexto a entregar:**
- URL del backend: `VITE_API_URL` en `.env`
- Tipos TypeScript existentes en `frontend/src/data/processes.ts`
- API REST documentada en este plan
- Rutas admin: `/admin`, `/admin/dashboard`, `/admin/provincia/:id`

**Qué implementa:**

**`src/services/api.ts`** — Axios instance centralizada:
- `baseURL = import.meta.env.VITE_API_URL` (apunta a `http://localhost:5000/api`)
- Interceptor de request: agrega `Authorization: Bearer {token}` si existe en localStorage
- Interceptor de response: si 401 → limpia token y redirige a `/admin`
- Funciones exportadas: `getProcesses(period, year)`, `getProcess(id, period, year)`, `login(username, password)`, `setTargets(processId, dto)`, `createActivity(formData)`, `deleteActivity(id)`, `resetYear(processId)`

**`src/context/AuthContext.tsx`**:
- Estado: `token`, `isAuthenticated`
- Métodos: `login(username, password)`, `logout()`
- Persiste token en localStorage
- `useAuth()` hook que consume el contexto

**`src/App.tsx`** — Actualizar rutas:
- Mantener rutas públicas existentes
- Agregar `ProtectedRoute` wrapper (redirige a `/admin` si no hay token)
- Agregar rutas admin:
  ```
  /admin               → AdminLoginPage (público)
  /admin/dashboard     → AdminDashboardPage (protegido)
  /admin/provincia/:id → AdminProvinciaPage (protegido)
  ```

**Páginas admin:**

`AdminLoginPage.tsx` (`/admin`):
- Formulario: usuario + contraseña
- Submit → llama `login()` del AuthContext
- Si éxito → redirige a `/admin/dashboard`
- Si error → muestra mensaje de error

`AdminDashboardPage.tsx` (`/admin/dashboard`):
- Lista de los 15 procesos con nombre, porcentaje de avance actual, estado de parametrización del año
- Botón "Gestionar" → navega a `/admin/provincia/:id`
- Botón logout en header

`AdminProvinciaPage.tsx` (`/admin/provincia/:id`):
- **Sección 1: Estado del proceso** — métricas de avance actuales
- **Sección 2: Parametrización anual** — formulario con subactividades + inputs de meta anual. Botón "Confirmar" bloquea los valores. Si ya están bloqueados, muestra los valores con badge "Bloqueado"
- **Sección 3: Registrar actividad** — formulario completo (subactividad, título, descripción, mensaje, fecha, asistentes, dependencias, fotos con input `capture`). Submit multipart a `/api/admin/activities`
- **Sección 4: Actividades registradas** — lista con opción de eliminar cada una
- **Sección 5: Reinicio anual** — botón de peligro rojo con modal de confirmación que pide escribir "CONFIRMAR" para proceder

**Conectar páginas públicas a la API:**
- `ProvinciaPage.tsx`: reemplazar mock por `getProcess()` de `api.ts`. Mantener toda la lógica de UI existente.
- `MapaPage.tsx`: reemplazar mock por `getProcesses()` para mostrar % de avance en hover.

**Archivos que modifica:**
- `frontend/src/App.tsx`
- `frontend/src/data/processes.ts` (solo tipos + mapeo, sin mock data)
- `frontend/src/pages/ProvinciaPage.tsx`
- `frontend/src/pages/MapaPage.tsx`

**Archivos que crea:**
- `frontend/src/services/api.ts`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/pages/admin/AdminLoginPage.tsx`
- `frontend/src/pages/admin/AdminDashboardPage.tsx`
- `frontend/src/pages/admin/AdminProvinciaPage.tsx`
- `frontend/src/components/admin/` (componentes reutilizables del admin)

**Criterio de éxito:** Las 3 páginas públicas muestran datos reales. Las 3 rutas admin funcionan con JWT. El formulario de registro sube fotos a Cloudinary y aparecen en la galería pública.

---

### FASE 8 — uxui-designer ⏳

**Qué hace:**
1. Revisa todas las páginas admin recién creadas
2. Aplica el design system existente: colores ICCU (`#134174`, `#0087CF`, `#FFDD00`, `#D4AF37`), tipografía Antonio + Roboto Condensed
3. Asegura que el admin sea responsive (mobile-first para el formulario de registro de campo)
4. Mejora el formulario de registro de actividades (UX de carga de fotos, feedback visual al subir)
5. Agrega estados de loading y error consistentes en todas las páginas (skeleton loaders, toasts)
6. Asegura consistencia visual entre la vista pública y el panel admin
7. Revisa accesibilidad básica (contraste, labels en formularios)

**Archivos que modifica:** páginas y componentes admin, posiblemente `index.css` para nuevas variables.

---

## Verificación end-to-end

Una vez ejecutadas todas las fases, el flujo completo debe funcionar:

1. `docker-compose up` → levanta postgres + backend + frontend
2. `http://localhost:5555` → pantalla intro funciona
3. `http://localhost:5555/mapa` → mapa interactivo con % de avance en hover (datos reales desde la DB)
4. `http://localhost:5555/provincia/pausas-activas` → dashboard con datos reales
5. `http://localhost:5555/admin` → formulario de login
6. Login con credenciales del `.env` → redirige a `/admin/dashboard`
7. Desde admin dashboard → entrar a gestión de un proceso
8. Parametrizar metas anuales → se bloquean tras confirmar
9. Registrar una actividad con fotos → aparece en la vista pública
10. Botón reinicio anual con confirmación → limpia datos del año, conserva histórico

---

## Notas para la implementación

- **No cambiar** la lógica de cálculo de métricas que ya funciona en `frontend/src/utils/metrics.ts`. El backend debe implementar la misma lógica en `ProcessesService`.
- **No mover** los datos SVG del mapa (`cundinamarca-svg.ts` y assets). Son puramente de presentación.
- El mapeo `PROVINCE_TO_PROCESS` en `processes.ts` es el contrato entre el mapa y la DB — no se puede cambiar.
- Los IDs de procesos (`pausas-activas`, `cumpleanos`, etc.) deben coincidir exactamente entre el seed de la DB y el frontend.
- React 19 ya instalado — no downgrading.
- TailwindCSS v4 ya instalado (nueva sintaxis con `@import "tailwindcss"`, sin `tailwind.config.js`).
