import Link from "next/link";
import { requireMember } from "@/lib/admin/auth";
import styles from "../admin.module.css";

export default async function DashboardPage() {
  const { supabase, role, user } = await requireMember();
  const name = (user.user_metadata as { full_name?: string }).full_name?.split(" ")[0];

  if (role !== "admin") {
    return (
      <div className={styles.head}>
        <div>
          <h1>Hola{name ? `, ${name}` : ""}</h1>
          <p>Aquí aparecerán tus herramientas a medida que se habiliten para tu rol.</p>
        </div>
      </div>
    );
  }

  const head = { count: "exact", head: true } as const;
  const [publicadas, ocultas, rankeadas, miembros] = (
    await Promise.all([
      supabase.from("becas").select("id", head).eq("published", true),
      supabase.from("becas").select("id", head).eq("published", false),
      supabase.from("becas").select("id", head).eq("published", true).not("rank", "is", null),
      supabase.from("members").select("id", head).eq("active", true),
    ])
  ).map((result) => result.count ?? 0) as [number, number, number, number];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Hola{name ? `, ${name}` : ""}</h1>
          <p>Resumen de la plataforma.</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Becas publicadas</p>
          <p className={styles.statValue}>{publicadas}</p>
          <p className={styles.statHint}>{ocultas} ocultas</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Becas rankeadas</p>
          <p className={styles.statValue}>{rankeadas}</p>
          <p className={styles.statHint}>En la pestaña Rankeadas</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Miembros activos</p>
          <p className={styles.statValue}>{miembros}</p>
          <p className={styles.statHint}>Con acceso a la plataforma</p>
        </div>
        <div className={`${styles.stat} ${styles.statSoon}`}>
          <p className={styles.statLabel}>Inscritos en bootcamps</p>
          <p className={styles.statValue}>—</p>
          <p className={styles.statHint}>Próximamente</p>
        </div>
        <div className={`${styles.stat} ${styles.statSoon}`}>
          <p className={styles.statLabel}>Visitantes</p>
          <p className={styles.statValue}>—</p>
          <p className={styles.statHint}>Próximamente</p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Accesos rápidos</h2>
      <div className={styles.quick}>
        <Link href="/plataforma/becas/nueva" className={styles.btn}>
          + Nueva beca
        </Link>
        <Link href="/plataforma/becas" className={styles.btnGhost}>
          Administrar becas
        </Link>
        <Link href="/plataforma/miembros" className={styles.btnGhost}>
          Miembros
        </Link>
      </div>
    </>
  );
}
