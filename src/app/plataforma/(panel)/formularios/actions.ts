"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import { checkPublishable, loadFormState } from "@/lib/forms/admin";
import { fromLimaInput } from "@/lib/forms/lima";
import { legalStatus, loadLegal } from "@/lib/forms/legal-admin";
import { formPaths } from "@/lib/forms/paths";
import type { FormDefinition } from "@/lib/forms/types";

type Slug = FormDefinition["slug"];

const BASE = "/plataforma/formularios";

function done(message: string): never {
  redirect(`${BASE}?ok=${encodeURIComponent(message)}`);
}

function failAt(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

function isSlug(value: string): value is Slug {
  return value in formPaths;
}

function refresh(slug: Slug) {
  revalidatePath(BASE);
  revalidatePath(`${BASE}/${slug}/publicar`);
  revalidatePath(`${BASE}/${slug}/editar`);
  revalidatePath(formPaths[slug]);
}

const PUBLISH_ERRORS: Record<string, string> = {
  legal_pending: "Faltan datos legales o la aprobación de Legal (Configuración).",
  already_open: "Este formulario ya tiene una campaña abierta.",
  no_draft: "El formulario no tiene borrador.",
  invalid_window: "Las fechas no son válidas: el cierre debe ser futuro y posterior a la apertura.",
  name_required: "Escribe un nombre para la campaña.",
};

/**
 * Publicar = abrir una campaña con la version congelada del borrador. Se vuelve a comprobar todo en
 * el servidor (la pantalla de confirmacion no es una garantia) y la base lo exige otra vez.
 */
export async function publishForm(slug: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  if (!isSlug(slug)) failAt(BASE, "Formulario no válido.");
  const back = `${BASE}/${slug}/publicar`;

  if (formData.get("confirm") !== "on") {
    failAt(back, "Marca la casilla para confirmar que entiendes que no podrás editarlo mientras reciba postulaciones.");
  }

  const state = await loadFormState(supabase, slug);
  if (!state) failAt(BASE, "Formulario no encontrado.");
  if (state.openCampaign) failAt(BASE, "Este formulario ya tiene una campaña abierta.");

  const legal = legalStatus(await loadLegal(supabase));
  const check = checkPublishable(state.draft, state.latest, { legalReady: legal.ready, legalMissing: legal.message });
  if (check.blockers.length > 0) failAt(back, check.blockers[0]!);
  if (check.placeholders.length > 0) failAt(back, `Completa los textos pendientes antes de publicar (${check.placeholders[0]}).`);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) failAt(back, PUBLISH_ERRORS.name_required!);

  const opensRaw = String(formData.get("opens_at") ?? "");
  const closesRaw = String(formData.get("closes_at") ?? "");
  const opens_at = opensRaw ? fromLimaInput(opensRaw) : null;
  const closes_at = closesRaw ? fromLimaInput(closesRaw) : null;
  if ((opensRaw && !opens_at) || (closesRaw && !closes_at)) failAt(back, "Revisa las fechas.");

  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw === "" ? null : Number(capacityRaw);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    failAt(back, "Los cupos deben ser un número entero mayor que 0.");
  }

  const { error } = await supabase.rpc("publish_form", {
    p_slug: slug,
    p_name: name,
    p_opens_at: opens_at,
    p_closes_at: closes_at,
    p_capacity: capacity,
  });
  if (error) failAt(back, PUBLISH_ERRORS[error.message] ?? `No se pudo publicar: ${error.message}`);

  refresh(slug);
  done(`"${name}" está publicado: el formulario ya no se puede editar mientras reciba postulaciones.`);
}

/** Cierra la campaña: deja de recolectar y el formulario vuelve a poder editarse. */
export async function closeCampaign(slug: string, campaignId: string) {
  const { supabase } = await requireAdminOrThrow();
  if (!isSlug(slug)) failAt(BASE, "Formulario no válido.");

  const { error } = await supabase.rpc("close_campaign", { p_id: campaignId });
  if (error) failAt(BASE, error.message === "not_open" ? "Esa campaña ya estaba cerrada." : `No se pudo cerrar: ${error.message}`);

  refresh(slug);
  done("Campaña cerrada: ya no recibe postulaciones y el formulario se puede editar de nuevo.");
}
