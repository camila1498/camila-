"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { getFormDefinition } from "./definitions";
import { getAvailability } from "./status";
import type { Answers } from "./types";
import { validateSubmission } from "./validate";

export type SubmitResult =
  | { ok: true; ended?: string }
  | { ok: false; message?: string; errors?: Record<string, string> };

const MIN_FILL_MS = 4000;

const DB_MESSAGES: Record<string, string> = {
  form_closed: "Este formulario no está recibiendo respuestas en este momento.",
  duplicate: "Ya recibimos una postulación con este correo. Si necesitas corregir algo, escríbenos.",
  consent_required: "Debes aceptar el aviso de privacidad para continuar.",
  invalid_payload: "Revisa tus datos e inténtalo de nuevo.",
};

/**
 * Valida en el servidor (autoritativo), separa los datos sensibles y guarda via la funcion
 * submit_form de Supabase, que ademas exige que el formulario este abierto.
 */
export async function submitForm(
  slug: string,
  raw: Answers,
  meta: { website?: string; elapsedMs?: number },
): Promise<SubmitResult> {
  const def = getFormDefinition(slug);
  if (!def) return { ok: false, message: "Formulario no encontrado." };

  // Trampas anti-spam: campo oculto relleno o envio demasiado rapido. Respondemos como exito.
  if (meta.website || (meta.elapsedMs ?? 0) < MIN_FILL_MS) return { ok: true };

  const { availability } = await getAvailability(def.slug);
  if (availability !== "open") return { ok: false, message: DB_MESSAGES.form_closed };

  const result = validateSubmission(def, raw);
  if (!result.ok) return { ok: false, errors: result.errors, message: "Revisa los campos marcados." };
  if (result.ended) return { ok: true, ended: result.message };

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("submit_form", {
    p_slug: def.slug,
    p_answers: result.answers,
    p_sensitive: result.sensitive,
    p_is_minor: def.minorField ? result.answers[def.minorField] === true : false,
    p_marketing: result.answers.C8 === true,
    p_version: def.version,
  });

  if (error) {
    const known = DB_MESSAGES[error.message];
    if (!known) console.error("submit_form falló:", error.message);
    return { ok: false, message: known ?? "No pudimos guardar tu respuesta. Inténtalo de nuevo en unos minutos." };
  }
  return { ok: true };
}
