// Atributos del corrector ortográfico nativo del navegador para campos de texto.

/**
 * Campos de prosa en español (títulos, descripciones, mensajes).
 * `lang` fija el diccionario español aunque el navegador esté en otro idioma.
 */
export const spellCheckEs = {
  spellCheck: true,
  lang: 'es',
  autoCapitalize: 'sentences',
  autoCorrect: 'on',
} as const;

/**
 * Campos que no son prosa (cédulas, códigos, contraseñas, buscadores).
 * Sin esto el navegador los subraya en rojo y sugiere correcciones inútiles.
 */
export const noSpellCheck = {
  spellCheck: false,
  autoCorrect: 'off',
} as const;
