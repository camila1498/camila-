/** Instantánea agregada de una campaña (la calcula la base al cerrarla; solo conteos). */
export type OptionCount = { value: string; label: string; count: number };

export type FieldStat =
  | { id: string; label: string; type: "select" | "multiselect" | "boolean"; answered: number; items: OptionCount[] }
  | { id: string; label: string; type: "number"; summary: { min: number; max: number; avg: number; n: number } | null };

export type Snapshot = {
  schema: 1;
  generatedAt: string;
  received: number;
  minors: number;
  marketing: number;
  capacity: number | null;
  byStatus: Record<string, number>;
  byDay: { day: string; n: number }[];
  fields: FieldStat[];
};

/** Lo que se puede mostrar en la web; ya pasó las reglas de privacidad en la base. */
export type PublicData = {
  metrics: { received?: number; capacity?: number; perSpot?: number; accepted?: number; countries?: number };
  fields: { id: string; label: string; answered: number; items: { label: string; count: number }[] }[];
};

export type PublicCampaign = { name: string; formSlug: string; publishedAt: string; data: PublicData };

export type StatsRow = {
  snapshot: Snapshot;
  generated_at: string;
  public_data: PublicData | null;
  public_selection: { metrics: string[]; fields: string[] } | null;
  published: boolean;
  published_at: string | null;
};

export const METRICS = [
  { key: "received", label: "Postulaciones recibidas", example: "500 postulaciones" },
  { key: "capacity", label: "Cupos disponibles", example: "50 cupos" },
  { key: "per_spot", label: "Postulaciones por cupo", example: "10 postulaciones por cada cupo" },
  { key: "accepted", label: "Personas aceptadas", example: "Aprobadas + confirmadas" },
  { key: "countries", label: "Países de origen", example: "Cantidad de países (pregunta C4)" },
] as const;

export type MetricKey = (typeof METRICS)[number]["key"];

/** Debajo de esto no se publican desgloses: con pocas personas (y menores) se podría identificar a alguien. */
export const MIN_FOR_BREAKDOWNS = 20;
