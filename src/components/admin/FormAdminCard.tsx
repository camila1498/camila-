import Link from "next/link";
import { saveForm, setFormStatus } from "@/app/plataforma/(panel)/formularios/actions";
import { formatLima, toLimaInput } from "@/lib/forms/lima";
import type { Availability } from "@/lib/forms/status";
import styles from "@/app/plataforma/admin.module.css";

export type FormAdminRow = {
  slug: string;
  title: string;
  path: string;
  status: "draft" | "open" | "closed";
  opens_at: string | null;
  closes_at: string | null;
  capacity: number | null;
  submissions: number;
  availability: Availability;
  /** Datos que faltan para poder recibir envios (RUC, domicilio, …). */
  missing: string[];
};

const statusLabel = { draft: "Borrador", open: "Abierto", closed: "Cerrado" } as const;

function availabilityText(row: FormAdminRow) {
  if (row.availability === "open") return { text: "Recibiendo postulaciones", on: true };
  if (row.status === "open" && row.missing.length > 0) {
    return { text: `Marcado como abierto, pero no recibe envíos: faltan ${row.missing.join(", ")}`, on: false };
  }
  if (row.status === "open" && row.opens_at && Date.parse(row.opens_at) > Date.now()) {
    return { text: `Abre el ${formatLima(row.opens_at)}`, on: false };
  }
  if (row.status === "open") return { text: "Cerrado por fecha", on: false };
  if (row.status === "closed") return { text: "No recibe postulaciones", on: false };
  return { text: "Aún no publicado", on: false };
}

export default function FormAdminCard({ row }: { row: FormAdminRow }) {
  const info = availabilityText(row);

  return (
    <article className={styles.formCard}>
      <div className={styles.formCardHead}>
        <div>
          <h2>{row.title}</h2>
          <p className={info.on ? styles.liveOn : styles.liveOff}>
            <span className={styles.liveDot} aria-hidden="true" />
            {info.text}
          </p>
        </div>
        <span
          className={`${styles.pill} ${styles.pillStatic} ${row.status === "open" ? styles.pillOn : styles.pillOff}`}
        >
          {statusLabel[row.status]}
        </span>
      </div>

      <dl className={styles.formMeta}>
        <div>
          <dt>Respuestas</dt>
          <dd>{row.submissions}</dd>
        </div>
        <div>
          <dt>Apertura</dt>
          <dd>{formatLima(row.opens_at)}</dd>
        </div>
        <div>
          <dt>Cierre</dt>
          <dd>{formatLima(row.closes_at)}</dd>
        </div>
        <div>
          <dt>Cupos</dt>
          <dd>{row.capacity ?? "—"}</dd>
        </div>
      </dl>

      <div className={styles.formActions}>
        {row.status !== "open" ? (
          <form action={setFormStatus.bind(null, row.slug, "open")}>
            <button type="submit" className={styles.btn}>
              Abrir postulaciones
            </button>
          </form>
        ) : (
          <form action={setFormStatus.bind(null, row.slug, "closed")}>
            <button type="submit" className={styles.btnDanger}>
              Cerrar postulaciones
            </button>
          </form>
        )}
        <Link href={row.path} className={styles.btnGhost} target="_blank">
          Ver formulario ↗
        </Link>
      </div>

      <details className={styles.formDetails}>
        <summary>Fechas, cupos y estado</summary>
        <form action={saveForm.bind(null, row.slug)} className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor={`status-${row.slug}`}>Estado</label>
            <select id={`status-${row.slug}`} name="status" defaultValue={row.status}>
              <option value="draft">Borrador (no visible)</option>
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor={`cap-${row.slug}`}>Cupos (opcional)</label>
            <input
              id={`cap-${row.slug}`}
              name="capacity"
              type="number"
              min={1}
              step={1}
              defaultValue={row.capacity ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`opens-${row.slug}`}>Abre el (hora de Lima)</label>
            <input
              id={`opens-${row.slug}`}
              name="opens_at"
              type="datetime-local"
              defaultValue={toLimaInput(row.opens_at)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`closes-${row.slug}`}>Cierra el (hora de Lima)</label>
            <input
              id={`closes-${row.slug}`}
              name="closes_at"
              type="datetime-local"
              defaultValue={toLimaInput(row.closes_at)}
            />
          </div>
          <div className={`${styles.actions}`}>
            <button type="submit" className={styles.btn}>
              Guardar
            </button>
            <span className={styles.hint}>
              Con fechas, el formulario se abre y se cierra solo en ese rango.
            </span>
          </div>
        </form>
      </details>
    </article>
  );
}
