import type { SupabaseClient } from "@supabase/supabase-js";
import type { RetentionCampaign, RetentionRule } from "./types";

export async function loadRetention(supabase: SupabaseClient): Promise<RetentionCampaign[]> {
  const { data } = await supabase.rpc("retention_overview");
  return Array.isArray(data) ? (data as RetentionCampaign[]) : [];
}

export async function loadRetentionRules(supabase: SupabaseClient): Promise<RetentionRule[]> {
  const { data } = await supabase
    .from("retention_rules")
    .select("form_slug,not_selected_months,waitlist_months,participant_months")
    .overrideTypes<RetentionRule[], { merge: false }>();
  return data ?? [];
}

export async function loadRetentionLog(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("retention_log")
    .select("id,campaign_name,deleted,anonymized,created_at")
    .order("created_at", { ascending: false })
    .limit(20)
    .overrideTypes<{ id: string; campaign_name: string; deleted: number; anonymized: number; created_at: string }[], { merge: false }>();
  return data ?? [];
}
