"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import { REVIEW_STATUSES, STATUS_LABELS } from "@/lib/forms/review";
import { UUID } from "@/lib/forms/review-data";
import { TEMPLATE_VARIABLES, unknownVariables } from "@/lib/messaging/templates";

function detailUrl(campaignId: string, submissionId: string, qs: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(qs);
  for (const [k, v] of Object.entries(extra)) params.set(k, v);
  const query = params.toString();
  return `/plataforma/campanas/${campaignId}/${submissionId}${query ? `?${query}` : ""}`;
}

/** Aprobar, lista de espera, pendiente o descartar; deja el cambio (y la nota) en el historial. */
export async function reviewSubmission(campaignId: string, submissionId: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const qs = String(formData.get("qs") ?? "");
  const fail = (message: string): never => redirect(detailUrl(campaignId, submissionId, qs, { error: message }));

  const status = String(formData.get("status") ?? "");
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) fail("Estado no válido.");
  if (!UUID.test(campaignId) || !UUID.test(submissionId)) fail("Postulación no válida.");

  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const { error } = await supabase.rpc("set_submission_status", { p_id: submissionId, p_status: status, p_note: note || null });
  if (error) {
    fail(
      error.message === "not_found"
        ? "La postulación ya no existe."
        : error.message === "archived"
          ? "La campaña está archivada: ya no se cambian estados."
          : `No se pudo cambiar el estado: ${error.message}`,
    );
  }

  revalidatePath(`/plataforma/campanas/${campaignId}`);
  revalidatePath("/plataforma/campanas");

  // Con "pasar a la siguiente" marcado, se salta directo a la próxima postulación.
  const next = formData.get("advance") === "on" ? String(formData.get("next") ?? "") : "";
  const message = `Marcada como ${STATUS_LABELS[status]?.toLowerCase() ?? status}.`;
  if (UUID.test(next)) redirect(detailUrl(campaignId, next, qs, { ok: `${message} Siguiente postulación.` }));
  redirect(detailUrl(campaignId, submissionId, qs, { ok: message }));
}

export async function saveNotes(campaignId: string, submissionId: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const qs = String(formData.get("qs") ?? "");
  if (!UUID.test(submissionId)) redirect(detailUrl(campaignId, submissionId, qs, { error: "Postulación no válida." }));

  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
  const { error } = await supabase.from("submissions").update({ notes: notes || null }).eq("id", submissionId);
  if (error) redirect(detailUrl(campaignId, submissionId, qs, { error: `No se pudieron guardar las notas: ${error.message}` }));

  revalidatePath(`/plataforma/campanas/${campaignId}/${submissionId}`);
  redirect(detailUrl(campaignId, submissionId, qs, { ok: "Notas guardadas." }));
}

/** Deja constancia de quién abrió WhatsApp para esta persona y con qué plantilla (no envía nada). */
export async function logWhatsApp(submissionId: string, template: string, to: string, who: "persona" | "tutor") {
  const { supabase, user } = await requireAdminOrThrow();
  if (!UUID.test(submissionId) || !/^\d{8,15}$/.test(to) || !/^[a-z_]{1,30}$/.test(template)) return;

  await supabase.from("submission_events").insert({
    submission_id: submissionId,
    kind: "whatsapp",
    created_by: user.id,
    detail: { template, to, who },
  });
}

/** Guarda el texto de una plantilla de mensaje. */
export async function saveTemplate(key: string, formData: FormData) {
  const { supabase, user } = await requireAdminOrThrow();
  const back = (params: Record<string, string>) => `/plataforma/mensajes?${new URLSearchParams(params).toString()}`;

  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (!/^[a-z_]{1,30}$/.test(key)) redirect(back({ error: "Plantilla no válida." }));
  if (!body) redirect(back({ error: "El mensaje no puede estar vacío." }));
  if (body.length > 1500) redirect(back({ error: "El mensaje es demasiado largo (máx. 1500 caracteres)." }));

  const unknown = unknownVariables(body);
  if (unknown.length > 0) {
    const valid = TEMPLATE_VARIABLES.map((v) => `{{${v.name}}}`).join(", ");
    redirect(back({ error: `Variable desconocida: ${unknown.join(", ")}. Las disponibles son ${valid}.` }));
  }

  const { error } = await supabase
    .from("message_templates")
    .update({ body, updated_by: user.id })
    .eq("key", key);
  if (error) redirect(back({ error: `No se pudo guardar: ${error.message}` }));

  revalidatePath("/plataforma/mensajes");
  redirect(back({ ok: "Mensaje guardado." }));
}

// ---------------------------------------------------------------- Cierre y cifras

const closingUrl = (campaignId: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return `/plataforma/campanas/${campaignId}/cierre${query ? `?${query}` : ""}`;
};

function refreshStatsPages(campaignId: string) {
  revalidatePath(`/plataforma/campanas/${campaignId}`);
  revalidatePath(`/plataforma/campanas/${campaignId}/cierre`);
  revalidatePath("/plataforma/campanas");
  revalidatePath("/plataforma/formularios");
  // Lo publicado se ve en la web: se actualiza al instante en vez de esperar el caché.
  revalidatePath("/");
}

/** Corta la recolección y deja calculada la instantánea de cifras. */
export async function closeCampaignAndCount(campaignId: string) {
  const { supabase } = await requireAdminOrThrow();
  if (!UUID.test(campaignId)) redirect("/plataforma/campanas");

  const { error } = await supabase.rpc("close_campaign", { p_id: campaignId });
  if (error) redirect(closingUrl(campaignId, { error: error.message === "not_open" ? "Esa campaña ya estaba cerrada." : `No se pudo cerrar: ${error.message}` }));

  refreshStatsPages(campaignId);
  redirect(closingUrl(campaignId, { ok: "Campaña cerrada: ya no recibe postulaciones. Estas son sus cifras." }));
}

/** Vuelve a calcular las cifras (p. ej. tras seguir revisando postulaciones). No cambia lo publicado. */
export async function refreshStats(campaignId: string) {
  const { supabase } = await requireAdminOrThrow();
  if (!UUID.test(campaignId)) redirect("/plataforma/campanas");

  const { error } = await supabase.rpc("refresh_campaign_stats", { p_id: campaignId });
  if (error) {
    redirect(
      closingUrl(campaignId, {
        error: error.message === "purged" ? "Ya se eliminaron datos de esta campaña: las cifras quedan como estaban." : `No se pudieron recalcular: ${error.message}`,
      }),
    );
  }

  refreshStatsPages(campaignId);
  redirect(closingUrl(campaignId, { ok: "Cifras recalculadas. Si ya habías armado la vista pública, vuelve a guardarla para que las use." }));
}

const STATS_ERRORS: Record<string, string> = {
  not_closed: "Primero hay que cerrar la campaña.",
  invalid_metric: "Hay una cifra que no se puede publicar.",
  invalid_field: "Ese desglose no se puede publicar (solo preguntas de opciones y no sensibles).",
  no_capacity: "Esta campaña no tiene cupos definidos.",
  no_countries: "Esta campaña no tiene la pregunta de país (C4).",
  too_few: "Con menos de 20 postulaciones solo se publican los totales, no los desgloses (se podría identificar a alguien).",
  not_found: "La campaña ya no existe.",
};

/** Guarda qué cifras se mostrarán. No publica: deja la vista previa para revisarla. */
export async function saveStatsSelection(campaignId: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  if (!UUID.test(campaignId)) redirect("/plataforma/campanas");

  const metrics = formData.getAll("metric").map(String);
  const fields = formData.getAll("field").map(String);
  if (metrics.length === 0 && fields.length === 0) {
    redirect(closingUrl(campaignId, { error: "Marca al menos una cifra para mostrar." }));
  }

  const { error } = await supabase.rpc("set_public_stats", { p_id: campaignId, p_metrics: metrics, p_field_ids: fields });
  if (error) redirect(closingUrl(campaignId, { error: STATS_ERRORS[error.message] ?? `No se pudo guardar: ${error.message}` }));

  refreshStatsPages(campaignId);
  redirect(closingUrl(campaignId, { ok: "Vista previa guardada. Revísala abajo; todavía no es pública." }));
}

export async function publishStats(campaignId: string, publish: boolean) {
  const { supabase } = await requireAdminOrThrow();
  if (!UUID.test(campaignId)) redirect("/plataforma/campanas");

  const { error } = await supabase.rpc("publish_public_stats", { p_id: campaignId, p_publish: publish });
  if (error) {
    redirect(closingUrl(campaignId, { error: error.message === "nothing_to_publish" ? "Primero guarda qué cifras mostrar." : `No se pudo actualizar: ${error.message}` }));
  }

  refreshStatsPages(campaignId);
  redirect(closingUrl(campaignId, { ok: publish ? "Cifras publicadas en la web." : "Cifras retiradas de la web." }));
}

const ARCHIVE_ERRORS: Record<string, string> = {
  export_required: "Antes de archivar descarga la exportación completa: después se eliminarán datos con el tiempo.",
  not_closed: "Primero hay que cerrar la campaña.",
  invalid_date: "La fecha de fin del programa no es válida (no puede ser futura).",
  not_found: "La campaña ya no existe.",
};

/** Marca la campaña como archivada y registra cuándo terminó el programa (desde ahí corre el plazo de los participantes). */
export async function archiveCampaign(campaignId: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  if (!UUID.test(campaignId)) redirect("/plataforma/campanas");

  const date = String(formData.get("program_end") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect(closingUrl(campaignId, { error: "Indica cuándo terminó el programa." }));

  const { error } = await supabase.rpc("archive_campaign", { p_id: campaignId, p_program_ended_on: date });
  if (error) redirect(closingUrl(campaignId, { error: ARCHIVE_ERRORS[error.message] ?? `No se pudo archivar: ${error.message}` }));

  refreshStatsPages(campaignId);
  revalidatePath("/plataforma/vencimientos");
  redirect(closingUrl(campaignId, { ok: "Campaña archivada. Los plazos de conservación ya corren: míralos en Vencimientos." }));
}
