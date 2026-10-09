import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";
import { parseDefinition } from "./schema";
import type { FormDefinition } from "./types";

/** Estado publico de un formulario: lo que decide la web (get_public_form en la base). */
export type PublicForm =
  | { state: "soon" | "closed"; title: string }
  | {
      state: "open";
      title: string;
      campaignId: string;
      campaignName: string;
      version: number;
      capacity: number | null;
      opensAt: string | null;
      closesAt: string | null;
      definition: FormDefinition;
    };

type RawPublicForm = {
  state: "soon" | "open" | "closed";
  title: string;
  campaignId?: string;
  campaignName?: string;
  version?: number;
  capacity?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
  definition?: unknown;
};

/** null si Supabase no esta configurado o el formulario no existe. */
export async function getPublicForm(slug: string): Promise<PublicForm | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_public_form", { p_slug: slug });
  if (error || !data) {
    if (error) console.error("get_public_form falló:", error.message);
    return null;
  }

  const raw = data as RawPublicForm;
  if (raw.state !== "open") return { state: raw.state, title: raw.title };

  const parsed = parseDefinition(raw.definition);
  if (!parsed.ok || !raw.campaignId) {
    // Una definicion corrupta nunca debe mostrarse ni aceptar envios.
    console.error("Definición inválida para", slug, parsed.ok ? "" : parsed.errors);
    return { state: "soon", title: raw.title };
  }

  return {
    state: "open",
    title: raw.title,
    campaignId: raw.campaignId,
    campaignName: raw.campaignName ?? "",
    version: raw.version ?? parsed.definition.version,
    capacity: raw.capacity ?? null,
    opensAt: raw.opensAt ?? null,
    closesAt: raw.closesAt ?? null,
    definition: { ...parsed.definition, version: raw.version ?? parsed.definition.version },
  };
}

export type LegalInfo = {
  controllerName: string;
  ruc: string;
  address: string;
  privacyEmail: string;
  storageNotice: string;
  ready: boolean;
};

export async function getLegalInfo(): Promise<LegalInfo | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createPublicClient().rpc("legal_info");
  if (error || !data) return null;
  return data as LegalInfo;
}
