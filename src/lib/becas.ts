import type { Beca, BecaTagVariant } from "@/data/becas";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";

type BecaRow = {
  id: string;
  label: string;
  tag_variant: BecaTagVariant;
  estado: string;
  title: string;
  institution: string;
  description: string;
  deadline: string;
  tags: string[];
  rank: number | null;
};

export type BecasResult =
  | { ok: true; becas: Beca[] }
  | { ok: false; reason: "not-configured" | "error" };

export async function getBecas(): Promise<BecasResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "not-configured" };

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("becas")
    .select("id,label,tag_variant,estado,title,institution,description,deadline,tags,rank")
    .eq("published", true)
    .order("created_at", { ascending: true })
    .overrideTypes<BecaRow[], { merge: false }>();

  if (error) {
    console.error("No se pudieron cargar las becas:", error.message);
    return { ok: false, reason: "error" };
  }

  return {
    ok: true,
    becas: data.map((row) => ({
      id: row.id,
      label: row.label,
      tagVariant: row.tag_variant,
      estado: row.estado,
      title: row.title,
      institution: row.institution,
      description: row.description,
      deadline: row.deadline,
      tags: row.tags,
      rank: row.rank ?? undefined,
    })),
  };
}
