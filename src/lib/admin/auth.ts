import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Exige un usuario autenticado que sea admin. Se llama en el layout del panel y en
 * cada Server Action: la proteccion real son las politicas RLS, esto da el error claro.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, user, isAdmin: isAdmin === true };
}

export async function requireAdminOrThrow() {
  const session = await requireAdmin();
  if (!session.isAdmin) throw new Error("No autorizado");
  return session;
}
