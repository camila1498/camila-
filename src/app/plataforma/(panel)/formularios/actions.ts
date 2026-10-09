"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import { checkPublishable, loadFormState } from "@/lib/forms/admin";
import { fromLimaInput } from "@/lib/forms/lima";
import { legalStatus, loadLegal } from "@/lib/forms/legal-admin";
import { formPath, SLUG_MAX, SLUG_PATTERN, slugify } from "@/lib/forms/paths";
import { parseDefinition } from "@/lib/forms/schema";
import { blankDefinition, copyDefinition } from "@/lib/forms/templates";

type Slug = string;

const BASE = "/plataforma/formularios";

function done(message: string): never {
  redirect(`${BASE}?ok=${encodeURIComponent(message)}`);
}

function failAt(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

function isSlug(value: string): value is Slug {
  return SLUG_PATTERN.test(value) && value.length <= SLUG_MAX;
}

function refresh(slug: Slug) {
  revalidatePath(BASE);
  revalidatePath(`${BASE}/${slug}/publicar`);
  revalidatePath(`${BASE}/${slug}/editar`);
  revalidatePath(formPath(slug));
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

const CREATE_ERRORS: Record<string, string> = {
  slug_taken: "Ya existe un formulario con ese nombre de enlace. Elige otro.",
  invalid_slug: "El enlace solo admite minúsculas, números y guiones (máx. 40).",
  invalid_title: "Escribe un nombre para el formulario.",
  invalid_definition: "No se pudo crear la plantilla del formulario.",
};

/** Crea un formulario nuevo (en blanco o copiando otro) y abre el editor. */
export async function createForm(formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const back = `${BASE}/nuevo`;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) failAt(back, CREATE_ERRORS.invalid_title!);
  if (title.length > 200) failAt(back, "El nombre es demasiado largo.");

  const slug = slugify(String(formData.get("slug") ?? "") || title);
  if (!slug || !isSlug(slug)) failAt(back, CREATE_ERRORS.invalid_slug!);

  const from = String(formData.get("from") ?? "blank");
  let definition = blankDefinition(slug, title);
  if (from !== "blank") {
    if (!isSlug(from)) failAt(back, "El formulario de origen no es válido.");
    const state = await loadFormState(supabase, from);
    const source = state?.draft ?? state?.latest;
    if (!source) failAt(back, "No se pudo leer el formulario de origen.");
    definition = copyDefinition(source, slug, title);
  }

  // Lo que se guarda pasa siempre por el esquema, igual que cualquier borrador.
  const parsed = parseDefinition(definition);
  if (!parsed.ok) failAt(back, `La plantilla no es válida: ${parsed.errors[0]}`);

  const { error } = await supabase.rpc("create_form", {
    p_slug: slug,
    p_title: title,
    p_definition: parsed.definition,
  });
  if (error) failAt(back, CREATE_ERRORS[error.message] ?? `No se pudo crear: ${error.message}`);

  revalidatePath(BASE);
  redirect(`${BASE}/${slug}/editar`);
}

/** Elimina un formulario que nunca se publicó (los publicados se conservan por su historial). */
export async function deleteForm(slug: string) {
  const { supabase } = await requireAdminOrThrow();
  if (!isSlug(slug)) failAt(BASE, "Formulario no válido.");

  const { error } = await supabase.rpc("delete_form", { p_slug: slug });
  if (error) {
    failAt(
      BASE,
      error.message === "already_published"
        ? "Este formulario ya se publicó: se conserva por su historial de respuestas."
        : `No se pudo eliminar: ${error.message}`,
    );
  }

  revalidatePath(BASE);
  done("Formulario eliminado.");
}
