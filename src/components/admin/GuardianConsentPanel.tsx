import { CONSENT_STATUS_LABELS, type ConsentRecord, type ConsentStatus, RELATIONSHIP_LABELS } from "@/lib/consent/consent";
import { formatLima } from "@/lib/forms/lima";
import styles from "@/app/plataforma/admin.module.css";
import WhatsAppButton from "./WhatsAppButton";

type Props = {
  submissionId: string;
  status: ConsentStatus;
  record: ConsentRecord | null;
  /** Enlace completo para el tutor (solo mientras está pendiente). */
  link: string | null;
  whatsapp: { url: string | null; to: string | null; guardianName: string } | null;
  locked: boolean;
  qs: string;
  requestAction: (formData: FormData) => void | Promise<void>;
  resetAction: (formData: FormData) => void | Promise<void>;
  revokeAction: (formData: FormData) => void | Promise<void>;
};

const tone: Record<ConsentStatus, string> = {
  none: "stPendiente",
  pending: "stPendiente",
  expired: "stDescartada",
  authorized: "stAprobada",
  declined: "stDescartada",
  revoked: "stDescartada",
};

/** Consentimiento de madre, padre o tutor de una postulante menor: estado, enlace y aviso por WhatsApp. */
export default function GuardianConsentPanel(p: Props) {
  const r = p.record;
  return (
    <section className={styles.bCard}>
      <div className={styles.reviewStatus}>
        <h2>Consentimiento del tutor</h2>
        <span className={`${styles.statusPill} ${styles[tone[p.status]]}`}>{CONSENT_STATUS_LABELS[p.status]}</span>
      </div>

      {p.status === "none" && (
        <p className={styles.hint}>
          Es menor de edad: antes de confirmar su vacante, su madre, padre o tutor debe autorizarlo desde un enlace personal. Genera el enlace cuando la apruebes.
        </p>
      )}

      {(p.status === "authorized" || p.status === "declined" || p.status === "revoked") && r && (
        <dl className={styles.answerList}>
          <div>
            <dt>Respondió</dt>
            <dd>
              {r.guardian_name} ({r.relationship ? RELATIONSHIP_LABELS[r.relationship].toLowerCase() : "—"}) · {formatLima(r.responded_at)}
            </dd>
          </div>
          <div>
            <dt>Participación</dt>
            <dd>{r.data_consent ? "Autorizada" : "No autorizada"}</dd>
          </div>
          {r.data_consent && (
            <div>
              <dt>Uso de imagen</dt>
              <dd>{r.image_consent && !r.revoked_at ? "Autorizado" : "No autorizado"}</dd>
            </div>
          )}
          {r.revoked_at && (
            <div>
              <dt>Revocado</dt>
              <dd>{formatLima(r.revoked_at)}</dd>
            </div>
          )}
        </dl>
      )}

      {(p.status === "pending" || p.status === "expired") && r && (
        <>
          <p className={styles.hint}>
            {p.status === "pending"
              ? `Esperando respuesta. El enlace vence el ${formatLima(r.expires_at)}.`
              : "El enlace venció: renuévalo para obtener uno nuevo."}
          </p>
          {p.link && p.status === "pending" && (
            <div className={styles.field}>
              <label htmlFor="consent-link">Enlace para el tutor</label>
              <input id="consent-link" readOnly value={p.link} />
            </div>
          )}
        </>
      )}

      {p.status === "pending" && p.whatsapp && (
        <div className={styles.reviewBtns}>
          {p.whatsapp.url && p.whatsapp.to ? (
            <WhatsAppButton
              url={p.whatsapp.url}
              submissionId={p.submissionId}
              template="guardian_consent"
              to={p.whatsapp.to}
              who="tutor"
              label="Enviar el enlace al tutor"
            />
          ) : (
            <span className={styles.hint}>No se puede abrir WhatsApp: falta un número válido del tutor. Copia el enlace y envíalo por otro medio.</span>
          )}
        </div>
      )}

      {!p.locked && (
        <div className={styles.formActions}>
          {(p.status === "none" || p.status === "expired") && (
            <form action={p.requestAction}>
              <input type="hidden" name="qs" value={p.qs} />
              <button type="submit" className={styles.btn}>
                {p.status === "none" ? "Generar enlace" : "Renovar enlace"}
              </button>
            </form>
          )}
          {p.status === "authorized" && (
            <form action={p.revokeAction}>
              <input type="hidden" name="qs" value={p.qs} />
              <button type="submit" className={styles.btnDanger}>
                Registrar revocación
              </button>
            </form>
          )}
          {(p.status === "pending" || p.status === "declined" || p.status === "revoked") && (
            <form action={p.resetAction}>
              <input type="hidden" name="qs" value={p.qs} />
              <button type="submit" className={styles.btnGhost}>
                Reiniciar (nuevo enlace)
              </button>
            </form>
          )}
        </div>
      )}
      <p className={styles.hint}>Sin consentimiento vigente no se puede confirmar la vacante. Los textos de WhatsApp se editan en Mensajes.</p>
    </section>
  );
}
