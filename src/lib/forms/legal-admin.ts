import type { SupabaseClient } from "@supabase/supabase-js";

export type LegalRow = {
  controller_name: string;
  ruc: string;
  address: string;
  privacy_email: string;
  storage_notice: string;
  approved_at: string | null;
  approved_by: string | null;
};

export async function loadLegal(supabase: SupabaseClient): Promise<LegalRow | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("controller_name,ruc,address,privacy_email,storage_notice,approved_at,approved_by")
    .maybeSingle()
    .overrideTypes<LegalRow, { merge: false }>();
  return data;
}

/** Lo que falta para poder abrir cualquier formulario (misma regla que `legal_ready()` en la base). */
export function legalStatus(row: LegalRow | null) {
  const missing: string[] = [];
  if (!row?.ruc.trim()) missing.push("RUC");
  if (!row?.address.trim()) missing.push("domicilio");
  if (!row?.privacy_email.trim()) missing.push("correo de privacidad");
  if (!row?.approved_at) missing.push("aprobación de Legal");
  return {
    ready: missing.length === 0,
    missing,
    message: missing.length
      ? `Falta en Configuración: ${missing.join(", ")}.`
      : "",
  };
}
