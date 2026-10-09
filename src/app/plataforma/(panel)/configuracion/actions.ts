"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminOrThrow } from "@/lib/admin/auth";

const BASE = "/plataforma/configuracion";

function done(message: string): never {
  redirect(`${BASE}?ok=${encodeURIComponent(message)}`);
}

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

const legalSchema = z.object({
  controller_name: z.string().trim().min(1, "Indica quién es el responsable").max(200),
  ruc: z.string().trim().regex(/^(\d{11})?$/, "El RUC tiene 11 dígitos"),
  address: z.string().trim().max(300),
  privacy_email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Escribe un correo válido"),
  storage_notice: z.string().trim().min(1, "Describe dónde se guardan los datos").max(600),
});

/** Guardar datos legales: si cambia alguno, la base invalida la aprobación de Legal automáticamente. */
export async function saveLegal(formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const parsed = legalSchema.safeParse({
    controller_name: formData.get("controller_name") ?? "",
    ruc: formData.get("ruc") ?? "",
    address: formData.get("address") ?? "",
    privacy_email: formData.get("privacy_email") ?? "",
    storage_notice: formData.get("storage_notice") ?? "",
  });
  if (!parsed.success) fail(parsed.error.issues[0]!.message);

  const { error } = await supabase.from("site_settings").update(parsed.data).eq("id", true);
  if (error) fail(`No se pudo guardar: ${error.message}`);

  revalidatePath(BASE);
  revalidatePath("/plataforma/formularios");
  done("Datos guardados. Si cambiaste alguno, Legal debe aprobarlos de nuevo.");
}

/** Registra que Legal revisó y aprobó los datos y el aviso de privacidad. */
export async function approveLegal(formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const approver = String(formData.get("approved_by") ?? "").trim();
  if (!approver) fail("Escribe el nombre de quien aprobó por Legal.");
  if (approver.length > 120) fail("El nombre es demasiado largo.");
  if (formData.get("confirm") !== "on") fail("Marca la casilla para confirmar la aprobación.");

  const { data } = await supabase
    .from("site_settings")
    .select("ruc,address,privacy_email")
    .maybeSingle()
    .overrideTypes<{ ruc: string; address: string; privacy_email: string }, { merge: false }>();
  if (!data?.ruc.trim() || !data.address.trim() || !data.privacy_email.trim()) {
    fail("Completa el RUC, el domicilio y el correo de privacidad antes de aprobar.");
  }

  const { error } = await supabase
    .from("site_settings")
    .update({ approved_at: new Date().toISOString(), approved_by: approver })
    .eq("id", true);
  if (error) fail(`No se pudo registrar la aprobación: ${error.message}`);

  revalidatePath(BASE);
  revalidatePath("/plataforma/formularios");
  done(`Aprobado por Legal (${approver}). Ya se pueden publicar formularios.`);
}

export async function revokeLegal() {
  const { supabase } = await requireAdminOrThrow();
  const { error } = await supabase.from("site_settings").update({ approved_at: null, approved_by: null }).eq("id", true);
  if (error) fail(`No se pudo retirar la aprobación: ${error.message}`);

  revalidatePath(BASE);
  revalidatePath("/plataforma/formularios");
  done("Aprobación retirada: los formularios abiertos dejan de recibir envíos hasta que Legal vuelva a aprobar.");
}
