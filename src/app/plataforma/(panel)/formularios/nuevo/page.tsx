import Link from "next/link";
import NewFormFields from "@/components/admin/NewFormFields";
import { requireRole } from "@/lib/admin/auth";
import styles from "../../../admin.module.css";
import { createForm } from "../actions";

export default async function NuevoFormularioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireRole("admin");

  const { data } = await supabase
    .from("forms")
    .select("slug,title")
    .order("created_at", { ascending: true })
    .overrideTypes<{ slug: string; title: string }[], { merge: false }>();

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Nuevo formulario</h1>
          <p>
            <Link href="/plataforma/formularios">← Volver a formularios</Link>
          </p>
        </div>
      </div>

      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}

      <form action={createForm} className={styles.form}>
        <NewFormFields sources={data ?? []} />
        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            Crear y abrir el editor
          </button>
          <Link href="/plataforma/formularios" className={styles.btnGhost}>
            Cancelar
          </Link>
          <span className={styles.hint}>Se crea como borrador: no es público hasta que lo publiques.</span>
        </div>
      </form>
    </>
  );
}
