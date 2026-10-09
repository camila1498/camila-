import Link from "next/link";
import type { ReactNode } from "react";
import { formatLima } from "@/lib/forms/lima";
import { type AnswerSection, REVIEW_STATUSES, STATUS_LABELS } from "@/lib/forms/review";
import type { WhatsAppNumber } from "@/lib/messaging/phone";
import StatusPill from "./StatusPill";
import WhatsAppButton from "./WhatsAppButton";
import styles from "@/app/plataforma/admin.module.css";

export type ReviewEvent = {
  id: string;
  kind: "status" | "note" | "whatsapp" | "email" | "grade";
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  detail: { template?: string; to?: string; who?: string; slot?: string; b8?: number; b9?: number; offTopic?: boolean } | null;
  authorName: string;
  created_at: string;
};

export type SubmissionReviewProps = {
  campaignId: string;
  campaignName: string;
  /** Filtros de la tabla (query string) para volver y navegar sin perder el contexto. */
  qs: string;
  ok?: string;
  error?: string;
  definitionMissing: boolean;
  sub: {
    id: string;
    full_name: string;
    email: string;
    status: string;
    is_minor: boolean;
    consent_privacy_at: string;
    consent_marketing: boolean;
    created_at: string;
    notes: string | null;
  };
  person: WhatsAppNumber;
  guardian: { number: WhatsAppNumber; name: string } | null;
  sections: AnswerSection[];
  events: ReviewEvent[];
  position: { prevId?: string; nextId?: string; index: number; total: number };
  whatsapp: {
    template: string | null;
    firstName: string;
    message: string | null;
    personUrl: string | null;
    guardianUrl: string | null;
  };
  /** Panel adicional (p. ej. el puntaje del Bootcamp), arriba de la columna lateral. */
  extra?: ReactNode;
  reviewAction: (formData: FormData) => void | Promise<void>;
  notesAction: (formData: FormData) => void | Promise<void>;
};

const actionStyle: Record<string, string> = {
  admitida: "btnApprove",
  lista_espera: "btnWait",
  en_revision: "btnGhost",
  descartada: "btnDanger",
};
const actionLabel: Record<string, string> = {
  admitida: "Aprobar",
  lista_espera: "Lista de espera",
  en_revision: "Dejar pendiente",
  descartada: "Descartar",
};

export default function SubmissionReview(p: SubmissionReviewProps) {
  const { sub, person, guardian, whatsapp, position } = p;
  const withQs = () => (p.qs ? `?${p.qs}` : "");
  const base = `/plataforma/campanas/${p.campaignId}`;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>{sub.full_name}</h1>
          <p>
            <Link href={`${base}${withQs()}`}>← {p.campaignName}</Link> · recibida {formatLima(sub.created_at)}
          </p>
        </div>
        <div className={styles.pagerBtns}>
          {position.prevId ? (
            <Link href={`${base}/${position.prevId}${withQs()}`} className={styles.btnGhost}>
              ← Anterior
            </Link>
          ) : (
            <span className={`${styles.btnGhost} ${styles.btnOff}`}>← Anterior</span>
          )}
          {position.index >= 0 && (
            <span className={styles.hint}>
              {position.index + 1} de {position.total}
            </span>
          )}
          {position.nextId ? (
            <Link href={`${base}/${position.nextId}${withQs()}`} className={styles.btnGhost}>
              Siguiente →
            </Link>
          ) : (
            <span className={`${styles.btnGhost} ${styles.btnOff}`}>Siguiente →</span>
          )}
        </div>
      </div>

      {p.ok && <div className={`${styles.flash} ${styles.ok}`}>{p.ok}</div>}
      {p.error && <div className={`${styles.flash} ${styles.error}`}>{p.error}</div>}
      {p.definitionMissing && (
        <div className={`${styles.flash} ${styles.warn}`}>
          No se pudo leer la versión del formulario con que se respondió: se muestran las respuestas sin sus preguntas.
        </div>
      )}

      <div className={styles.reviewGrid}>
        <div className={styles.reviewMain}>
          <section className={styles.bCard}>
            <h2>Contacto</h2>
            <dl className={styles.answerList}>
              <div>
                <dt>Correo</dt>
                <dd>{sub.email}</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  {person.display}
                  {person.confidence === "assumed" && (
                    <span className={styles.hint}> · se le agregó el código del país: revísalo</span>
                  )}
                  {person.confidence === "invalid" && <span className={styles.hint}> · número no válido para WhatsApp</span>}
                </dd>
              </div>
              <div>
                <dt>Consentimiento</dt>
                <dd>
                  Privacidad aceptada el {formatLima(sub.consent_privacy_at)} ·{" "}
                  {sub.consent_marketing ? "acepta recibir futuras convocatorias" : "no pidió futuras convocatorias"}
                </dd>
              </div>
              {sub.is_minor && (
                <div>
                  <dt>Menor de edad</dt>
                  <dd>
                    Sí{guardian?.name ? ` · tutor/a: ${guardian.name}` : ""}
                    {guardian && ` · ${guardian.number.display}`}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {p.sections.map((section, i) => (
            <section key={i} className={styles.bCard}>
              {section.title && <h2>{section.title}</h2>}
              <dl className={styles.answerList}>
                {section.rows.map((row) => (
                  <div key={row.id} className={row.long ? styles.answerLong : undefined}>
                    <dt>
                      {row.label}
                      {row.sensitive && <span className={styles.badge}> Sensible</span>}
                    </dt>
                    <dd className={row.long ? styles.answerText : undefined}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <aside className={styles.reviewSide}>
          {p.extra}
          <section className={styles.bCard}>
            <div className={styles.reviewStatus}>
              <h2>Revisión</h2>
              <StatusPill status={sub.status} />
            </div>

            <form action={p.reviewAction} className={styles.reviewForm}>
              <input type="hidden" name="qs" value={p.qs} />
              <input type="hidden" name="next" value={position.nextId ?? ""} />
              <div className={styles.field}>
                <label htmlFor="note">Nota para el historial (opcional)</label>
                <input id="note" name="note" maxLength={500} placeholder="Ej.: cumple los criterios" />
              </div>
              <div className={styles.reviewBtns}>
                {REVIEW_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="submit"
                    name="status"
                    value={s}
                    className={styles[actionStyle[s]!]}
                    disabled={sub.status === s}
                    title={sub.status === s ? "Ya está en este estado" : undefined}
                  >
                    {actionLabel[s]}
                  </button>
                ))}
              </div>
              {position.nextId && (
                <label className={styles.flag}>
                  <input type="checkbox" name="advance" /> Pasar a la siguiente después de guardar
                </label>
              )}
            </form>
          </section>

          <section className={styles.bCard}>
            <h2>Avisar por WhatsApp</h2>
            {whatsapp.message && whatsapp.template ? (
              <>
                <p className={styles.hint}>
                  Abre WhatsApp con el mensaje de <strong>{STATUS_LABELS[sub.status]?.toLowerCase()}</strong> ya escrito. Tú lo envías desde tu WhatsApp.
                </p>
                <div className={styles.reviewBtns}>
                  {whatsapp.personUrl ? (
                    <WhatsAppButton
                      url={whatsapp.personUrl}
                      submissionId={sub.id}
                      template={whatsapp.template}
                      to={person.digits}
                      who="persona"
                      label={`Escribir a ${whatsapp.firstName}`}
                    />
                  ) : (
                    <span className={styles.hint}>No se puede abrir WhatsApp: el número no es válido.</span>
                  )}
                  {guardian &&
                    (whatsapp.guardianUrl ? (
                      <WhatsAppButton
                        url={whatsapp.guardianUrl}
                        submissionId={sub.id}
                        template={whatsapp.template}
                        to={guardian.number.digits}
                        who="tutor"
                        label="Escribir al tutor"
                      />
                    ) : (
                      <span className={styles.hint}>El número del tutor no es válido.</span>
                    ))}
                </div>
                <details className={styles.formDetails}>
                  <summary>Ver el mensaje</summary>
                  <pre className={styles.messagePreview}>{whatsapp.message}</pre>
                  <p className={styles.hint}>
                    Se edita en <Link href="/plataforma/mensajes">Mensajes</Link>.
                  </p>
                </details>
              </>
            ) : (
              <p className={styles.hint}>
                Aprueba, pon en lista de espera o descarta la postulación para tener el mensaje correspondiente listo. Los mensajes se editan en{" "}
                <Link href="/plataforma/mensajes">Mensajes</Link>.
              </p>
            )}
          </section>

          <section className={styles.bCard}>
            <h2>Notas internas</h2>
            <form action={p.notesAction} className={styles.reviewForm}>
              <input type="hidden" name="qs" value={p.qs} />
              <textarea name="notes" rows={4} maxLength={2000} defaultValue={sub.notes ?? ""} aria-label="Notas internas" />
              <button type="submit" className={styles.btnGhost}>
                Guardar notas
              </button>
            </form>
          </section>

          <section className={styles.bCard}>
            <h2>Historial</h2>
            {p.events.length === 0 ? (
              <p className={styles.hint}>Sin movimientos todavía.</p>
            ) : (
              <ul className={styles.timeline}>
                {p.events.map((e) => (
                  <li key={e.id}>
                    <strong>
                      {e.kind === "status" && `${STATUS_LABELS[e.from_status ?? ""] ?? e.from_status} → ${STATUS_LABELS[e.to_status ?? ""] ?? e.to_status}`}
                      {e.kind === "whatsapp" && `Abrió WhatsApp${e.detail?.who === "tutor" ? " (tutor)" : ""} · ${e.detail?.template ?? ""}`}
                      {e.kind === "note" && "Nota"}
                      {e.kind === "grade" && `Calificó (${e.detail?.slot === "second" ? "segunda" : "primera"} revisión): B8 ${e.detail?.b8}, B9 ${e.detail?.b9}${e.detail?.offTopic ? " · sin relación" : ""}`}
                      {e.kind === "email" && "Correo"}
                    </strong>
                    {e.note && <span>“{e.note}”</span>}
                    <span className={styles.hint}>
                      {e.authorName} · {formatLima(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
