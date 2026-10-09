import Link from "next/link";
import { closeCampaign, deleteForm } from "@/app/plataforma/(panel)/formularios/actions";
import { formatLima } from "@/lib/forms/lima";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import styles from "@/app/plataforma/admin.module.css";

export type CampaignSummary = {
  id: string;
  name: string;
  version: number;
  status: "open" | "closed" | "archived";
  opens_at: string | null;
  closes_at: string | null;
  capacity: number | null;
  closed_at: string | null;
  submissions: number;
};

export type FormAdminRow = {
  slug: string;
  title: string;
  path: string;
  /** Borrador = sin campaña abierta. */
  open: CampaignSummary | null;
  /** Campañas anteriores, de la mas reciente a la mas antigua. */
  past: CampaignSummary[];
  latestVersion: number | null;
  draftUpdatedAt: string | null;
  draftInvalid: boolean;
  /** Nunca se publico: se puede eliminar. */
  deletable: boolean;
};

function liveText(open: CampaignSummary) {
  const now = Date.now();
  if (open.opens_at && now < Date.parse(open.opens_at)) {
    return { text: `Publicado: abre el ${formatLima(open.opens_at)}`, on: false };
  }
  if (open.closes_at && now > Date.parse(open.closes_at)) {
    return { text: "Publicado: la fecha de cierre ya pasó (ciérralo para poder editarlo)", on: false };
  }
  return { text: "Recibiendo postulaciones", on: true };
}

export default function FormAdminCard({ row }: { row: FormAdminRow }) {
  const open = row.open;
  const live = open ? liveText(open) : null;

  return (
    <article className={styles.formCard}>
      <div className={styles.formCardHead}>
        <div>
          <h2>{row.title}</h2>
          <p className={live?.on ? styles.liveOn : styles.liveOff}>
            <span className={styles.liveDot} aria-hidden="true" />
            {live
              ? live.text
              : row.past.length > 0
                ? "Sin campaña abierta · editable"
                : "Aún no publicado · editable"}
          </p>
        </div>
        <span className={`${styles.pill} ${styles.pillStatic} ${open ? styles.pillOn : styles.pillOff}`}>
          {open ? "Publicado" : "Borrador"}
        </span>
      </div>

      {open ? (
        <dl className={styles.formMeta}>
          <div>
            <dt>Campaña</dt>
            <dd>{open.name}</dd>
          </div>
          <div>
            <dt>Respuestas</dt>
            <dd>{open.submissions}</dd>
          </div>
          <div>
            <dt>Apertura</dt>
            <dd>{formatLima(open.opens_at)}</dd>
          </div>
          <div>
            <dt>Cierre</dt>
            <dd>{formatLima(open.closes_at)}</dd>
          </div>
          <div>
            <dt>Cupos</dt>
            <dd>{open.capacity ?? "—"}</dd>
          </div>
        </dl>
      ) : (
        <dl className={styles.formMeta}>
          <div>
            <dt>Última versión publicada</dt>
            <dd>{row.latestVersion ? `v${row.latestVersion}` : "—"}</dd>
          </div>
          <div>
            <dt>Borrador editado</dt>
            <dd>{formatLima(row.draftUpdatedAt)}</dd>
          </div>
          <div>
            <dt>Campañas anteriores</dt>
            <dd>{row.past.length}</dd>
          </div>
        </dl>
      )}

      {row.draftInvalid && (
        <p className={styles.liveOff} role="alert">
          El borrador está dañado y no se puede publicar. Ábrelo en el editor para corregirlo.
        </p>
      )}

      <div className={styles.formActions}>
        {open ? (
          <>
            <ConfirmDeleteButton
              action={closeCampaign.bind(null, row.slug, open.id)}
              label="Cerrar campaña"
              message={`¿Cerrar "${open.name}"? Dejará de recibir postulaciones (${open.submissions} recibidas). El formulario se podrá editar de nuevo.`}
            />
            <span className={styles.hint}>Publicado: no se puede editar mientras reciba postulaciones.</span>
          </>
        ) : (
          <>
            <Link href={`/plataforma/formularios/${row.slug}/editar`} className={styles.btnGhost}>
              Editar formulario
            </Link>
            <Link href={`/plataforma/formularios/${row.slug}/publicar`} className={styles.btn}>
              Publicar…
            </Link>
          </>
        )}
        <Link href={row.path} className={styles.btnGhost} target="_blank">
          Ver formulario ↗
        </Link>
        {row.deletable && !open && (
          <ConfirmDeleteButton
            action={deleteForm.bind(null, row.slug)}
            label="Eliminar"
            message={`¿Eliminar el formulario "${row.title}"? Nunca se publicó, así que no tiene respuestas. Esta acción no se puede deshacer.`}
          />
        )}
      </div>
      <p className={styles.hint}>
        Enlace público: <code>{row.path}</code>
      </p>

      {row.past.length > 0 && (
        <details className={styles.formDetails}>
          <summary>Campañas anteriores ({row.past.length})</summary>
          <ul className={styles.pastList}>
            {row.past.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> · v{c.version} · {c.submissions} respuestas
                {c.capacity ? ` · ${c.capacity} cupos` : ""} · cerrada {formatLima(c.closed_at)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
