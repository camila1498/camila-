import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { legacyFormUrls } from "@/lib/forms/legacy";
import { getLegalInfo, getPublicForm } from "@/lib/forms/store";
import FormRenderer from "./FormRenderer";
import PrivacyNotice from "./PrivacyNotice";
import styles from "./Forms.module.css";

type FormPageProps = {
  slug: string;
  /** Migas de pan: [{ label, href }] antes de la pagina actual. */
  trail: { label: string; href: string }[];
};

export default async function FormPage({ slug, trail }: FormPageProps) {
  const form = await getPublicForm(slug);
  const legal = form?.state === "open" ? await getLegalInfo() : null;
  const state = form?.state === "open" && legal ? "open" : (form?.state ?? "soon");
  const title = form?.title ?? "Formulario";
  const openForm = form?.state === "open" && legal ? form : null;

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
            {openForm?.definition.title ?? title}
          </p>
          <h1>{openForm?.definition.title ?? title}</h1>
        </div>
      </section>

      <div className={styles.wrap}>
        {openForm && legal ? (
          <>
            {openForm.definition.intro && <p className={styles.intro}>{openForm.definition.intro}</p>}
            <FormRenderer
              definition={openForm.definition}
              privacy={
                <PrivacyNotice
                  title={openForm.definition.title}
                  retention={openForm.definition.retention}
                  legal={legal}
                />
              }
            />
          </>
        ) : (
          <div className={styles.notice}>
            <h2>{state === "closed" ? "Postulaciones cerradas" : "Este formulario abrirá pronto"}</h2>
            <p>
              {state === "closed"
                ? "Por ahora no estamos recibiendo respuestas en este formulario. Síguenos para enterarte de la próxima convocatoria."
                : "Estamos terminando de preparar este formulario. Vuelve en unos días."}
            </p>
            {legacyFormUrls[slug] && state === "soon" && (
              <a href={legacyFormUrls[slug]} target="_blank" rel="noreferrer" className="btn-primary">
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
