/** Capitalize the first letter while preserving brand names and the remaining text. */
export function displayTitle(title: string): string {
  return title.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase('es-AR'));
}
