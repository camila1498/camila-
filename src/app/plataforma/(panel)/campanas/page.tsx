import Link from "next/link";
import { requireRole } from "@/lib/admin/auth";
import { formatLima } from "@/lib/forms/lima";
import { loadCampaigns, loadStatusCounts } from "@/lib/forms/review-data";
import styles from "../../admin.module.css";

export default async function CampanasPage() {
  const { supabase } = await requireRole("admin");
  const campaigns = await loadCampaigns(supabase);
  const counts = await Promise.all(campaigns.map((c) => loadStatusCounts(supabase, c.id)));

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Respuestas</h1>
          <p>Postulaciones recibidas, por campaña. Abre una para revisarlas.</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className={styles.stat}>
          <p className={styles.statLabel}>Todavía no hay campañas</p>
          <p className={styles.statHint}>
            Cuando publiques un formulario en <Link href="/plataforma/formularios">Formularios</Link> aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className={styles.formList}>
          {campaigns.map((c, i) => {
            const n = counts[i]!;
            return (
              <article key={c.id} className={styles.formCard}>
                <div className={styles.formCardHead}>
                  <div>
                    <h2>{c.name}</h2>
                    <p className={styles.liveOff}>
                      {c.form_title} · versión {c.version} · {c.status === "open" ? "recibiendo postulaciones" : `cerrada ${formatLima(c.closed_at)}`}
                    </p>
                  </div>
                  <span className={`${styles.pill} ${styles.pillStatic} ${c.status === "open" ? styles.pillOn : styles.pillOff}`}>
                    {c.status === "open" ? "Abierta" : "Cerrada"}
                  </span>
                </div>
                <dl className={styles.formMeta}>
                  <div>
                    <dt>Recibidas</dt>
                    <dd>{n.total}</dd>
                  </div>
                  <div>
                    <dt>Sin revisar</dt>
                    <dd>{(n.nueva ?? 0) + (n.en_revision ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Aprobadas</dt>
                    <dd>
                      {n.admitida ?? 0}
                      {c.capacity ? ` / ${c.capacity} cupos` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Lista de espera</dt>
                    <dd>{n.lista_espera ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Descartadas</dt>
                    <dd>{n.descartada ?? 0}</dd>
                  </div>
                </dl>
                <div className={styles.formActions}>
                  <Link href={`/plataforma/campanas/${c.id}`} className={styles.btn}>
                    Ver respuestas
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
