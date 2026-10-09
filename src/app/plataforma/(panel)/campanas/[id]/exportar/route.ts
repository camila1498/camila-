import { requireRoleOrThrow } from "@/lib/admin/auth";
import { buildExport, exportFilename, type ExportMode, type ExportRow } from "@/lib/export/campaign";
import { toCsv } from "@/lib/export/csv";
import { loadCampaign, loadCampaignDefinition, UUID } from "@/lib/forms/review-data";

export const dynamic = "force-dynamic";

const CHUNK = 1000;
const MAX_ROWS = 50000;

type DbRow = Omit<ExportRow, "sensitive"> & {
  submission_sensitive: { data: Record<string, unknown> } | { data: Record<string, unknown> }[] | null;
};

/** Descarga CSV de una campaña: completo (con datos personales) o anonimizado. Solo administradores. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mode: ExportMode = new URL(request.url).searchParams.get("modo") === "anonimo" ? "anonimo" : "completo";

  let session;
  try {
    session = await requireRoleOrThrow("admin");
  } catch {
    // Sin sesión de administrador no se revela nada, ni siquiera si la campaña existe.
    return new Response("No autorizado", { status: 403 });
  }
  const { supabase, user } = session;
  if (!UUID.test(id)) return new Response("Campaña no válida", { status: 404 });

  const campaign = await loadCampaign(supabase, id);
  const def = campaign ? await loadCampaignDefinition(supabase, campaign) : null;
  if (!campaign || !def) return new Response("Campaña no encontrada", { status: 404 });

  // El modo anonimizado ni siquiera trae los datos sensibles desde la base.
  const select =
    "full_name,email,status,is_minor,consent_marketing,notes,created_at,answers" +
    (mode === "completo" ? ",submission_sensitive(data)" : "");

  const rows: ExportRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += CHUNK) {
    const { data, error } = await supabase
      .from("submissions")
      .select(select)
      .eq("campaign_id", id)
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + CHUNK - 1)
      .overrideTypes<DbRow[], { merge: false }>();
    if (error) return new Response(`No se pudo exportar: ${error.message}`, { status: 500 });
    for (const r of data ?? []) {
      const s = Array.isArray(r.submission_sensitive) ? r.submission_sensitive[0] : r.submission_sensitive;
      rows.push({ ...r, sensitive: s?.data ?? {} });
    }
    if ((data?.length ?? 0) < CHUNK) break;
  }

  // Queda constancia de quién descargó datos y cuántas filas. Si no se puede registrar, no se entrega.
  const { error: logError } = await supabase
    .from("export_log")
    .insert({ campaign_id: id, mode, row_count: rows.length, created_by: user.id });
  if (logError) return new Response("No se pudo registrar la descarga; no se entregó el archivo.", { status: 500 });

  return new Response(toCsv(buildExport(def, rows, mode)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(campaign.name, mode)}"`,
      "Cache-Control": "no-store",
    },
  });
}
