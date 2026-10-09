import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import CampaignFigures from "@/components/stats/CampaignFigures";
import { requireRole } from "@/lib/admin/auth";
import { formatLima } from "@/lib/forms/lima";
import { STATUS_LABELS } from "@/lib/forms/review";
import { loadCampaign, loadStatusCounts } from "@/lib/forms/review-data";
import { loadCampaignStats } from "@/lib/stats/load";
import { METRICS, MIN_FOR_BREAKDOWNS } from "@/lib/stats/types";
import styles from "../../../../admin.module.css";
import { closeCampaignAndCount, publishStats, refreshStats, saveStatsSelection } from "../../actions";

export default async function CierrePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");

  const campaign = await loadCampaign(supabase, id);
  if (!campaign) notFound();
  const isOpen = campaign.status === "open";
  const [stats, counts] = await Promise.all([isOpen ? null : loadCampaignStats(supabase, id), loadStatusCounts(supabase, id)]);

  const snap = stats?.snapshot;
  const selection = stats?.public_selection;
  const breakdownFields = (snap?.fields ?? []).filter((f) => f.type !== "number");
  const enoughForBreakdowns = (snap?.received ?? 0) >= MIN_FOR_BREAKDOWNS;
  const metricDisabled: Record<string, string | null> = {
    capacity: snap?.capacity ? null : "Esta campaña no tiene cupos definidos.",
    per_spot: snap?.capacity ? null : "Esta campaña no tiene cupos definidos.",
    countries: snap?.fields.some((f) => f.id === "C4") ? null : "No hay pregunta de país (C4).",
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Cierre y cifras</h1>
          <p>
            <Link href={`/plataforma/campanas/${id}`}>← {campaign.name}</Link> · {campaign.form_title} ·{" "}
            {isOpen ? "recibiendo postulaciones" : `cerrada ${formatLima(campaign.closed_at)}`}
          </p>
        </div>
      </div>

      {sp.ok && <div className={`${styles.flash} ${styles.ok}`}>{sp.ok}</div>}
      {sp.error && <div className={`${styles.flash} ${styles.error}`}>{sp.error}</div>}

      {isOpen && (
        <section className={styles.summary}>
          <h2>1. Cerrar la campaña</h2>
          <p>
            Hay <strong>{counts.total}</strong> postulaciones{campaign.capacity ? ` para ${campaign.capacity} cupos` : ""}. Al cerrar, el formulario deja de recibir
            respuestas y se calculan las cifras. Las postulaciones se pueden seguir revisando después, y las cifras se pueden recalcular.
          </p>
          <form className={styles.formActions}>
            <ConfirmDeleteButton
              action={closeCampaignAndCount.bind(null, id)}
              message={`¿Cerrar "${campaign.name}"? Dejará de recibir postulaciones. Para recibir más habrá que abrir una campaña nueva.`}
              label="Cerrar campaña"
            />
          </form>
        </section>
      )}

      {!isOpen && snap && (
        <>
          <section className={styles.summary}>
            <h2>1. Cifras de la campaña</h2>
            <p className={styles.hint}>
              Calculadas {formatLima(stats.generated_at)}. Son solo conteos: no incluyen nombres, correos ni respuestas de texto.
            </p>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <p className={styles.statLabel}>Recibidas</p>
                <p className={styles.statValue}>{snap.received}</p>
                <p className={styles.statHint}>
                  {snap.capacity ? `${snap.capacity} cupos · ${(snap.received / snap.capacity).toFixed(1)} por cupo` : "Sin cupos definidos"}
                </p>
              </div>
              {Object.entries(snap.byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, n]) => (
                  <div className={styles.stat} key={status}>
                    <p className={styles.statLabel}>{STATUS_LABELS[status] ?? status}</p>
                    <p className={styles.statValue}>{n}</p>
                    <p className={styles.statHint}>{Math.round((n / (snap.received || 1)) * 100)}%</p>
                  </div>
                ))}
              <div className={styles.stat}>
                <p className={styles.statLabel}>Menores de edad</p>
                <p className={styles.statValue}>{snap.minors}</p>
                <p className={styles.statHint}>No se publican desgloses que los identifiquen</p>
              </div>
            </div>

            <details className={styles.formDetails}>
              <summary>Desgloses por pregunta ({snap.fields.length})</summary>
              <div className={styles.bars}>
                {snap.fields.map((f) =>
                  f.type === "number" ? (
                    <div key={f.id} className={styles.barGroup}>
                      <h3>
                        {f.label} <span>({f.id})</span>
                      </h3>
                      <p className={styles.hint}>
                        {f.summary ? `Mín. ${f.summary.min} · máx. ${f.summary.max} · promedio ${f.summary.avg} (${f.summary.n} respuestas)` : "Sin respuestas"}
                      </p>
                    </div>
                  ) : (
                    <div key={f.id} className={styles.barGroup}>
                      <h3>
                        {f.label} <span>({f.id}) · {f.answered} respuestas</span>
                      </h3>
                      <ul>
                        {f.items.map((i) => (
                          <li key={i.value}>
                            <span>{i.label}</span>
                            <span className={styles.barTrack}>
                              <span style={{ width: `${Math.round((i.count / (f.answered || 1)) * 100)}%` }} />
                            </span>
                            <span>{i.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </details>

            <form action={refreshStats.bind(null, id)} className={styles.formActions}>
              <button type="submit" className={styles.btnGhost}>
                Recalcular cifras
              </button>
              <span className={styles.hint}>Úsalo si seguiste revisando postulaciones después de cerrar.</span>
            </form>
          </section>

          <section className={styles.summary}>
            <h2>2. Qué mostrar en la web</h2>
            <p className={styles.hint}>
              Elige las cifras públicas. Los grupos con menos de 5 personas se juntan en «Otros» o se omiten, y solo se pueden mostrar
              preguntas de opciones que no sean sensibles. Guardar arma una vista previa; no se publica hasta el paso 3.
            </p>
            <form action={saveStatsSelection.bind(null, id)} className={styles.statsPick}>
              <fieldset>
                <legend>Totales</legend>
                <div className={styles.choiceList}>
                  {METRICS.map((m) => (
                    <label key={m.key} className={styles.flag} title={metricDisabled[m.key] ?? undefined}>
                      <input
                        type="checkbox"
                        name="metric"
                        value={m.key}
                        defaultChecked={selection?.metrics.includes(m.key)}
                        disabled={Boolean(metricDisabled[m.key])}
                      />{" "}
                      {m.label} <span className={styles.hint}>— {metricDisabled[m.key] ?? m.example}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Desgloses (porcentajes)</legend>
                {!enoughForBreakdowns && (
                  <p className={styles.hint}>
                    Con menos de {MIN_FOR_BREAKDOWNS} postulaciones solo se pueden publicar los totales: los desgloses podrían identificar a alguien.
                  </p>
                )}
                <div className={styles.choiceList}>
                  {breakdownFields.length === 0 && <p className={styles.hint}>Esta campaña no tiene preguntas de opciones.</p>}
                  {breakdownFields.map((f) => (
                    <label key={f.id} className={styles.flag}>
                      <input type="checkbox" name="field" value={f.id} defaultChecked={selection?.fields.includes(f.id)} disabled={!enoughForBreakdowns} /> {f.label}{" "}
                      <span className={styles.hint}>({f.id})</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btn}>
                  Guardar y ver vista previa
                </button>
              </div>
            </form>
          </section>

          <section className={styles.summary}>
            <h2>3. Vista previa y publicación</h2>
            {stats.public_data ? (
              <>
                <p className={styles.hint}>
                  {stats.published
                    ? `Publicada en la web el ${formatLima(stats.published_at)}.`
                    : "Aún no es pública. Así se verá en el inicio de la web cuando la publiques:"}
                </p>
                <div className={styles.previewFrame}>
                  <h3>{campaign.name}</h3>
                  <CampaignFigures data={stats.public_data} />
                </div>
                <form action={publishStats.bind(null, id, !stats.published)} className={styles.formActions}>
                  <button type="submit" className={stats.published ? styles.btnGhost : styles.btn}>
                    {stats.published ? "Retirar de la web" : "Publicar en la web"}
                  </button>
                </form>
              </>
            ) : (
              <p className={styles.hint}>Guarda primero qué cifras mostrar (paso 2).</p>
            )}
          </section>
        </>
      )}

      <section className={styles.summary}>
        <h2>{isOpen ? "2" : "4"}. Exportar los datos</h2>
        <p className={styles.hint}>
          Un archivo CSV (se abre con Excel) con las columnas de la versión {campaign.version} del formulario. Cada descarga queda registrada con tu nombre. Conviene
          exportar antes de eliminar datos al terminar la campaña.
        </p>
        <div className={styles.exportGrid}>
          <div>
            <h3>Completo</h3>
            <p className={styles.hint}>
              Con nombre, correo, teléfono, datos del tutor y datos sensibles. Contiene datos personales: guárdalo en un lugar seguro y no lo compartas por chat.
            </p>
            <a className={styles.btn} href={`/plataforma/campanas/${id}/exportar?modo=completo`}>
              Descargar completo
            </a>
          </div>
          <div>
            <h3>Anonimizado</h3>
            <p className={styles.hint}>
              Sin nombre, correo, teléfonos, respuestas de texto ni datos sensibles; solo el mes de recepción. Sirve para analizar y comparar campañas.
            </p>
            <a className={styles.btnGhost} href={`/plataforma/campanas/${id}/exportar?modo=anonimo`}>
              Descargar anonimizado
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
