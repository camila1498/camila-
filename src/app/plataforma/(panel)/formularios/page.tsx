import FormAdminCard, { type FormAdminRow } from "@/components/admin/FormAdminCard";
import { requireRole } from "@/lib/admin/auth";
import { missingConfig } from "@/lib/forms/config";
import { formDefinitions } from "@/lib/forms/definitions";
import { formPaths } from "@/lib/forms/paths";
import { computeAvailability } from "@/lib/forms/status";
import type { FormDefinition } from "@/lib/forms/types";
import styles from "../../admin.module.css";

type FormRow = {
  slug: FormDefinition["slug"];
  status: "draft" | "open" | "closed";
  opens_at: string | null;
  closes_at: string | null;
  capacity: number | null;
};

export default async function FormulariosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireRole("admin");

  const { data, error: loadError } = await supabase
    .from("forms")
    .select("slug,status,opens_at,closes_at,capacity")
    .overrideTypes<FormRow[], { merge: false }>();

  const counts = await Promise.all(
    Object.keys(formDefinitions).map(async (slug) => {
      const { count } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("form_slug", slug)
        .is("archived_at", null);
      return [slug, count ?? 0] as const;
    }),
  );
  const submissions = Object.fromEntries(counts);

  const rows: FormAdminRow[] = (Object.keys(formDefinitions) as FormDefinition["slug"][]).map((slug) => {
    const row = data?.find((r) => r.slug === slug) ?? null;
    const missing = missingConfig(slug);
    return {
      slug,
      title: formDefinitions[slug].title,
      path: formPaths[slug],
      status: row?.status ?? "draft",
      opens_at: row?.opens_at ?? null,
      closes_at: row?.closes_at ?? null,
      capacity: row?.capacity ?? null,
      submissions: submissions[slug] ?? 0,
      availability: computeAvailability(row, missing),
      missing,
    };
  });

  const pending = [...new Set(rows.flatMap((r) => r.missing))];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Formularios</h1>
          <p>Abre y cierra las postulaciones cuando empiece cada convocatoria.</p>
        </div>
      </div>

      {ok && <div className={`${styles.flash} ${styles.ok}`}>{ok}</div>}
      {(error || loadError) && (
        <div className={`${styles.flash} ${styles.error}`}>
          {error ?? `No se pudieron cargar los formularios: ${loadError?.message}`}
        </div>
      )}
      {pending.length > 0 && (
        <div className={`${styles.flash} ${styles.warn}`}>
          <strong>Aún no se pueden abrir.</strong> Faltan datos: {pending.join(", ")}. Los completa
          Legal en las variables de entorno del proyecto (LEGAL_RUC, LEGAL_ADDRESS,
          LEGAL_PRIVACY_EMAIL, BOOTCAMP_SCHEDULE); hasta entonces ningún formulario recibe envíos.
        </div>
      )}

      <div className={styles.formList}>
        {rows.map((row) => (
          <FormAdminCard key={row.slug} row={row} />
        ))}
      </div>
    </>
  );
}
