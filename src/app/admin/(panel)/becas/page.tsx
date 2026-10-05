import Link from "next/link";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import styles from "../../admin.module.css";
import { setPublished, setRank } from "./actions";

type Row = {
  id: string;
  title: string;
  institution: string;
  label: string;
  rank: number | null;
  published: boolean;
};

export default async function AdminBecasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireAdminOrThrow();

  const { data, error: loadError } = await supabase
    .from("becas")
    .select("id,title,institution,label,rank,published")
    .order("rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .overrideTypes<Row[], { merge: false }>();

  const becas = data ?? [];
  const rankeadas = becas.filter((b) => b.rank !== null).length;
  const ocultas = becas.filter((b) => !b.published).length;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Becas</h1>
          <p>
            {becas.length} en total · {rankeadas} rankeadas · {ocultas} ocultas
          </p>
        </div>
        <Link href="/admin/becas/nueva" className={styles.btn}>
          + Nueva beca
        </Link>
      </div>

      {ok && <div className={`${styles.flash} ${styles.ok}`}>{ok}</div>}
      {(error || loadError) && (
        <div className={`${styles.flash} ${styles.error}`}>
          {error ?? `No se pudieron cargar las becas: ${loadError?.message}`}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ranking</th>
              <th>Beca</th>
              <th>Visibilidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {becas.map((beca) => (
              <tr key={beca.id} className={beca.published ? undefined : styles.hiddenRow}>
                <td>
                  <form action={setRank.bind(null, beca.id)} className={styles.rankForm}>
                    <input
                      className={styles.rankInput}
                      type="number"
                      name="rank"
                      min={1}
                      step={1}
                      defaultValue={beca.rank ?? ""}
                      aria-label={`Ranking de ${beca.title}`}
                      placeholder="—"
                    />
                    <button type="submit" className={styles.btnGhost}>
                      OK
                    </button>
                  </form>
                </td>
                <td className={styles.titleCell}>
                  <strong>{beca.title}</strong>
                  <span>
                    {beca.label} · {beca.institution}
                  </span>
                </td>
                <td>
                  <form action={setPublished.bind(null, beca.id, !beca.published)}>
                    <button
                      type="submit"
                      className={`${styles.pill} ${beca.published ? styles.pillOn : styles.pillOff}`}
                      title={beca.published ? "Clic para ocultar" : "Clic para publicar"}
                    >
                      {beca.published ? "Publicada" : "Oculta"}
                    </button>
                  </form>
                </td>
                <td>
                  <Link href={`/admin/becas/${beca.id}`} className={styles.btnGhost}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
