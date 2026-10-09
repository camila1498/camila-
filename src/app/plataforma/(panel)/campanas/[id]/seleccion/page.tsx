import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import StatusPill from "@/components/admin/StatusPill";
import { requireRole } from "@/lib/admin/auth";
import { loadCampaign, loadCampaignDefinition } from "@/lib/forms/review-data";
import { buildSelection, DISCARD_LABELS, equipmentTags, PENDING_STATUSES, selectionTargets, SECOND_REVIEW_MARGIN, type Proposal } from "@/lib/selection/bootcamp";
import { ageRangeOf, loadApplicants, supportsScoring } from "@/lib/selection/load";
import styles from "../../../../admin.module.css";
import { applySelection } from "../../actions";

const PROPOSAL_LABELS: Record<Proposal, string> = {
  admitida: "Aprobar",
  lista_espera: "Lista de espera",
  descartada: "No seleccionada",
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default async function SeleccionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string; ver?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");

  const campaign = await loadCampaign(supabase, id);
  if (!campaign) notFound();
  const def = await loadCampaignDefinition(supabase, campaign);
  if (!supportsScoring(campaign.form_slug, def)) notFound();

  const applicants = await loadApplicants(supabase, id);
  const capacity = campaign.capacity;
  const result = capacity ? buildSelection(applicants, capacity, ageRangeOf(def)) : null;
  const targets = result ? selectionTargets(result) : null;
  const toApply = targets ? targets.admit.length + targets.wait.length + targets.discard.length : 0;
  const showAll = sp.ver === "todas";
  const canApply = campaign.status === "closed" && result !== null && result.ungraded === 0 && toApply > 0;

  const blockers: string[] = [];
  if (!capacity) blockers.push("La campaña no tiene cupos definidos.");
  if (campaign.status === "open") blockers.push("La campaña sigue abierta: ciérrala antes de aplicar, para que nadie que postule tarde quede fuera de la comparación.");
  if (campaign.status === "archived") blockers.push("La campaña está archivada.");
  if (result && result.ungraded > 0) blockers.push(`Faltan ${result.ungraded} postulaciones por calificar (B8 y B9).`);

  const rows = result ? (showAll ? result.rows : result.rows.slice(0, Math.max(60, capacity! + result.waitlistSize + 15))) : [];
  const base = `/plataforma/campanas/${id}`;
  let cutShown = false;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Selección por puntaje</h1>
          <p>
            <Link href={base}>← {campaign.name}</Link> · {applicants.length} postulaciones · {capacity ? `${capacity} cupos` : "sin cupos definidos"}
          </p>
        </div>
      </div>

      {sp.ok && <div className={`${styles.flash} ${styles.ok}`}>{sp.ok}</div>}
      {sp.error && <div className={`${styles.flash} ${styles.error}`}>{sp.error}</div>}

      {result && (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Cupos</p>
              <p className={styles.statValue}>{result.capacity}</p>
              <p className={styles.statHint}>+ {result.waitlistSize} en lista de espera (20 %)</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Corte</p>
              <p className={styles.statValue}>{result.cutoff === null ? "—" : fmt(result.cutoff)}</p>
              <p className={styles.statHint}>{result.cutoff === null ? "Hay menos postulaciones que cupos" : "Puntaje de la última persona aprobada"}</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Sin calificar</p>
              <p className={styles.statValue}>{result.ungraded}</p>
              <p className={styles.statHint}>Falta B8 y B9</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Segunda revisión</p>
              <p className={styles.statValue}>{result.secondReviewPending}</p>
              <p className={styles.statHint}>A {SECOND_REVIEW_MARGIN} punto del corte, sin segunda persona</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Descartes</p>
              <p className={styles.statValue}>{result.discards}</p>
              <p className={styles.statHint}>Edad, disponibilidad o sin relación</p>
            </div>
          </div>

          <section className={styles.summary}>
            <h2>Aplicar la propuesta</h2>
            <p className={styles.hint}>
              Aprueba a quienes entran en los cupos, deja en lista de espera hasta el 20 % siguiente y marca el resto y los descartes como no seleccionados. Solo cambia
              postulaciones que siguen sin resolver: lo que ya decidió una persona no se toca. Cada cambio queda en el historial.
            </p>
            {blockers.map((b) => (
              <p key={b} className={`${styles.flash} ${styles.warn}`}>
                {b}
              </p>
            ))}
            {result.secondReviewPending > 0 && (
              <p className={`${styles.flash} ${styles.warn}`}>
                {result.secondReviewPending} postulaciones están a {SECOND_REVIEW_MARGIN} punto del corte y aún no tienen segunda revisión: conviene hacerla antes de aplicar, porque puede
                cambiar quién entra.
              </p>
            )}
            {targets && (
              <p>
                Se aplicarán: <strong>{targets.admit.length}</strong> aprobadas, <strong>{targets.wait.length}</strong> en lista de espera y{" "}
                <strong>{targets.discard.length}</strong> no seleccionadas.
              </p>
            )}
            {canApply && (
              <form className={styles.formActions}>
                <ConfirmDeleteButton
                  tone="primary"
                  action={applySelection.bind(null, id)}
                  message={`Se van a cambiar ${toApply} postulaciones (${targets!.admit.length} aprobadas, ${targets!.wait.length} en lista de espera, ${targets!.discard.length} no seleccionadas).${
                    result.secondReviewPending > 0 ? ` Quedan ${result.secondReviewPending} sin segunda revisión.` : ""
                  } ¿Continuar?`}
                  label="Aplicar propuesta"
                />
              </form>
            )}
          </section>
        </>
      )}

      <div className={styles.tableWrap} style={{ marginTop: 20 }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Postulante</th>
              <th title="B5 + B7 + B10">Auto</th>
              <th>B8</th>
              <th>B9</th>
              <th>Total</th>
              <th>Propuesta</th>
              <th>Estado actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyRow}>
                  {capacity ? "Aún no hay postulaciones." : "Define los cupos de la campaña (al publicar) para ver la propuesta."}
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const eq = equipmentTags(r.applicant);
              // Línea del corte, justo después de la última persona aprobada.
              const showCut = !cutShown && r.rank !== null && result !== null && r.rank > result.capacity;
              if (showCut) cutShown = true;
              const differs = r.proposal && !PENDING_STATUSES.includes(r.applicant.status) && !(
                (r.proposal === "admitida" && ["admitida", "confirmada"].includes(r.applicant.status)) ||
                (r.proposal === "lista_espera" && r.applicant.status === "lista_espera") ||
                (r.proposal === "descartada" && ["descartada", "retirada"].includes(r.applicant.status))
              );
              return (
                <Fragment key={r.applicant.id}>
                  {showCut && (
                    <tr className={styles.cutRow}>
                      <td colSpan={8}>Corte de cupos</td>
                    </tr>
                  )}
                  <tr>
                    <td className={styles.rankCell}>{r.rank ?? "—"}</td>
                    <td className={styles.titleCell}>
                      <strong>
                        <Link href={`${base}/${r.applicant.id}`}>{r.applicant.name}</Link>
                      </strong>
                      <span>
                        {r.discard.map((d) => DISCARD_LABELS[d]).join(" · ")}
                        {r.secondReviewNeeded && (r.applicant.review.second ? " · 2.ª revisión hecha" : " · pide 2.ª revisión")}
                        {eq.needsEquipment && " · Requiere equipo"}
                        {eq.needsEquipment && eq.equipmentSolved && " (conseguido)"}
                        {eq.mobileData && " · Datos móviles"}
                      </span>
                    </td>
                    <td className={styles.numCell}>{r.auto.total}</td>
                    <td className={styles.numCell}>{r.manual ? fmt(r.manual.b8) : "—"}</td>
                    <td className={styles.numCell}>{r.manual ? fmt(r.manual.b9) : "—"}</td>
                    <td className={styles.numCell}>
                      <strong>{r.total === null ? "—" : fmt(r.total)}</strong>
                    </td>
                    <td>{r.proposal ? PROPOSAL_LABELS[r.proposal] : r.total === null && r.discard.length === 0 ? "Falta calificar" : "—"}</td>
                    <td>
                      <StatusPill status={r.applicant.status} />
                      {differs && <span className={styles.hint}> · difiere de la propuesta</span>}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {result && !showAll && result.rows.length > rows.length && (
        <p className={styles.hint} style={{ marginTop: 12 }}>
          Se muestran las primeras {rows.length} de {result.rows.length}. <Link href={`${base}/seleccion?ver=todas`}>Ver todas</Link>
        </p>
      )}
      <p className={styles.hint} style={{ marginTop: 12 }}>
        Puntos automáticos: institución pública 3 (B5), «Nunca» 2 / «Uno corto» 1 (B7) y «A la mayoría» resta 1 (B10). A mano: B8 de 0 a 3 y B9 de 0 a 2. Laptop e internet nunca descartan
        ni cambian el puntaje. Con segunda revisión, B8 y B9 son el promedio de las dos personas.
      </p>
    </>
  );
}
