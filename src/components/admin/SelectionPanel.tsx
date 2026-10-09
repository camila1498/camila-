import { type Applicant, DISCARD_LABELS, type DiscardReason, type Grade, RUBRIC_B8, RUBRIC_B9, autoScore, equipmentTags, manualScore } from "@/lib/selection/bootcamp";
import styles from "@/app/plataforma/admin.module.css";

type Props = {
  applicant: Applicant;
  discard: DiscardReason[];
  me: string;
  names: Record<string, string>;
  locked: boolean;
  qs: string;
  nextId?: string;
  gradeFirst: (formData: FormData) => void | Promise<void>;
  gradeSecond: (formData: FormData) => void | Promise<void>;
  equipmentOn: (formData: FormData) => void | Promise<void>;
  equipmentOff: (formData: FormData) => void | Promise<void>;
};

function GradeForm({
  slot,
  grade,
  action,
  qs,
  nextId,
}: {
  slot: "first" | "second";
  grade?: Grade;
  action: (formData: FormData) => void | Promise<void>;
  qs: string;
  nextId?: string;
}) {
  return (
    <form action={action} className={styles.gradeForm}>
      <input type="hidden" name="qs" value={qs} />
      <input type="hidden" name="next" value={nextId ?? ""} />
      <fieldset>
        <legend>B8 · Motivación (0 a 3)</legend>
        {RUBRIC_B8.map((label, i) => (
          <label key={i} className={styles.gradeOption}>
            <input type="radio" name="b8" value={i} defaultChecked={grade?.b8 === i} required />
            <span>
              <strong>{i}</strong> {label}
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>B9 · Problema de su comunidad (0 a 2)</legend>
        {RUBRIC_B9.map((label, i) => (
          <label key={i} className={styles.gradeOption}>
            <input type="radio" name="b9" value={i} defaultChecked={grade?.b9 === i} required />
            <span>
              <strong>{i}</strong> {label}
            </span>
          </label>
        ))}
      </fieldset>
      <label className={styles.flag}>
        <input type="checkbox" name="off_topic" defaultChecked={grade?.offTopic} /> B8 o B9 vacía o sin relación con la pregunta (se propone descartar)
      </label>
      {nextId && slot === "first" && (
        <label className={styles.flag}>
          <input type="checkbox" name="advance" defaultChecked /> Pasar a la siguiente al guardar
        </label>
      )}
      <button type="submit" className={styles.btn}>
        {grade ? "Actualizar" : "Guardar"} {slot === "first" ? "calificación" : "segunda revisión"}
      </button>
    </form>
  );
}

/** Puntaje del Bootcamp en la ficha de una postulación: puntos automáticos, calificación manual y etiquetas de equipo. */
export default function SelectionPanel(p: Props) {
  const a = p.applicant;
  const auto = autoScore(a);
  const manual = manualScore(a.review);
  const total = manual ? auto.total + manual.b8 + manual.b9 : null;
  const eq = equipmentTags(a);
  const { first, second } = a.review;
  const name = (uid?: string) => (uid ? (p.names[uid] ?? "Alguien del equipo") : "");
  const imFirst = first?.by === p.me;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  return (
    <section className={styles.bCard}>
      <h2>Puntaje del Bootcamp</h2>

      {p.discard.length > 0 && (
        <div className={`${styles.flash} ${styles.warn}`}>
          <strong>Se propone descartar:</strong> {p.discard.map((d) => DISCARD_LABELS[d]).join(" · ")}.
        </div>
      )}

      <p className={styles.scoreTotal}>
        {total === null ? "—" : fmt(total)} <span>/ 10</span>
      </p>
      <p className={styles.hint}>{total === null ? "Falta la calificación manual de B8 y B9." : manual?.reviews === 2 ? "Con promedio de dos revisiones." : "Una revisión."}</p>

      <dl className={styles.answerList}>
        <div>
          <dt>Institución (B5)</dt>
          <dd>{auto.B5} · {a.B5 ?? "—"}</dd>
        </div>
        <div>
          <dt>Cursos previos (B7)</dt>
          <dd>{auto.B7} · {a.B7 ?? "—"}</dd>
        </div>
        <div>
          <dt>Disponibilidad (B10)</dt>
          <dd>{auto.B10 === 0 ? "0" : auto.B10} · {a.B10 ?? "—"}</dd>
        </div>
        <div>
          <dt>Motivación (B8)</dt>
          <dd>{manual ? fmt(manual.b8) : "—"}</dd>
        </div>
        <div>
          <dt>Problema (B9)</dt>
          <dd>{manual ? fmt(manual.b9) : "—"}</dd>
        </div>
      </dl>

      {(eq.needsEquipment || eq.mobileData) && (
        <div className={styles.tagRow}>
          {eq.needsEquipment && <span className={styles.badge}>Requiere equipo</span>}
          {eq.mobileData && <span className={styles.badge}>Solo datos móviles</span>}
          {eq.needsEquipment && eq.equipmentSolved && <span className={`${styles.badge} ${styles.badgeOk}`}>Equipo conseguido</span>}
        </div>
      )}
      {eq.needsEquipment && (
        <p className={styles.hint}>
          No cambia el puntaje. Si queda admitida, se confirma solo si se le consigue equipo o datos (aliados, préstamo, sede presencial); si no, pasa la siguiente de la
          lista y ella queda primera para la próxima edición.
        </p>
      )}
      {eq.mobileData && <p className={styles.hint}>Avísale que las sesiones en vivo consumen datos y ofrécele las grabaciones.</p>}
      {eq.needsEquipment && !p.locked && (
        <form action={eq.equipmentSolved ? p.equipmentOff : p.equipmentOn} className={styles.formActions}>
          <input type="hidden" name="qs" value={p.qs} />
          <button type="submit" className={styles.btnGhost}>
            {eq.equipmentSolved ? "Quitar «equipo conseguido»" : "Marcar equipo conseguido"}
          </button>
        </form>
      )}

      {p.locked ? (
        <p className={styles.hint}>La campaña está archivada: las calificaciones ya no se cambian.</p>
      ) : (
        <>
          <h3 className={styles.gradeTitle}>
            Primera revisión {first && <span>· {name(first.by)}</span>}
          </h3>
          <GradeForm slot="first" grade={first} action={p.gradeFirst} qs={p.qs} nextId={p.nextId} />

          <h3 className={styles.gradeTitle}>
            Segunda revisión {second && <span>· {name(second.by)}</span>}
          </h3>
          {!first ? (
            <p className={styles.hint}>Disponible cuando exista la primera calificación.</p>
          ) : imFirst ? (
            <p className={styles.hint}>La segunda revisión la hace otra persona del equipo. Se usa en postulaciones a 1 punto del corte: B8 y B9 final son el promedio de las dos.</p>
          ) : (
            <GradeForm slot="second" grade={second} action={p.gradeSecond} qs={p.qs} />
          )}
        </>
      )}
    </section>
  );
}
