import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getFormDefinition } from "@/lib/forms/definitions";
import { getAvailability } from "@/lib/forms/status";
import FormRenderer from "./FormRenderer";
import PrivacyNotice from "./PrivacyNotice";
import styles from "./Forms.module.css";

type FormPageProps = {
  slug: string;
  /** Migas de pan: [{ label, href }] antes de la pagina actual. */
  trail: { label: string; href: string }[];
};

export default async function FormPage({ slug, trail }: FormPageProps) {
  const def = getFormDefinition(slug);
  if (!def) throw new Error(`Formulario desconocido: ${slug}`);

  const { availability } = await getAvailability(def.slug);

  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link>
            {trail.map((item) => (
              <span key={item.href}>
                {" / "}
                <Link href={item.href}>{item.label}</Link>
              </span>
            ))}
            {" / "}
            {def.title}
          </p>
          <h1>{def.title}</h1>
        </div>
      </section>

      <div className={styles.wrap}>
        {availability === "open" ? (
          <>
            <p className={styles.intro}>{def.intro}</p>
            <FormRenderer
              definition={def}
              privacy={<PrivacyNotice title={def.title} retention={def.retention} />}
            />
          </>
        ) : (
          <div className={styles.notice}>
            <h2>{availability === "closed" ? "Postulaciones cerradas" : "Este formulario abrirá pronto"}</h2>
            <p>
              {availability === "closed"
                ? "Por ahora no estamos recibiendo respuestas en este formulario. Síguenos para enterarte de la próxima convocatoria."
                : "Estamos terminando de preparar este formulario. Vuelve en unos días."}
            </p>
            {def.legacyUrl && availability === "soon" && (
              <a href={def.legacyUrl} target="_blank" rel="noreferrer" className="btn-primary">
                Mientras tanto, postula aquí →
              </a>
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
