/** Peru no tiene horario de verano: America/Lima es siempre UTC-5. */
const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000;

/** ISO (UTC) -> valor para <input type="datetime-local"> en hora de Lima. */
export function toLimaInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(Date.parse(iso) + LIMA_OFFSET_MS).toISOString().slice(0, 16);
}

/** Valor de <input type="datetime-local"> interpretado en hora de Lima -> ISO (UTC), o null. */
export function fromLimaInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}:00Z`) - LIMA_OFFSET_MS;
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

export function formatLima(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
