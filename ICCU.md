# ICCU — Dashboard Talento Humano
## Documento de especificación completa del proyecto

> **Instituto de Caminos y Construcciones de Cundinamarca (ICCU)**
> Área: Talento Humano
> Versión del documento: 1.0
> Estado: Especificación cerrada — listo para arquitectura y desarrollo

---

## 1. Qué es la app

Un dashboard público y visual para el área de Talento Humano del ICCU que presenta los procesos del área usando como metáfora el mapa geográfico de Cundinamarca. Cada "provincia" del mapa representa un proceso de Talento Humano. La app tiene dos audiencias: el público general (empleados y directivos del ICCU) que la consulta sin login para ver el avance de los procesos, y los administradores del área de TH que la alimentan con los registros de actividades ejecutadas.

No es una herramienta de gestión interna. Es una vitrina institucional del trabajo del área de Talento Humano, que comunica avance, resultados e impacto de sus procesos de manera visual y accesible.

---

## 2. Usuarios

### 2.1 Público general
- Empleados, directivos y visitantes del ICCU
- Acceso sin autenticación
- Solo lectura
- Vista optimizada para escritorio (desktop-first)
- No requiere ningún tipo de cuenta ni registro

### 2.2 Administradores
- Personal del área de Talento Humano del ICCU
- Múltiples administradores (cantidad a definir operativamente)
- Cuentas hardcodeadas en el sistema (no hay registro de nuevos admins desde la app)
- No hay jerarquía entre admins: todos tienen acceso completo a todos los procesos
- Autenticación por usuario y contraseña con JWT
- Vista responsive para móvil (para registrar actividades desde el celular en campo)
- No hay superadmin ni gestión de usuarios desde la app

---

## 3. Estructura de la app — navegación

La app tiene 3 capas de navegación para el público y una capa adicional para el admin:

```
/ (Intro)
  └── /mapa (Mapa de Cundinamarca)
        └── /provincia/:id (Dashboard de proceso)

/admin (Login)
  └── /admin/dashboard (Panel administrador)
        └── /admin/provincia/:id (Gestión de proceso)
```

### 3.1 Ruta raíz `/` — Pantalla de intro
Pantalla de bienvenida con el título "Talento Humano" como elemento central. Al hacer clic en el título o en cualquier parte de la pantalla, se activa una transición zoom/fade hacia el mapa. No hay más elementos de navegación en esta pantalla.

### 3.2 Ruta `/mapa` — Mapa de Cundinamarca
Mapa SVG interactivo del departamento de Cundinamarca ocupando la mayor parte de la pantalla. Las 15 zonas del mapa representan los 15 procesos de Talento Humano. Hover sobre una zona revela el nombre del proceso. Clic en una zona navega a `/provincia/:id`.

### 3.3 Ruta `/provincia/:id` — Dashboard de proceso
Dashboard completo de un proceso específico con métricas, gráficas, línea de tiempo, galería de fotos e información de cada actividad registrada. Nueva ruta, no modal ni drawer.

### 3.4 Ruta `/admin` — Login administrador
Formulario de login. Autenticación con JWT. Redirige a `/admin/dashboard` si las credenciales son correctas.

### 3.5 Ruta `/admin/dashboard` — Panel principal admin
Vista general de todos los procesos con acceso a la gestión de cada uno.

### 3.6 Ruta `/admin/provincia/:id` — Gestión de proceso
Panel de administración de un proceso específico: parametrización de metas, registro de actividades, visualización de registros existentes, opción de reinicio.

---

## 4. Procesos (Provincias)

### 4.1 Cantidad y naturaleza
Son exactamente **15 procesos**, hardcodeados en el sistema. Sus nombres definitivos aún no están confirmados por el área de TH del ICCU. Los nombres se definirán antes de iniciar el desarrollo del frontend. Algunos ejemplos mencionados durante la conceptualización: Pausas Activas, Cumpleaños, Lunes y Miércoles de Actívate, Día de la Salud, SST.

### 4.2 Estructura de un proceso
Cada proceso tiene:
- ID único hardcodeado
- Nombre del proceso
- Descripción general del proceso
- N subactividades (sin límite máximo)
- Total planeado anual (suma automática de los totales de sus subactividades)
- Porcentaje de cumplimiento histórico por año (conservado permanentemente)
- Galería de fotos general (todas las fotos de todos los registros del proceso)
- Línea de tiempo de actividades ejecutadas

### 4.3 Subactividades
Cada proceso contiene una o más subactividades. Ejemplos: SST puede tener Capacitaciones, Concientizaciones, Inspecciones. Pausas Activas puede tener solo una subactividad del mismo nombre.

Cada subactividad tiene:
- Nombre
- Total planeado anual (parametrizado por el admin una vez al año)
- Contador de ejecuciones registradas en el año en curso
- Historial de porcentajes de cumplimiento por año

El total planeado anual de un proceso = suma de los totales planeados de todas sus subactividades.

---

## 5. Sistema de métricas y cálculo de avance

### 5.1 Lógica base
El avance de cada subactividad y de cada proceso se calcula comparando lo ejecutado contra un denominador que varía según el período seleccionado por el usuario.

```
Total planeado anual (parametrizado por el admin)
  → Anual:      denominador = total anual
  → Trimestral: denominador = total anual ÷ 4
  → Mensual:    denominador = total anual ÷ 12
  → Semanal:    denominador = total anual ÷ 52
```

### 5.2 Ejemplo concreto
Pausas Activas: 156 sesiones planeadas al año.
- Denominador anual: 156
- Denominador trimestral: 39
- Denominador mensual: 13
- Denominador semanal: 3

Si en el mes se han ejecutado 8 pausas activas:
- Frente al mes: 8/13 = 61.5%
- Frente al trimestre: 8/39 = 20.5%
- Frente al año: 8/156 = 5.1%

El usuario escoge el período desde un selector y la app recalcula todos los porcentajes en tiempo real.

### 5.3 Avance de provincia
El avance de la provincia es calculado en base a la suma de todos los totales planeados de sus subactividades y la suma de todas las ejecuciones registradas. Sigue la misma lógica de períodos.

### 5.4 Visualizaciones disponibles
- **Gráfica de torta:** proporción ejecutado vs pendiente
- **Gráfica de barras:** comparativo entre subactividades o entre períodos
- **Métricas numéricas:** número ejecutado, denominador del período, porcentaje
- **Línea de tiempo:** cronología de actividades ejecutadas con fecha, título y descripción
- **Comparativo histórico:** porcentaje de cumplimiento anual por año (solo vista, no editable)

### 5.5 Selector de período
Un control visible en la vista pública del dashboard de provincia que permite al usuario cambiar entre: Semanal / Mensual / Trimestral / Anual. Al cambiar el período, todas las métricas y gráficas se recalculan automáticamente sin recargar la página.

---

## 6. Registro de actividades (admin)

### 6.1 Qué es un registro de actividad
Cada vez que el área de TH ejecuta una actividad concreta, el admin la registra en el sistema. Este registro alimenta la línea de tiempo, las métricas y la galería.

### 6.2 Campos del registro
Los siguientes campos son todos obligatorios. La lista es definitiva para desarrollo aunque los nombres exactos de algunos campos podrían ajustarse operativamente:

| Campo | Tipo | Descripción |
|---|---|---|
| Subactividad | Selección | A qué subactividad pertenece este registro |
| Título | Texto | Nombre de la actividad puntual ejecutada |
| Descripción | Texto largo | Descripción de lo que se hizo |
| Mensaje | Texto | Mensaje institucional o motivacional del evento |
| Fecha de ejecución | Fecha | Cuándo se realizó la actividad |
| Cantidad de asistentes | Número | Cuántas personas participaron |
| Dependencias participantes | Texto / Selección | De qué áreas del ICCU vinieron los participantes |
| Fotos | Imágenes | Mínimo 1, sin límite máximo |

> **Nota:** Los campos específicos de cada proceso podrían requerir ajuste fino antes del desarrollo. Este listado es el acordado en la fase de conceptualización.

### 6.3 Registro de fotos
El admin puede:
- Tomar fotos directamente desde la cámara del dispositivo (input nativo con `capture`, sin PWA adicional)
- Subir fotos desde la galería del dispositivo o desde el computador
- Subir múltiples fotos en un solo registro

Las fotos se almacenan en **Cloudinary** (cuenta única del proyecto). Se vinculan al registro puntual de actividad y también aparecen en la galería general de la provincia.

---

## 7. Parametrización anual

### 7.1 Quién y cuándo
El admin parametriza el total planeado de cada subactividad **una vez al año**, idealmente al inicio del año. Este valor no puede modificarse durante el año una vez establecido, para garantizar la integridad del histórico de porcentajes.

> **Decisión de integridad de datos:** si el total planeado pudiera cambiarse a mitad de año, los porcentajes ya calculados y registrados cambiarían retroactivamente, haciendo el histórico inconsistente. Por eso es un valor de solo escritura anual.

### 7.2 Flujo de parametrización
1. Admin ingresa a `/admin/provincia/:id`
2. Accede a la sección de parametrización
3. Para cada subactividad ingresa el total planeado para el año en curso
4. Confirma. El sistema calcula automáticamente el total de la provincia.
5. Este valor queda bloqueado para edición hasta el próximo reinicio anual.

---

## 8. Reinicio anual

### 8.1 Qué se borra
- Todos los registros de actividades del año en curso
- Todas las fotos en Cloudinary vinculadas al año en curso
- La línea de tiempo completa del año en curso
- Los totales parametrizados del año en curso (quedan libres para re-parametrizar)

### 8.2 Qué se conserva
- El porcentaje de cumplimiento total de cada proceso por año (histórico)
- El porcentaje de cumplimiento de cada subactividad por año (histórico)
- La estructura de procesos y subactividades

### 8.3 Cómo se ejecuta
Manual. El admin ejecuta la acción desde el panel de administración de la provincia. Requiere confirmación explícita (modal de confirmación con texto de advertencia). No hay reinicio automático.

### 8.4 Comparativo histórico
Los porcentajes anuales conservados permiten mostrar en la vista pública una comparación simple año a año. Ejemplo: SST 2024: 87% — SST 2025: 92%. No hay granularidad más fina en el histórico, solo el porcentaje de cumplimiento anual global por proceso y por subactividad.

---

## 9. Almacenamiento de imágenes — Cloudinary

- Cuenta única del proyecto ICCU TH
- Plan gratuito: 25 GB de almacenamiento
- Las fotos se organizan por carpetas: `/iccu-th/{año}/{proceso_id}/{registro_id}/`
- En el reinicio anual: se eliminan programáticamente las fotos del año vencido desde la API de Cloudinary
- No se depende de almacenamiento local ni del servidor para imágenes
- Las URLs de Cloudinary se guardan en PostgreSQL junto a cada registro

---

## 10. Stack tecnológico

### 10.1 Frontend
| Decisión | Tecnología |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Routing | React Router v6 |
| Gráficas | Recharts |
| Mapa | SVG custom de Cundinamarca (hardcodeado, interactivo con CSS/JS) |
| Estilos | TailwindCSS |
| HTTP client | Axios |
| Estado global | Context API o Zustand (a definir en arquitectura) |

**Por qué React + Vite y no Next.js:** la vista pública no requiere SEO ni indexación por motores de búsqueda. El SSR de Next.js no aporta ningún beneficio real para este caso de uso. React + Vite es más simple, más rápido de configurar y suficiente para las necesidades del proyecto.

### 10.2 Backend
| Decisión | Tecnología |
|---|---|
| Framework | NestJS + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT (credenciales hardcodeadas, sin base de datos de usuarios) |
| Almacenamiento de imágenes | Cloudinary SDK |
| Validación | class-validator + class-transformer |

### 10.3 Infraestructura y DevOps
| Componente | Plataforma |
|---|---|
| Deploy frontend | Vercel (plan gratuito, ilimitado en tiempo) |
| Deploy backend | Render (plan gratuito, servicio duerme por inactividad) |
| Base de datos | Render PostgreSQL (plan gratuito) |
| Imágenes | Cloudinary (25GB gratis) |
| Docker | docker-compose para desarrollo local y opción servidor propio |
| Repositorio | Monorepo en GitHub |
| Dominio | URL de Vercel por defecto o subdominio de Kairos DLS (`th.kairosdls.com`) |

### 10.4 Estructura del monorepo
```
iccu-th/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
├── docker-compose.yml         ← desarrollo local
├── docker-compose.prod.yml    ← servidor propio (si aplica)
└── README.md
```

### 10.5 Docker
Docker está presente desde el primer commit del proyecto. El `docker-compose.yml` de desarrollo levanta:
- Contenedor frontend con hot reload
- Contenedor backend con hot reload
- Contenedor PostgreSQL local

Esto garantiza que si en algún momento el ICCU obtiene un servidor de la Gobernación o una VPS propia, el despliegue se hace con un solo comando sin inconsistencias de entorno.

---

## 11. Identidad visual — colores y tipografía

### 11.1 Paleta de colores ICCU
| Nombre | HEX | Uso principal |
|---|---|---|
| Azul Noche ICCU | `#134174` | Fondo principal, headers |
| Azul Medio ICCU | `#0087CF` | Acentos, botones, elementos secundarios |
| Amarillo ICCU | `#FFDD00` | Highlights, alertas positivas |
| Rojo ICCU | `#E00914` | Alertas, elementos de advertencia |
| Dorado Metalizado | `#D4AF37` | Mapa SVG: fill de provincias, animaciones de titileo |

### 11.2 Tipografía
| Fuente | Uso |
|---|---|
| Antonio | Títulos principales, nombre de procesos, números grandes de métricas |
| Roboto Condensed | Cuerpo de texto, etiquetas, descripciones, tablas |

### 11.3 Dorado del mapa
El dorado para el SVG del mapa es un dorado metalizado cálido. La referencia visual exacta fue confirmada con una muestra entregada durante la conceptualización. El HEX más cercano a esa muestra es `#D4AF37`. Para el efecto de titileo se puede usar una variación de opacidad o brillo sobre este mismo color base, sin cambiar el HEX.

---

## 12. Lo que queda por definir antes de iniciar desarrollo

Los siguientes puntos no bloquean la arquitectura ni el modelo de datos, pero deben resolverse antes de comenzar el frontend:

| Pendiente | Responsable | Impacto |
|---|---|---|
| Nombres definitivos de los 15 procesos | Área TH del ICCU | Hardcodeo del mapa SVG y rutas |
| Nombres definitivos de las subactividades iniciales de cada proceso | Área TH del ICCU | Seed de la base de datos |
| Campos exactos del formulario de registro (confirmación final) | Área TH del ICCU | Modelo de datos y formulario admin |
| Credenciales de admins (usuarios y contraseñas) | Área TH del ICCU | Hardcodeo en backend |
| Cuenta de Cloudinary del proyecto | Kairos DLS / ICCU | Variables de entorno |
| Decisión final de dominio | ICCU / Kairos DLS | Configuración Vercel |

---

## 13. Lo que NO es esta app

Para evitar scope creep durante el desarrollo:

- No es un sistema de gestión de RRHH
- No tiene módulo de nómina, vacaciones, permisos ni ausencias
- No tiene módulo de comunicaciones internas (no envía notificaciones ni correos)
- No tiene integración con sistemas externos del ICCU
- No tiene roles diferenciados entre administradores
- No permite que los admins creen o eliminen procesos (los 15 son fijos)
- No tiene modo oscuro ni personalización de tema por usuario
- No tiene app móvil nativa (la vista responsive es solo para el panel admin)

---

*Documento generado en fase de conceptualización y clarificación. Elaborado con orgullo en Colombia 🇨🇴 — Kairos DLS Group S.A.S.*
