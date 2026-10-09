"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import { loadFormState } from "@/lib/forms/admin";
import { SLUG_MAX, SLUG_PATTERN } from "@/lib/forms/paths";
import { parseDefinition, validateDefinition } from "@/lib/forms/schema";

export type SaveDraftResult = { ok: true; savedAt: string } | { ok: false; errors: string[] };

/**
 * Guarda el borrador. El servidor revalida todo (esquema, reglas de preguntas base y de ids ya
 * publicados) y rechaza guardar si hay una campaña abierta; la base de datos lo impide tambien.
 */
export async function saveDraft(slug: string, json: string): Promise<SaveDraftResult> {
  const { supabase, user } = await requireAdminOrThrow();
  if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX) return { ok: false, errors: ["Formulario no válido."] };

  let input: unknown;
  try {
    input = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["No se pudo leer el formulario."] };
  }

  const parsed = parseDefinition(input);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (parsed.definition.slug !== slug) return { ok: false, errors: ["El formulario no coincide."] };

  const state = await loadFormState(supabase, slug);
  if (!state) return { ok: false, errors: ["Formulario no encontrado."] };
  if (state.openCampaign) {
    return { ok: false, errors: ["El formulario está publicado y recibiendo postulaciones: ciérralo para poder editarlo."] };
  }

  const errors = validateDefinition(parsed.definition, state.latest);
  if (errors.length > 0) return { ok: false, errors };

  const savedAt = new Date().toISOString();
  const { error } = await supabase.from("form_drafts").upsert({
    form_slug: slug,
    definition: parsed.definition,
    based_on_version: state.latestVersion ?? 1,
    updated_by: user.id,
    updated_at: savedAt,
  });
  if (error) {
    return {
      ok: false,
      errors: [error.message === "form_locked" ? "El formulario está publicado: no admite cambios." : `No se pudo guardar: ${error.message}`],
    };
  }

  // El nombre interno (lista de la plataforma y titulo de "pronto"/"cerrado") sigue al titulo del formulario.
  await supabase.from("forms").update({ title: parsed.definition.title }).eq("slug", slug);

  revalidatePath("/plataforma/formularios");
  revalidatePath(`/plataforma/formularios/${slug}/publicar`);
  return { ok: true, savedAt };
}
