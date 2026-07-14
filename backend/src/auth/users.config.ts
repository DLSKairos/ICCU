/**
 * Usuarios del panel de administración.
 *
 * Las cuentas son fijas (no hay registro desde la app). Aquí viven el usuario,
 * el rol y el alcance de procesos — que no son secretos y se definen una sola
 * vez. Las contraseñas NO están aquí: cada usuario declara el nombre de la
 * variable de entorno que guarda su hash bcrypt.
 *
 * - role 'admin'    → superadmin: acceso a los 15 procesos, incluido Ausentismo.
 * - role 'operador' → solo los procesos listados en `processes`.
 *
 * Los ids de proceso son los slugs del seed (backend/prisma/seed.ts).
 * Agregar un operador nuevo = una entrada acá + su variable de entorno.
 */

export type UserRole = 'admin' | 'operador';

export interface AuthUserConfig {
  username: string;
  role: UserRole;
  hashEnv: string;
  /** Procesos que puede administrar. `null` = todos (solo para admin). */
  processes: string[] | null;
}

export const AUTH_USERS: AuthUserConfig[] = [
  {
    username: 'iccu',
    role: 'admin',
    hashEnv: 'ADMIN_PASSWORD_HASH',
    processes: null,
  },
  {
    username: 'sst',
    role: 'operador',
    hashEnv: 'SST_PASSWORD_HASH',
    processes: [
      'actividades-deportivas',
      'atencion-psicosocial',
      'atencion-emergencias',
      'copasst',
      'capacitaciones',
      'comite-convivencia',
      'dia-salud-sst',
      'salud-mental',
      'seguridad-vial',
    ],
  },
  {
    username: 'bienestar',
    role: 'operador',
    hashEnv: 'BIENESTAR_PASSWORD_HASH',
    processes: [
      'incentivos',
      'capacitaciones',
      'fechas-especiales',
      'feria-servicios',
      'pre-pensionados',
      'salud-mental',
      'teletrabajo',
    ],
  },
];

/** Los usuarios se comparan siempre en minúsculas: el login no distingue mayúsculas. */
export function findUserConfig(username: string): AuthUserConfig | undefined {
  const normalized = username.trim().toLowerCase();
  return AUTH_USERS.find(u => u.username === normalized);
}

/**
 * Alcance vigente de un usuario, leído de la configuración y NO del token.
 * Un token emitido antes de un cambio de asignación no conserva accesos viejos.
 */
export function getUserProcesses(username: string): string[] | null {
  return findUserConfig(username)?.processes ?? null;
}

export function canAccessProcess(username: string, processId: string): boolean {
  const user = findUserConfig(username);
  if (!user) return false;
  if (user.processes === null) return true; // admin
  return user.processes.includes(processId);
}
