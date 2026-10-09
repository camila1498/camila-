import type { SupabaseClient } from "@supabase/supabase-js";
import { fieldsOf, findPlaceholders, parseDefinition, validateDefinition } from "./schema";
import type { FormDefinition } from "./types";

export type CampaignRow = {
  id: string;
  name: string;
  version: number;
  status: "open" | "closed" | "archived";
  opens_at: string | null;
  closes_at: string | null;
  capacity: number | null;
  opened_at: string;
  closed_at: string | null;
};

export type FormState = {
  slug: string;
  title: string;
  /** Borrador editable (siempre existe; si esta corrupto es null y se avisa). */
  draft: FormDefinition | null;
  draftUpdatedAt: string | null;
  draftErrors: string[];
  /** Ultima version publicada (la base de las comparaciones y de los bloqueos). */
  latest: FormDefinition | null;
  latestVersion: number | null;
  campaigns: CampaignRow[];
  openCampaign: CampaignRow | null;
};

export async function loadFormState(supabase: SupabaseClient, slug: string): Promise<FormState | null> {
  const [formRes, draftRes, versionRes, campaignsRes] = await Promise.all([
    supabase.from("forms").select("slug,title").eq("slug", slug).maybeSingle(),
    supabase
      .from("form_drafts")
      .select("definition,updated_at")
      .eq("form_slug", slug)
      .maybeSingle()
      .overrideTypes<{ definition: unknown; updated_at: string }, { merge: false }>(),
    supabase
      .from("form_versions")
      .select("version,definition")
      .eq("form_slug", slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
      .overrideTypes<{ version: number; definition: unknown }, { merge: false }>(),
    supabase
      .from("campaigns")
      .select("id,name,version,status,opens_at,closes_at,capacity,opened_at,closed_at")
      .eq("form_slug", slug)
      .order("opened_at", { ascending: false })
      .overrideTypes<CampaignRow[], { merge: false }>(),
  ]);

  const form = formRes.data as { slug: string; title: string } | null;
  if (!form) return null;

  const draftParsed = draftRes.data ? parseDefinition(draftRes.data.definition) : null;
  const latestParsed = versionRes.data ? parseDefinition(versionRes.data.definition) : null;
  const campaigns = campaignsRes.data ?? [];

  return {
    slug: form.slug,
    title: form.title,
    draft: draftParsed?.ok ? draftParsed.definition : null,
    draftUpdatedAt: draftRes.data?.updated_at ?? null,
    draftErrors: draftParsed && !draftParsed.ok ? draftParsed.errors : draftRes.data ? [] : ["No hay borrador."],
    latest: latestParsed?.ok ? latestParsed.definition : null,
    latestVersion: versionRes.data?.version ?? null,
    campaigns,
    openCampaign: campaigns.find((c) => c.status === "open") ?? null,
  };
}

export type DefinitionDiff = {
  firstVersion: boolean;
  text: string[];
  added: string[];
  hidden: string[];
  shown: string[];
  changed: string[];
};

/** Resumen legible de lo que cambia al publicar el borrador respecto de la ultima version. */
export function diffDefinitions(prev: FormDefinition | null, next: FormDefinition): DefinitionDiff {
  const diff: DefinitionDiff = { firstVersion: !prev, text: [], added: [], hidden: [], shown: [], changed: [] };
  if (!prev) return diff;

  if (prev.title !== next.title) diff.text.push("Título");
  if (prev.intro !== next.intro) diff.text.push("Texto introductorio");
  if (prev.submitLabel !== next.submitLabel) diff.text.push("Texto del botón");
  if (prev.retention !== next.retention) diff.text.push("Plazo de conservación");
  if (prev.endIf?.message !== next.endIf?.message) diff.text.push("Mensaje de fin");

  const before = new Map(fieldsOf(prev).map((f) => [f.id, f]));
  fieldsOf(next).forEach((f) => {
    const old = before.get(f.id);
    const name = `${f.id} · ${f.label}`;
    if (!old) return void diff.added.push(name);
    if (!old.hidden && f.hidden) return void diff.hidden.push(name);
    if (old.hidden && !f.hidden) return void diff.shown.push(name);
    if (JSON.stringify({ ...old, hidden: undefined }) !== JSON.stringify({ ...f, hidden: undefined })) {
      diff.changed.push(name);
    }
  });
  return diff;
}

export type PublishCheck = {
  /** Impiden publicar. */
  blockers: string[];
  /** Marcadores `[…]` sin completar (tambien impiden publicar). */
  placeholders: string[];
};

export function checkPublishable(
  draft: FormDefinition | null,
  latest: FormDefinition | null,
  opts: { legalReady: boolean; legalMissing: string },
): PublishCheck {
  const blockers: string[] = [];
  if (!opts.legalReady) blockers.push(opts.legalMissing);
  if (!draft) {
    blockers.push("El borrador está dañado o no existe.");
    return { blockers, placeholders: [] };
  }
  blockers.push(...validateDefinition(draft, latest));
  const placeholders = findPlaceholders(draft);
  return { blockers, placeholders };
}
