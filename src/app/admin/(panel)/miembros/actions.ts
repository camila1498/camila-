"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminOrThrow } from "@/lib/admin/auth";

function done(message: string): never {
  redirect(`/admin/miembros?ok=${encodeURIComponent(message)}`);
}

function fail(message: string): never {
  redirect(`/admin/miembros?error=${encodeURIComponent(message)}`);
}

const memberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .pipe(z.string().email("Escribe un correo válido")),
  full_name: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v === "" ? null : v)),
  role: z.enum(["admin", "team", "student"]),
});

export async function addMember(formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  const parsed = memberSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name") ?? "",
    role: formData.get("role"),
  });
  if (!parsed.success) fail(parsed.error.issues[0]!.message);

  const { error } = await supabase.from("members").insert(parsed.data);
  if (error) fail(error.code === "23505" ? "Ese correo ya está registrado." : error.message);

  revalidatePath("/admin/miembros");
  done("Miembro registrado. Ya puede ingresar con su cuenta de Google.");
}

/** Evita que un admin se quite el acceso (o el rol) a si mismo por accidente. */
async function assertNotSelf(
  supabase: Awaited<ReturnType<typeof requireAdminOrThrow>>["supabase"],
  userId: string,
  memberId: string,
) {
  const { data } = await supabase.from("members").select("user_id").eq("id", memberId).maybeSingle();
  if (data?.user_id === userId) fail("No puedes cambiar tu propio acceso.");
}

export async function setMemberActive(id: string, active: boolean) {
  const { supabase, user } = await requireAdminOrThrow();
  await assertNotSelf(supabase, user.id, id);

  const { error } = await supabase.from("members").update({ active }).eq("id", id);
  if (error) fail(error.message);

  revalidatePath("/admin/miembros");
  done(active ? "Miembro reactivado" : "Acceso desactivado");
}

export async function setMemberRole(id: string, formData: FormData) {
  const { supabase, user } = await requireAdminOrThrow();
  const role = z.enum(["admin", "team", "student"]).safeParse(formData.get("role"));
  if (!role.success) fail("Rol no válido.");
  await assertNotSelf(supabase, user.id, id);

  const { error } = await supabase.from("members").update({ role: role.data }).eq("id", id);
  if (error) fail(error.message);

  revalidatePath("/admin/miembros");
  done("Rol actualizado");
}
