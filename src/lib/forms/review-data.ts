import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDefinition } from "./schema";
import type { FormDefinition } from "./types";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CampaignInfo = {
  id: string;
  form_slug: string;
  form_title: string;
  name: string;
  version: number;
  status: "open" | "closed" | "archived";
  capacity: number | null;
  opens_at: string | null;
  closes_at: string | null;
  opened_at: string;
  closed_at: string | null;
};

type CampaignRow = Omit<CampaignInfo, "form_title"> & { forms: { title: string } | { title: string }[] | null };

const CAMPAIGN_COLUMNS =
  "id,form_slug,name,version,status,capacity,opens_at,closes_at,opened_at,closed_at,forms(title)";

function toInfo(row: CampaignRow): CampaignInfo {
  const forms = Array.isArray(row.forms) ? row.forms[0] : row.forms;
  const { forms: _forms, ...rest } = row;
  void _forms;
  return { ...rest, form_title: forms?.title ?? row.form_slug };
}

export async function loadCampaign(supabase: SupabaseClient, id: string): Promise<CampaignInfo | null> {
  if (!UUID.test(id)) return null;
  const { data } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<CampaignRow, { merge: false }>();
  return data ? toInfo(data) : null;
}

export async function loadCampaigns(supabase: SupabaseClient): Promise<CampaignInfo[]> {
  const { data } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .order("opened_at", { ascending: false })
    .overrideTypes<CampaignRow[], { merge: false }>();
  return (data ?? []).map(toInfo);
}

/** La definición de la versión con que se respondió la campaña (no la actual del borrador). */
export async function loadCampaignDefinition(
  supabase: SupabaseClient,
  campaign: Pick<CampaignInfo, "form_slug" | "version">,
): Promise<FormDefinition | null> {
  const { data } = await supabase
    .from("form_versions")
    .select("definition")
    .eq("form_slug", campaign.form_slug)
    .eq("version", campaign.version)
    .maybeSingle()
    .overrideTypes<{ definition: unknown }, { merge: false }>();
  const parsed = data ? parseDefinition(data.definition) : null;
  return parsed?.ok ? parsed.definition : null;
}

export type StatusCounts = Record<string, number> & { total: number };

export async function loadStatusCounts(supabase: SupabaseClient, campaignId: string): Promise<StatusCounts> {
  const { data } = await supabase
    .from("submissions")
    .select("status")
    .eq("campaign_id", campaignId)
    .is("archived_at", null)
    .limit(20000)
    .overrideTypes<{ status: string }[], { merge: false }>();
  const counts: StatusCounts = { total: 0 };
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    counts.total += 1;
  }
  return counts;
}

/** Quita lo que rompería un filtro `.or(...)` de PostgREST (comas, paréntesis, comodines). */
export const cleanSearch = (q: string) => q.replace(/[,()%*\\:]/g, " ").trim().slice(0, 80);
