import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PrivacyNotice from "@/components/forms/PrivacyNotice";
import styles from "@/components/forms/Forms.module.css";
import { getPublicConsent, RELATIONSHIP_LABELS, TOKEN_PATTERN, type Relationship } from "@/lib/consent/consent";
import { submitConsent } from "./actions";

// Página personal: nunca se cachea ni se indexa.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Consentimiento de madre, padre o tutor — CreateLatam",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, { title: string; body: string }> = {
  expired: { title: "El enlace venció", body: "Escríbenos y te enviaremos uno nuevo." },
  unavailable: { title: "Este formulario aún no está disponible", body: "Vuelve a intentarlo en unos días." },
  revoked: { title: "Este consentimiento fue revocado", body: "Si quieres volver a autorizar, escríbenos." },
};

export default async function ConsentimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  if (!TOKEN_PATTERN.test(token)) notFound();
  const info = await getPublicConsent(token);
  if (!info) notFound();

  const controller = info.legal.controllerName;
  const firstName = info.participantName.trim().split(/\s+/)[0] ?? info.participantName;

  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <h1>Consentimiento de madre, padre o tutor</h1>
        </div>
      </section>

      <div className={styles.wrap}>
        {info.state === "pending" ? (
          <>
            <p className={styles.intro}>
              {firstName} fue seleccionada en <strong>{info.program}</strong> y, como es menor de edad, necesitamos tu autorización para confirmar su vacante. Lo completas
              tú: es un formulario corto.
            </p>

            {error && (
              <div className={styles.notice} role="alert">
                <p>{error}</p>
              </div>
            )}

            <form action={submitConsent.bind(null, token)} className={styles.form}>
              <p>
                Yo, la persona que firma abajo, madre, padre o tutor/a legal de <strong>{info.participantName}</strong>
                {info.age ? `, de ${info.age} años` : ""}, autorizo a <strong>{controller}</strong> a tratar sus datos personales para su participación en{" "}
                <strong>{info.program}</strong>, según el aviso de privacidad de más abajo.
              </p>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Tu nombre completo <span className={styles.req}>*</span>
                </label>
                <input id="name" name="name" className={styles.input} maxLength={120} autoComplete="name" required />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="relationship">
                  Eres su… <span className={styles.req}>*</span>
                </label>
                <select id="relationship" name="relationship" className={styles.select} defaultValue="" required>
                  <option value="" disabled>
                    Elige una opción
                  </option>
                  {(Object.keys(RELATIONSHIP_LABELS) as Relationship[]).map((r) => (
                    <option key={r} value={r}>
                      {RELATIONSHIP_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className={styles.field}>
                <legend className={styles.label}>
                  Uso de su imagen en fotos y videos de difusión de CreateLatam <span className={styles.req}>*</span>
                </legend>
                <div className={styles.choices}>
                  <label className={styles.choice}>
                    <input type="radio" name="image" value="si" /> Autorizo
                  </label>
                  <label className={styles.choice}>
                    <input type="radio" name="image" value="no" /> No autorizo
                  </label>
                </div>
                <span className={styles.help}>Es independiente de la autorización de participación: puedes autorizar una y no la otra.</span>
              </fieldset>

              <PrivacyNotice title={info.program} retention={info.retention ?? ""} legal={info.legal} />

              <p className={styles.help}>
                Al enviar, confirmas que eres quien ejerce la patria potestad o tutela de {firstName} y que tú completaste este formulario.
              </p>

              <div className={styles.field}>
                <button type="submit" name="decision" value="autorizo" className={styles.submit}>
                  Autorizo su participación
                </button>
              </div>
              <div className={styles.field}>
                <button type="submit" name="decision" value="no_autorizo" formNoValidate className={styles.submitSecondary}>
                  No autorizo
                </button>
              </div>
            </form>
          </>
        ) : info.state === "authorized" ? (
          <div className={styles.notice} role="status">
            <h2>¡Gracias! Recibimos tu autorización</h2>
            <p>
              Con esto podemos confirmar la vacante de {firstName}. Uso de imagen: <strong>{info.imageConsent ? "autorizado" : "no autorizado"}</strong>. Puedes retirar tu
              autorización cuando quieras escribiendo a {info.legal.privacyEmail}.
            </p>
          </div>
        ) : info.state === "declined" ? (
          <div className={styles.notice} role="status">
            <h2>Registramos que no autorizas</h2>
            <p>No podremos confirmar la vacante de {firstName}. Si fue un error o cambias de opinión, escríbenos a {info.legal.privacyEmail}.</p>
          </div>
        ) : (
          <div className={styles.notice}>
            <h2>{MESSAGES[info.state]?.title}</h2>
            <p>{MESSAGES[info.state]?.body}</p>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
