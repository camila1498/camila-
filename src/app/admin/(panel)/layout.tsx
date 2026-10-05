import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { signOut } from "./becas/actions";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Admin — CreateLatam",
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await requireAdmin();

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <div className={styles.brand}>
          <Link href="/admin/becas">CreateLatam · Admin</Link>
        </div>
        <div className={styles.user}>
          <span>{user.email}</span>
          <Link href="/oportunidades" className={styles.btnGhost}>
            Ver sitio
          </Link>
          <form action={signOut}>
            <button type="submit" className={styles.btnGhost}>
              Salir
            </button>
          </form>
        </div>
      </header>
      {isAdmin ? (
        <main className={styles.main}>{children}</main>
      ) : (
        <div className={styles.noAccess}>
          <h1>Sin acceso</h1>
          <p>
            Tu cuenta ({user.email}) no tiene permisos de administrador. Pídele a quien administra
            el proyecto que te agregue.
          </p>
        </div>
      )}
    </div>
  );
}
