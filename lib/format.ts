/** Preposiciones y artículos que van en minúscula (salvo al inicio). */
const PARTICULAS = new Set([
  "a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "lo", "los",
  "o", "para", "por", "sin", "sobre", "u", "un", "una", "unos", "unas", "y",
]);

/**
 * Formatea el título de un producto para mostrarlo con tipografía correcta.
 * Ej: "lámpara de mesa moderna" → "Lámpara de Mesa Moderna"
 */
export function formatearTituloProducto(titulo: string | null | undefined): string {
  if (!titulo?.trim()) return "";

  return titulo
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palabra, index) => {
      if (index > 0 && PARTICULAS.has(palabra)) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
}
