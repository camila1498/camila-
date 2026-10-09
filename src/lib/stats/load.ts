import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";
import type { PublicCampaign, StatsRow } from "./types";

export async function loadCampaignStats(supabase: SupabaseClient, campaignId: string): Promise<StatsRow | null> {
  const { data } = await supabase
    .from("campaign_stats")
    .select("snapshot,generated_at,public_data,public_selection,published,published_at")
    .eq("campaign_id", campaignId)
    .maybeSingle()
    .overrideTypes<StatsRow, { merge: false }>();
  return data ?? null;
}

/** Cifras de campañas publicadas (para la web). Si algo falla, no se muestra nada. */
export async function loadPublicStats(formSlug?: string): Promise<PublicCampaign[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient().rpc("get_public_stats", { p_form_slug: formSlug ?? null });
    if (error || !Array.isArray(data)) return [];
    return data as PublicCampaign[];
  } catch {
    return [];
  }
}
