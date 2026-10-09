import FormAdminCard, { type CampaignSummary, type FormAdminRow } from "@/components/admin/FormAdminCard";
import { requireRole } from "@/lib/admin/auth";
import { loadFormState } from "@/lib/forms/admin";
import { legalStatus, loadLegal } from "@/lib/forms/legal-admin";
import { formPaths } from "@/lib/forms/paths";
import type { FormDefinition } from "@/lib/forms/types";
import Link from "next/link";
import styles from "../../admin.module.css";

export default async function FormulariosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireRole("admin");

  const slugs = Object.keys(formPaths) as FormDefinition["slug"][];
  const [states, legalRow] = await Promise.all([
    Promise.all(slugs.map((slug) => loadFormState(supabase, slug))),
    loadLegal(supabase),
  ]);
  const legal = legalStatus(legalRow);

  const rows: FormAdminRow[] = await Promise.all(
    states.map(async (state, i) => {
      const slug = slugs[i]!;
      const campaigns: CampaignSummary[] = await Promise.all(
        (state?.campaigns ?? []).map(async (c) => {
          const { count } = await supabase
            .from("submissions")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", c.id)
            .is("archived_at", null);
          return { ...c, submissions: count ?? 0 };
        }),
      );
      return {
        slug,
        title: state?.title ?? slug,
        path: formPaths[slug],
        open: campaigns.find((c) => c.status === "open") ?? null,
        past: campaigns.filter((c) => c.status !== "open"),
        latestVersion: state?.latestVersion ?? null,
        draftUpdatedAt: state?.draftUpdatedAt ?? null,
        draftInvalid: !state?.draft,
      };
    }),
  );

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Formularios</h1>
          <p>Edita cada formulario, publícalo para abrir una campaña y ciérrala cuando termine la convocatoria.</p>
        </div>
      </div>

      {ok && <div className={`${styles.flash} ${styles.ok}`}>{ok}</div>}
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}
      {!legal.ready && (
        <div className={`${styles.flash} ${styles.warn}`}>
          <strong>Aún no se puede publicar ningún formulario.</strong> {legal.message}{" "}
          <Link href="/plataforma/configuracion">Ir a Configuración →</Link>
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
