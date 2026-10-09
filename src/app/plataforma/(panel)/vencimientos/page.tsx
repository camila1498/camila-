import Link from "next/link";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { requireRole } from "@/lib/admin/auth";
import { formatLima } from "@/lib/forms/lima";
import { loadRetention, loadRetentionLog, loadRetentionRules } from "@/lib/retention/load";
import { DEFAULT_RULES, isDue, type RetentionGroup } from "@/lib/retention/types";
import styles from "../../admin.module.css";
import { purgeExpired, saveRetentionRules } from "./actions";

const dateFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", dateStyle: "medium" });
const day = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");

type Row = { label: string; hint: string; group: RetentionGroup; due: string | null; action: string };

export default async function VencimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireRole("admin");
  const [campaigns, rules, log] = await Promise.all([loadRetention(supabase), loadRetentionRules(supabase), loadRetentionLog(supabase)]);
  const slugs = [...new Set(campaigns.map((c) => c.formSlug))];
  const now = Date.now();

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Vencimientos</h1>
          <p>
            Cuánto tiempo se conservan los datos personales de cada campaña cerrada y qué pasa cuando vence el plazo. Las cifras agregadas no se tocan.
          </p>
        </div>
      </div>

      {ok && <div className={`${styles.flash} ${styles.ok}`}>{ok}</div>}
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}

      {campaigns.length === 0 ? (
        <div className={styles.stat}>
          <p className={styles.statLabel}>Todavía no hay campañas cerradas</p>
          <p className={styles.statHint}>
            Cuando cierres una desde <Link href="/plataforma/campanas">Respuestas</Link> aparecerá aquí con sus fechas.
          </p>
        </div>
      ) : (
        <div className={styles.formList}>
          {campaigns.map((c) => {
            const rows: Row[] = [
              {
                label: "No seleccionadas",
                hint: "Incluye sin revisar, descartadas y retiradas",
                group: c.notSelected,
                due: c.notSelected.dueAt ?? null,
                action: "Se eliminan",
              },
              { label: "Lista de espera", hint: "", group: c.waitlist, due: c.waitlist.dueAt ?? null, action: "Se eliminan" },
              {
                label: "Participantes",
                hint: "Aprobadas y confirmadas",
                group: c.participants,
                due: c.participants.dueOn ?? null,
                action: "Se anonimizan",
              },
            ];
            const expiredCount = rows.reduce((sum, r) => sum + (isDue(r.due, now) ? r.group.count : 0), 0);
            const hasPurged = c.purged.deleted + c.purged.anonymized > 0;

            return (
              <article key={c.id} className={styles.formCard}>
                <div className={styles.formCardHead}>
                  <div>
                    <h2>{c.name}</h2>
                    <p className={styles.liveOff}>
                      Cerrada {day(c.closedAt)} ·{" "}
                      {c.status === "archived" ? `archivada (programa terminó el ${day(c.programEndedOn)})` : "sin archivar"}
                    </p>
                  </div>
                  <span className={`${styles.pill} ${styles.pillStatic} ${c.status === "archived" ? styles.pillOn : styles.pillOff}`}>
                    {c.status === "archived" ? "Archivada" : "Cerrada"}
                  </span>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Grupo</th>
                        <th>Personas</th>
                        <th>Plazo</th>
                        <th>Vence</th>
                        <th>Al vencer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const months = r.label === "Participantes" ? c.rules.participants : r.label === "Lista de espera" ? c.rules.waitlist : c.rules.notSelected;
                        const due = isDue(r.due, now);
                        return (
                          <tr key={r.label}>
                            <td className={styles.titleCell}>
                              <strong>{r.label}</strong>
                              {r.hint && <span>{r.hint}</span>}
                            </td>
                            <td>{r.group.count}</td>
                            <td>{months} meses</td>
                            <td>
                              {r.due ? (
                                <span className={due && r.group.count > 0 ? styles.dueNow : undefined}>
                                  {day(r.due)}
                                  {due && r.group.count > 0 ? " · vencido" : ""}
                                </span>
                              ) : (
                                <span className={styles.hint}>Al archivar la campaña</span>
                              )}
                            </td>
                            <td>{r.action}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className={styles.hint}>
                  {c.exportedAt ? `Exportación completa: ${formatLima(c.exportedAt)}.` : "Aún no se descargó la exportación completa de esta campaña."}
                  {hasPurged && ` Ya se eliminaron ${c.purged.deleted} y se anonimizaron ${c.purged.anonymized}.`}
                </p>

                <div className={styles.formActions}>
                  <Link href={`/plataforma/campanas/${c.id}/cierre`} className={styles.btnGhost}>
                    {c.status === "archived" ? "Exportar o corregir fecha" : "Exportar y archivar"}
                  </Link>
                  {expiredCount > 0 && c.exportedAt && (
                    <form>
                      <ConfirmDeleteButton
                        action={purgeExpired.bind(null, c.id)}
                        message={`Se van a eliminar o anonimizar ${expiredCount} postulaciones vencidas de "${c.name}". No se puede deshacer. ¿Continuar?`}
                        label={`Eliminar o anonimizar ${expiredCount} vencidas`}
                      />
                    </form>
                  )}
                  {expiredCount > 0 && !c.exportedAt && (
                    <span className={styles.hint}>Hay {expiredCount} vencidas: primero descarga la exportación completa.</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {slugs.length > 0 && (
        <section className={styles.summary} style={{ marginTop: 24 }}>
          <h2>Plazos por formulario</h2>
          <p className={styles.hint}>
            Deben coincidir con lo que dice el aviso de privacidad de cada formulario («Cuánto tiempo»). Los no seleccionados y la lista de espera cuentan desde el
            cierre de la campaña; los participantes, desde que termina el programa (fecha que se registra al archivar).
          </p>
          {slugs.map((slug) => {
            const r = rules.find((x) => x.form_slug === slug);
            return (
              <form key={slug} action={saveRetentionRules.bind(null, slug)} className={styles.rulesRow}>
                <strong>{slug}</strong>
                <label>
                  No seleccionadas
                  <input type="number" name="not_selected" min={1} max={120} defaultValue={r?.not_selected_months ?? DEFAULT_RULES.not_selected_months} required />
                </label>
                <label>
                  Lista de espera
                  <input type="number" name="waitlist" min={1} max={120} defaultValue={r?.waitlist_months ?? DEFAULT_RULES.waitlist_months} required />
                </label>
                <label>
                  Participantes
                  <input type="number" name="participants" min={1} max={120} defaultValue={r?.participant_months ?? DEFAULT_RULES.participant_months} required />
                </label>
                <button type="submit" className={styles.btnGhost}>
                  Guardar
                </button>
              </form>
            );
          })}
        </section>
      )}

      {log.length > 0 && (
        <section className={styles.summary} style={{ marginTop: 24 }}>
          <h2>Registro</h2>
          <ul className={styles.pastList}>
            {log.map((l) => (
              <li key={l.id}>
                {formatLima(l.created_at)} · {l.campaign_name}: {l.deleted} eliminadas, {l.anonymized} anonimizadas
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
