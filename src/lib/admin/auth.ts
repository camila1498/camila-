import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "team" | "student";

const ROLES: Role[] = ["admin", "team", "student"];

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  team: "Equipo",
  student: "Estudiante",
};

/**
 * Sesion de la plataforma: usuario autenticado + su rol de miembro (null si no esta
 * registrado). La proteccion real de los datos son las politicas RLS; esto decide que
 * se ve y da errores claros.
 */
export async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data } = await supabase.rpc("member_role");
  const role = ROLES.find((r) => r === data) ?? null;
  return { supabase, user, role };
}

/** Para paginas: si el rol no esta permitido, vuelve al dashboard en vez de mostrar un error. */
export async function requireRole(...allowed: Role[]) {
  const session = await requireMember();
  if (!session.role || !allowed.includes(session.role)) redirect("/admin");
  return { ...session, role: session.role };
}

/** Para Server Actions y paginas restringidas a ciertos roles. */
export async function requireRoleOrThrow(...allowed: Role[]) {
  const session = await requireMember();
  if (!session.role || !allowed.includes(session.role)) throw new Error("No autorizado");
  return { ...session, role: session.role };
}

export const requireAdminOrThrow = () => requireRoleOrThrow("admin");
