export * from './product-transformer';

export function translateColorToSpanish(color: string): string {
  const map: Record<string, string> = {
    red: 'Rojo',
    blue: 'Azul',
    green: 'Verde',
    yellow: 'Amarillo',
    black: 'Negro',
    white: 'Blanco',
    purple: 'Morado',
    pink: 'Rosa',
    orange: 'Naranja',
    gray: 'Gris',
    brown: 'Marrón',
  };
  return map[color.trim().toLowerCase()] ?? color;
}
