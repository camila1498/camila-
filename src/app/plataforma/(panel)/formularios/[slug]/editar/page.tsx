import Link from "next/link";
import { notFound } from "next/navigation";
import FormBuilder from "@/components/admin/FormBuilder";
import { requireRole } from "@/lib/admin/auth";
import { loadFormState } from "@/lib/forms/admin";
import { loadLegal } from "@/lib/forms/legal-admin";
import { formPaths } from "@/lib/forms/paths";
import { fieldsOf } from "@/lib/forms/schema";
import styles from "../../../../admin.module.css";
import { saveDraft } from "./actions";

export default async function EditarFormularioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in formPaths)) notFound();

  const { supabase } = await requireRole("admin");
  const [state, legalRow] = await Promise.all([loadFormState(supabase, slug), loadLegal(supabase)]);
  if (!state) notFound();

  const locked = Boolean(state.openCampaign);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Editar: {state.title}</h1>
          <p>
            <Link href="/plataforma/formularios">← Volver a formularios</Link>
            {state.latestVersion ? ` · última versión publicada: v${state.latestVersion}` : ""}
          </p>
        </div>
        {!locked && state.draft && (
          <Link href={`/plataforma/formularios/${slug}/publicar`} className={styles.btn}>
            Publicar…
          </Link>
        )}
      </div>

      {locked && (
        <div className={`${styles.flash} ${styles.warn}`} role="status">
          <strong>Publicado: solo lectura.</strong> “{state.openCampaign?.name}” está recibiendo postulaciones,
          así que el formulario no admite cambios. Para editarlo, cierra la campaña en{" "}
          <Link href="/plataforma/formularios">Formularios</Link>.
        </div>
      )}

      {state.draft ? (
        <FormBuilder
          slug={slug}
          initial={state.draft}
          publishedIds={state.latest ? fieldsOf(state.latest).map((f) => f.id) : []}
          readOnly={locked}
          legal={{
            controllerName: legalRow?.controller_name ?? "",
            ruc: legalRow?.ruc || "[RUC]",
            address: legalRow?.address || "[domicilio]",
            privacyEmail: legalRow?.privacy_email || "[correo de privacidad]",
            storageNotice: legalRow?.storage_notice ?? "",
          }}
          saveDraft={saveDraft}
        />
      ) : (
        <div className={`${styles.flash} ${styles.error}`}>
          El borrador está dañado: {state.draftErrors.join("; ")}
        </div>
      )}
    </>
  );
}
