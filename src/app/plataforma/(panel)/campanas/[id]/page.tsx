import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill from "@/components/admin/StatusPill";
import { requireRole } from "@/lib/admin/auth";
import { formatLima } from "@/lib/forms/lima";
import { STATUS_LABELS } from "@/lib/forms/review";
import { cleanSearch, loadCampaign, loadStatusCounts } from "@/lib/forms/review-data";
import styles from "../../../admin.module.css";

const PAGE_SIZE = 25;
const FILTERS = ["nueva", "en_revision", "admitida", "lista_espera", "descartada"] as const;

type Row = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  is_minor: boolean;
  created_at: string;
  country: string | null;
};

export default async function CampanaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ estado?: string; q?: string; menores?: string; pagina?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireRole("admin");

  const campaign = await loadCampaign(supabase, id);
  if (!campaign) notFound();

  const estado = (FILTERS as readonly string[]).includes(sp.estado ?? "") ? sp.estado! : "";
  const q = cleanSearch(sp.q ?? "");
  const menores = sp.menores === "1";
  const page = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);

  let query = supabase
    .from("submissions")
    .select("id,full_name,email,status,is_minor,created_at,country:answers->>C4", { count: "exact" })
    .eq("campaign_id", id)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (estado) query = query.eq("status", estado);
  if (menores) query = query.eq("is_minor", true);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const [{ data, count, error }, counts] = await Promise.all([
    query.overrideTypes<Row[], { merge: false }>(),
    loadStatusCounts(supabase, id),
  ]);
  const rows = data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qsBase = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (estado) p.set("estado", estado);
    if (q) p.set("q", q);
    if (menores) p.set("menores", "1");
    for (const [k, v] of Object.entries(extra)) (v ? p.set(k, v) : p.delete(k));
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  // Los filtros viajan al detalle para poder pasar de una postulación a la siguiente.
  const detailQs = qsBase({});

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>{campaign.name}</h1>
          <p>
            <Link href="/plataforma/campanas">← Todas las campañas</Link> · {campaign.form_title} · versión {campaign.version} ·{" "}
            {campaign.status === "open" ? "recibiendo postulaciones" : `${campaign.status === "archived" ? "archivada · " : ""}cerrada ${formatLima(campaign.closed_at)}`}
          </p>
        </div>
        <Link href={`/plataforma/campanas/${id}/cierre`} className={campaign.status === "open" ? styles.btnGhost : styles.btn}>
          {campaign.status === "open" ? "Cierre y exportación" : "Cifras y exportación"}
        </Link>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Recibidas</p>
          <p className={styles.statValue}>{counts.total}</p>
          <p className={styles.statHint}>{campaign.capacity ? `${campaign.capacity} cupos` : "Sin cupos definidos"}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Aprobadas</p>
          <p className={styles.statValue}>{counts.admitida ?? 0}</p>
          <p className={styles.statHint}>{campaign.capacity ? `de ${campaign.capacity} cupos` : "—"}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Sin revisar</p>
          <p className={styles.statValue}>{(counts.nueva ?? 0) + (counts.en_revision ?? 0)}</p>
          <p className={styles.statHint}>Nuevas + pendientes</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Lista de espera</p>
          <p className={styles.statValue}>{counts.lista_espera ?? 0}</p>
          <p className={styles.statHint}>{counts.descartada ?? 0} descartadas</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.chips} role="group" aria-label="Filtrar por estado">
          <Link href={`/plataforma/campanas/${id}${qsBase({ estado: "", pagina: "" })}`} className={`${styles.chip} ${!estado ? styles.chipOn : ""}`}>
            Todas <span>{counts.total}</span>
          </Link>
          {FILTERS.map((s) => (
            <Link
              key={s}
              href={`/plataforma/campanas/${id}${qsBase({ estado: s, pagina: "" })}`}
              className={`${styles.chip} ${estado === s ? styles.chipOn : ""}`}
            >
              {STATUS_LABELS[s]} <span>{counts[s] ?? 0}</span>
            </Link>
          ))}
        </div>
        <form method="get" className={styles.searchForm}>
          {estado && <input type="hidden" name="estado" value={estado} />}
          <input type="search" name="q" defaultValue={q} placeholder="Buscar por nombre o correo" aria-label="Buscar" />
          <label className={styles.flag}>
            <input type="checkbox" name="menores" value="1" defaultChecked={menores} /> Solo menores
          </label>
          <button type="submit" className={styles.btnGhost}>
            Filtrar
          </button>
        </form>
      </div>

      {error && <div className={`${styles.flash} ${styles.error}`}>No se pudieron cargar las respuestas: {error.message}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Postulante</th>
              <th>País</th>
              <th>Recibida</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  {total === 0 && !estado && !q && !menores ? "Aún no hay postulaciones en esta campaña." : "Ninguna postulación coincide con el filtro."}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={styles.titleCell}>
                  <strong>
                    <Link href={`/plataforma/campanas/${id}/${r.id}${detailQs}`}>{r.full_name}</Link>
                    {r.is_minor && <span className={styles.badge}> Menor</span>}
                  </strong>
                  <span>{r.email}</span>
                </td>
                <td>{r.country ?? "—"}</td>
                <td>{formatLima(r.created_at)}</td>
                <td>
                  <StatusPill status={r.status} />
                </td>
                <td>
                  <Link href={`/plataforma/campanas/${id}/${r.id}${detailQs}`} className={styles.btnGhost}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className={styles.pager} aria-label="Paginación">
          {page > 1 ? <Link href={`/plataforma/campanas/${id}${qsBase({ pagina: String(page - 1) })}`}>← Anterior</Link> : <span />}
          <span>
            Página {page} de {pages} · {total} resultados
          </span>
          {page < pages ? <Link href={`/plataforma/campanas/${id}${qsBase({ pagina: String(page + 1) })}`}>Siguiente →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
