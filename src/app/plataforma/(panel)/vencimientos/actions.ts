"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import { UUID } from "@/lib/forms/review-data";

const BASE = "/plataforma/vencimientos";
const back = (params: Record<string, string>) => `${BASE}?${new URLSearchParams(params).toString()}`;

const PURGE_ERRORS: Record<string, string> = {
  export_required: "Antes hay que descargar la exportación completa de esta campaña (en «Cierre y exportación»).",
  not_closed: "La campaña sigue abierta.",
  not_found: "La campaña ya no existe.",
  purged: "Las cifras de esta campaña ya quedaron fijadas.",
};

/** Elimina las no seleccionadas vencidas y anonimiza a las participantes vencidas. */
export async function purgeExpired(campaignId: string) {
  const { supabase } = await requireAdminOrThrow();
  if (!UUID.test(campaignId)) redirect(back({ error: "Campaña no válida." }));

  const { data, error } = await supabase.rpc("purge_expired", { p_id: campaignId });
  if (error) redirect(back({ error: PURGE_ERRORS[error.message] ?? `No se pudo completar: ${error.message}` }));

  revalidatePath(BASE);
  revalidatePath("/plataforma/campanas");
  revalidatePath(`/plataforma/campanas/${campaignId}`);
  const { deleted = 0, anonymized = 0 } = (data ?? {}) as { deleted?: number; anonymized?: number };
  redirect(
    back({
      ok:
        deleted + anonymized === 0
          ? "No había datos vencidos."
          : `Listo: ${deleted} postulaciones eliminadas y ${anonymized} anonimizadas.`,
    }),
  );
}

const months = (v: FormDataEntryValue | null) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isInteger(n) && n >= 1 && n <= 120 ? n : null;
};

/** Plazos de conservación de un formulario (deben coincidir con lo que dice su aviso de privacidad). */
export async function saveRetentionRules(slug: string, formData: FormData) {
  const { supabase, user } = await requireAdminOrThrow();
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) redirect(back({ error: "Formulario no válido." }));

  const not_selected_months = months(formData.get("not_selected"));
  const waitlist_months = months(formData.get("waitlist"));
  const participant_months = months(formData.get("participants"));
  if (!not_selected_months || !waitlist_months || !participant_months) {
    redirect(back({ error: "Los plazos son meses enteros entre 1 y 120." }));
  }

  const { error } = await supabase
    .from("retention_rules")
    .upsert({ form_slug: slug, not_selected_months, waitlist_months, participant_months, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) redirect(back({ error: `No se pudieron guardar los plazos: ${error.message}` }));

  revalidatePath(BASE);
  redirect(back({ ok: "Plazos guardados. Recuerda que el aviso de privacidad del formulario debe decir lo mismo." }));
}
