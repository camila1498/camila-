import type { SupabaseClient } from "@supabase/supabase-js";
import { fieldsOf } from "@/lib/forms/schema";
import type { FormDefinition } from "@/lib/forms/types";
import type { Applicant, ScoreReview } from "./bootcamp";

/** El puntaje solo aplica a campañas del Bootcamp cuya versión conserve las preguntas que lo alimentan. */
export function supportsScoring(formSlug: string, def: FormDefinition | null): def is FormDefinition {
  if (formSlug !== "bootcamp" || !def) return false;
  const ids = new Set(fieldsOf(def).map((f) => f.id));
  return ["B1", "B5", "B7", "B8", "B9", "B10"].every((id) => ids.has(id));
}

export function ageRangeOf(def: FormDefinition): { min?: number; max?: number } {
  const f = fieldsOf(def).find((x) => x.id === "B1");
  return f && f.type === "number" ? { min: f.min, max: f.max } : {};
}

type Row = {
  id: string;
  full_name: string;
  created_at: string;
  status: string;
  tags: string[] | null;
  score_review: ScoreReview | null;
  b1: string | null;
  b5: string | null;
  b7: string | null;
  b10: string | null;
  b11: string | null;
  b12: string | null;
};

const COLUMNS =
  "id,full_name,created_at,status,tags,score_review,b1:answers->>B1,b5:answers->>B5,b7:answers->>B7,b10:answers->>B10,b11:answers->>B11,b12:answers->>B12";
const CHUNK = 1000;

export const toApplicant = (r: Row): Applicant => ({
  id: r.id,
  name: r.full_name,
  createdAt: r.created_at,
  status: r.status,
  tags: r.tags ?? [],
  review: r.score_review ?? {},
  B1: r.b1 !== null && r.b1 !== "" && Number.isFinite(Number(r.b1)) ? Number(r.b1) : null,
  B5: r.b5,
  B7: r.b7,
  B10: r.b10,
  B11: r.b11,
  B12: r.b12,
});

/** Todas las postulaciones de la campaña, leyendo por tandas (la API devuelve como máximo 1000 filas). */
export async function loadApplicants(supabase: SupabaseClient, campaignId: string): Promise<Applicant[]> {
  const out: Applicant[] = [];
  for (let from = 0; from < 50000; from += CHUNK) {
    const { data } = await supabase
      .from("submissions")
      .select(COLUMNS)
      .eq("campaign_id", campaignId)
      .is("archived_at", null)
      .is("anonymized_at", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + CHUNK - 1)
      .overrideTypes<Row[], { merge: false }>();
    out.push(...(data ?? []).map(toApplicant));
    if ((data?.length ?? 0) < CHUNK) break;
  }
  return out;
}

/** Nombre visible de quienes calificaron. */
export async function loadReviewerNames(supabase: SupabaseClient, userIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("members")
    .select("user_id,full_name,email")
    .in("user_id", ids)
    .overrideTypes<{ user_id: string; full_name: string | null; email: string }[], { merge: false }>();
  return Object.fromEntries((data ?? []).map((m) => [m.user_id, m.full_name ?? m.email]));
}
