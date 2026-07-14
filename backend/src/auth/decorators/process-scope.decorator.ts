import { SetMetadata } from '@nestjs/common';

export const PROCESS_SCOPE_KEY = 'processScope';

/**
 * Declara cómo el ProcessScopeGuard debe averiguar a qué proceso pertenece el
 * recurso que el request intenta modificar. Formato: `<origen>:<clave>`.
 *
 *   body:processId          → el body trae el processId directamente
 *   param:processId         → un parámetro de ruta trae el processId
 *   activity:id             → el parámetro `id` es un activityId → Activity.processId
 *   subactivity:subactivityId → el parámetro es un subactivityId → Subactivity.processId
 *   execution:executionId   → Execution → Subactivity → processId
 *   photo:photoId           → ActivityPhoto → Activity → processId
 */
export type ProcessScopeSource =
  | `body:${string}`
  | `param:${string}`
  | `activity:${string}`
  | `subactivity:${string}`
  | `execution:${string}`
  | `photo:${string}`;

export const ProcessScope = (source: ProcessScopeSource) =>
  SetMetadata(PROCESS_SCOPE_KEY, source);
