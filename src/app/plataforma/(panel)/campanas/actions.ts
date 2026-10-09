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
  if (error) fail(error.message === "not_found" ? "La postulación ya no existe." : `No se pudo cambiar el estado: ${error.message}`);

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
