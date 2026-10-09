import { requireRole } from "@/lib/admin/auth";
import { formatLima } from "@/lib/forms/lima";
import { renderTemplate, TEMPLATE_VARIABLES } from "@/lib/messaging/templates";
import styles from "../../admin.module.css";
import { saveTemplate } from "../campanas/actions";

const SAMPLE = {
  nombre: "Ana",
  nombre_completo: "Ana Pérez",
  formulario: "Postulación al Bootcamp 2026",
  campana: "Bootcamp 2026",
  enlace_consentimiento: "https://createlatam.tech/consentimiento/…",
};

const ORDER = ["approved", "waitlist", "rejected", "guardian_consent"];

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireRole("admin");

  const { data } = await supabase
    .from("message_templates")
    .select("key,label,body,updated_at")
    .overrideTypes<{ key: string; label: string; body: string; updated_at: string }[], { merge: false }>();
  const templates = [...(data ?? [])].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Mensajes</h1>
          <p>Los textos que se abren en WhatsApp al avisar a cada postulante. Los envía una persona del equipo desde su WhatsApp.</p>
        </div>
      </div>

      {ok && <div className={`${styles.flash} ${styles.ok}`}>{ok}</div>}
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}

      <section className={styles.summary}>
        <h2>Variables disponibles</h2>
        <p className={styles.hint}>Escríbelas con llaves dobles; se reemplazan por los datos de cada persona.</p>
        <dl className={styles.formMeta}>
          {TEMPLATE_VARIABLES.map((v) => (
            <div key={v.name}>
              <dt>{`{{${v.name}}}`}</dt>
              <dd>{v.help}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={styles.formList}>
        {templates.map((t) => (
          <article key={t.key} className={styles.formCard}>
            <div className={styles.formCardHead}>
              <div>
                <h2>{t.label}</h2>
                <p className={styles.liveOff}>Editado {formatLima(t.updated_at)}</p>
              </div>
            </div>
            <form action={saveTemplate.bind(null, t.key)} className={styles.reviewForm}>
              <textarea name="body" rows={7} maxLength={1500} defaultValue={t.body} aria-label={`Mensaje: ${t.label}`} required />
              <div>
                <button type="submit" className={styles.btn}>
                  Guardar mensaje
                </button>
              </div>
            </form>
            <div>
              <p className={styles.statLabel}>Así se verá (con datos de ejemplo)</p>
              <pre className={styles.messagePreview}>{renderTemplate(t.body, SAMPLE)}</pre>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
