import FormAdminCard, { type CampaignSummary, type FormAdminRow } from "@/components/admin/FormAdminCard";
import { requireRole } from "@/lib/admin/auth";
import { loadFormState } from "@/lib/forms/admin";
import { legalStatus, loadLegal } from "@/lib/forms/legal-admin";
import { formPath } from "@/lib/forms/paths";
import Link from "next/link";
import styles from "../../admin.module.css";

export default async function FormulariosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireRole("admin");

  const { data: formRows } = await supabase
    .from("forms")
    .select("slug")
    .order("created_at", { ascending: true })
    .order("slug", { ascending: true })
    .overrideTypes<{ slug: string }[], { merge: false }>();
  const slugs = (formRows ?? []).map((r) => r.slug);

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
        path: formPath(slug),
        open: campaigns.find((c) => c.status === "open") ?? null,
        past: campaigns.filter((c) => c.status !== "open"),
        latestVersion: state?.latestVersion ?? null,
        draftUpdatedAt: state?.draftUpdatedAt ?? null,
        draftInvalid: !state?.draft,
        deletable: !state?.latestVersion && campaigns.length === 0,
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
        <Link href="/plataforma/formularios/nuevo" className={styles.btn}>
          + Nuevo formulario
        </Link>
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
