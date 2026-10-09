import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/admin/auth";
import { checkPublishable, diffDefinitions, loadFormState } from "@/lib/forms/admin";
import { legalStatus, loadLegal } from "@/lib/forms/legal-admin";
import { formPaths } from "@/lib/forms/paths";
import { fieldsOf } from "@/lib/forms/schema";
import styles from "../../../../admin.module.css";
import { publishForm } from "../../actions";

export default async function PublicarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  if (!(slug in formPaths)) notFound();

  const { supabase } = await requireRole("admin");
  const state = await loadFormState(supabase, slug);
  if (!state) notFound();
  if (state.openCampaign) redirect("/plataforma/formularios?error=Este formulario ya está publicado.");

  const legal = legalStatus(await loadLegal(supabase));
  const check = checkPublishable(state.draft, state.latest, { legalReady: legal.ready, legalMissing: legal.message });
  const blocked = check.blockers.length > 0 || check.placeholders.length > 0;

  const draft = state.draft;
  const diff = draft ? diffDefinitions(state.latest, draft) : null;
  const questions = draft ? fieldsOf(draft).filter((f) => !f.hidden).length : 0;
  const unchanged =
    diff && !diff.firstVersion && !diff.text.length && !diff.added.length && !diff.hidden.length && !diff.shown.length && !diff.changed.length;
  const nextVersion = !state.latestVersion ? 1 : unchanged ? state.latestVersion : state.latestVersion + 1;

  const year = new Date().getFullYear();
  const defaultName = /\d{4}/.test(state.title) ? state.title : `${state.title} ${year}`;
  const previous = state.campaigns.length;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Revisa antes de publicar</h1>
          <p>
            <Link href="/plataforma/formularios">← Volver a formularios</Link> · {state.title}
          </p>
        </div>
      </div>

      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}

      <div className={`${styles.flash} ${styles.warn}`} role="alert">
        <strong>Una vez publicado no podrás editar este formulario mientras reciba postulaciones.</strong>{" "}
        Para corregir algo tendrás que cerrar la campaña, editar y volver a publicar (los cambios valdrán
        solo para la siguiente campaña).
        {previous > 0 && ` Las respuestas de las ${previous} campaña(s) anterior(es) conservan su versión.`}
      </div>

      {(check.blockers.length > 0 || check.placeholders.length > 0) && (
        <div className={`${styles.flash} ${styles.error}`}>
          <strong>No se puede publicar todavía:</strong>
          <ul className={styles.issueList}>
            {check.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
            {check.placeholders.map((p) => (
              <li key={p}>Completa el texto pendiente — {p}</li>
            ))}
          </ul>
          <p>
            <Link href={`/plataforma/formularios/${slug}/editar`}>Ir al editor →</Link>{" "}
            {!legal.ready && <Link href="/plataforma/configuracion">· Ir a Configuración →</Link>}
          </p>
        </div>
      )}

      {draft && (
        <section className={styles.summary}>
          <h2>Lo que se publicará</h2>
          <dl className={styles.formMeta}>
            <div>
              <dt>Título</dt>
              <dd>{draft.title}</dd>
            </div>
            <div>
              <dt>Preguntas visibles</dt>
              <dd>{questions}</dd>
            </div>
            <div>
              <dt>Versión</dt>
              <dd>
                v{nextVersion}
                {unchanged ? " (sin cambios)" : state.latestVersion ? " (nueva)" : ""}
              </dd>
            </div>
          </dl>
          {draft.intro && (
            <div className={styles.introPreview}>
              <p className={styles.statLabel}>Texto que leerá la persona antes de completarlo</p>
              <p>{draft.intro}</p>
            </div>
          )}
          {diff && !diff.firstVersion && !unchanged && (
            <div className={styles.diff}>
              <p className={styles.statLabel}>Cambios desde la v{state.latestVersion}</p>
              <ul>
                {diff.text.length > 0 && <li>Textos: {diff.text.join(", ")}</li>}
                {diff.added.map((x) => (
                  <li key={x}>Pregunta nueva: {x}</li>
                ))}
                {diff.changed.map((x) => (
                  <li key={x}>Modificada: {x}</li>
                ))}
                {diff.hidden.map((x) => (
                  <li key={x}>Oculta: {x}</li>
                ))}
                {diff.shown.map((x) => (
                  <li key={x}>Vuelve a mostrarse: {x}</li>
                ))}
              </ul>
            </div>
          )}
          <p className={styles.hint}>
            <Link href={`/plataforma/formularios/${slug}/editar`}>Volver al editor</Link> ·{" "}
            <Link href={formPaths[slug as keyof typeof formPaths]} target="_blank">
              Ver la página pública ↗
            </Link>
          </p>
        </section>
      )}

      <form action={publishForm.bind(null, slug)} className={`${styles.form} ${styles.publishForm}`}>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="name">Nombre de la campaña</label>
          <input id="name" name="name" required maxLength={120} defaultValue={defaultName} />
          <span className={styles.hint}>Cómo la verás en la plataforma (por ejemplo, “Bootcamp 2026”).</span>
        </div>
        <div className={styles.field}>
          <label htmlFor="opens_at">Abre el (hora de Lima, opcional)</label>
          <input id="opens_at" name="opens_at" type="datetime-local" />
        </div>
        <div className={styles.field}>
          <label htmlFor="closes_at">Cierra el (hora de Lima, opcional)</label>
          <input id="closes_at" name="closes_at" type="datetime-local" />
        </div>
        <div className={styles.field}>
          <label htmlFor="capacity">Cupos (opcional)</label>
          <input id="capacity" name="capacity" type="number" min={1} step={1} />
        </div>
        <div className={`${styles.field} ${styles.check} ${styles.full}`}>
          <input id="confirm" name="confirm" type="checkbox" required disabled={blocked} />
          <label htmlFor="confirm">
            Entiendo que, al publicar, el formulario no se podrá editar mientras reciba postulaciones.
          </label>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={blocked}>
            Publicar y abrir postulaciones
          </button>
          <Link href="/plataforma/formularios" className={styles.btnGhost}>
            Cancelar
          </Link>
          {blocked && <span className={styles.hint}>Resuelve los puntos de arriba para poder publicar.</span>}
        </div>
      </form>
    </>
  );
}
