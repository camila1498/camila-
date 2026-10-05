"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import { parseBecaForm } from "@/lib/admin/becas-schema";
import { createClient } from "@/lib/supabase/server";

function done(message: string): never {
  redirect(`/admin/becas?ok=${encodeURIComponent(message)}`);
}

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

function dbMessage(error: { code?: string; message: string }) {
  if (error.code === "23505") return "Ya existe una beca con ese slug o ese ranking.";
  return `No se pudo guardar: ${error.message}`;
}

function refreshPublic() {
  revalidatePath("/oportunidades");
  revalidatePath("/admin/becas");
}

export async function createBeca(formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const parsed = parseBecaForm(formData);
  if (!parsed.success || !parsed.data.slug) {
    fail("/admin/becas/nueva", parsed.success ? "Falta el título" : parsed.error.issues[0]!.message);
  }

  const { error } = await supabase.from("becas").insert(parsed.data);
  if (error) fail("/admin/becas/nueva", dbMessage(error));

  refreshPublic();
  done("Beca creada");
}

export async function updateBeca(id: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const parsed = parseBecaForm(formData);
  if (!parsed.success) fail(`/admin/becas/${id}`, parsed.error.issues[0]!.message);

  const { error } = await supabase.from("becas").update(parsed.data).eq("id", id);
  if (error) fail(`/admin/becas/${id}`, dbMessage(error));

  refreshPublic();
  done("Cambios guardados");
}

export async function deleteBeca(id: string) {
  const { supabase } = await requireAdminOrThrow();
  const { error } = await supabase.from("becas").delete().eq("id", id);
  if (error) fail("/admin/becas", dbMessage(error));

  refreshPublic();
  done("Beca eliminada");
}

export async function setPublished(id: string, published: boolean) {
  const { supabase } = await requireAdminOrThrow();
  const { error } = await supabase.from("becas").update({ published }).eq("id", id);
  if (error) fail("/admin/becas", dbMessage(error));

  refreshPublic();
  done(published ? "Beca publicada" : "Beca oculta");
}

export async function setRank(id: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const raw = String(formData.get("rank") ?? "").trim();
  const rank = raw === "" ? null : Number(raw);
  if (rank !== null && (!Number.isInteger(rank) || rank < 1)) {
    fail("/admin/becas", "El ranking debe ser un número entero mayor que 0.");
  }

  const { error } = await supabase.rpc("set_beca_rank", { p_id: id, p_rank: rank });
  if (error) fail("/admin/becas", dbMessage(error));

  refreshPublic();
  done("Ranking actualizado");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
