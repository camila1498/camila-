import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";
import { missingConfig } from "./config";
import type { FormDefinition } from "./types";

/**
 * - open:   recibe envios.
 * - soon:   borrador, aun sin fecha de apertura o con datos legales/de programa pendientes.
 * - closed: cerrado a mano o pasada la fecha de cierre.
 */
export type Availability = "open" | "soon" | "closed";

type FormRow = {
  status: "draft" | "open" | "closed";
  opens_at: string | null;
  closes_at: string | null;
  capacity: number | null;
};

export type FormRowStatus = {
  status: "draft" | "open" | "closed";
  opens_at: string | null;
  closes_at: string | null;
};

/** Disponibilidad efectiva de un formulario a partir de su fila y de lo que falta por configurar. */
export function computeAvailability(row: FormRowStatus | null, missing: string[]): Availability {
  if (!row) return "soon";
  const now = Date.now();
  let availability: Availability = "open";
  if (row.status === "draft") availability = "soon";
  else if (row.status === "closed") availability = "closed";
  else if (row.opens_at && now < Date.parse(row.opens_at)) availability = "soon";
  else if (row.closes_at && now > Date.parse(row.closes_at)) availability = "closed";

  // Aunque este "abierto" en la base, sin datos legales completos no se reciben respuestas.
  if (availability === "open" && missing.length > 0) availability = "soon";
  return availability;
}

export async function getAvailability(slug: FormDefinition["slug"]): Promise<{
  availability: Availability;
  missing: string[];
  capacity: number | null;
}> {
  const missing = missingConfig(slug);
  if (!isSupabaseConfigured()) return { availability: "soon", missing, capacity: null };

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("forms")
    .select("status,opens_at,closes_at,capacity")
    .eq("slug", slug)
    .maybeSingle()
    .overrideTypes<FormRow, { merge: false }>();

  return { availability: computeAvailability(data, missing), missing, capacity: data?.capacity ?? null };
}
