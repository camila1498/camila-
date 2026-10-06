import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireMember, roleLabels } from "@/lib/admin/auth";
import { navFor } from "@/lib/admin/nav";
import { signOut } from "./actions";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Plataforma — CreateLatam",
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireMember();

  if (!role) {
    return (
      <div className={styles.noAccess}>
        <h1>Sin acceso</h1>
        <p>
          Tu cuenta ({user.email}) no está registrada o fue desactivada. Pide acceso al equipo de
          CreateLatam.
        </p>
        <form action={signOut}>
          <button type="submit" className={styles.btnGhost}>
            Cerrar sesión
          </button>
        </form>
      </div>
    );
  }

  const meta = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string };

  return (
    <AdminShell
      sections={navFor(role)}
      user={{
        email: user.email ?? "",
        name: meta.full_name ?? meta.name ?? null,
        avatar: meta.avatar_url ?? meta.picture ?? null,
      }}
      roleLabel={roleLabels[role]}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}
