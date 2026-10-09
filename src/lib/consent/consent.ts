import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";
import type { LegalInfo } from "@/lib/forms/store";

export const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export type Relationship = "madre" | "padre" | "tutor";
export const RELATIONSHIP_LABELS: Record<Relationship, string> = { madre: "Madre", padre: "Padre", tutor: "Tutor/a legal" };
const RELATIONSHIP_IN_TEXT: Record<Relationship, string> = { madre: "madre", padre: "padre", tutor: "tutor/a legal" };

export type ConsentState = "pending" | "authorized" | "declined" | "revoked" | "expired" | "unavailable";

/** Lo que ve quien abre el enlace. */
export type PublicConsent = {
  state: ConsentState;
  participantName: string;
  age: string | null;
  program: string;
  campaignName: string;
  retention: string | null;
  imageConsent: boolean | null;
  legal: LegalInfo;
};

/** Lectura con el enlace personal (sin sesión): devuelve null si el enlace no existe. */
export async function getPublicConsent(token: string): Promise<PublicConsent | null> {
  if (!TOKEN_PATTERN.test(token) || !isSupabaseConfigured()) return null;
  const { data, error } = await createPublicClient().rpc("get_guardian_consent", { p_token: token });
  if (error || !data) return null;
  return data as PublicConsent;
}

type StatementInput = {
  guardianName: string;
  relationship: Relationship;
  participantName: string;
  age: string | null;
  program: string;
  controller: string;
  authorize: boolean;
  image: boolean;
};

/**
 * Texto exacto que acepta el tutor (PDF §7). Se arma en el servidor con datos de la base y se guarda tal cual,
 * para poder demostrar qué se autorizó aunque el formulario cambie después.
 */
export function buildStatement(i: StatementInput): string {
  const who = `Yo, ${i.guardianName}, ${RELATIONSHIP_IN_TEXT[i.relationship]} de ${i.participantName}${i.age ? `, de ${i.age} años` : ""}`;
  if (!i.authorize) {
    return `${who}, NO autorizo a ${i.controller} a tratar sus datos personales para su participación en ${i.program}.`;
  }
  const image = i.image
    ? "Autorizo el uso de su imagen en fotos y videos de difusión de CreateLatam."
    : "No autorizo el uso de su imagen en fotos y videos de difusión de CreateLatam.";
  return `${who}, autorizo a ${i.controller} a tratar sus datos personales para su participación en ${i.program}, según el aviso de privacidad que aparece en esta página. ${image}`;
}

export type ConsentRecord = {
  token: string;
  expires_at: string;
  created_at: string;
  responded_at: string | null;
  guardian_name: string | null;
  relationship: Relationship | null;
  data_consent: boolean | null;
  image_consent: boolean | null;
  revoked_at: string | null;
};

/** Estado del consentimiento de una postulación, para el equipo. */
export type ConsentStatus = "none" | "pending" | "expired" | "authorized" | "declined" | "revoked";

export function consentStatus(c: Pick<ConsentRecord, "expires_at" | "responded_at" | "data_consent" | "revoked_at"> | null, now = Date.now()): ConsentStatus {
  if (!c) return "none";
  if (c.responded_at) return c.revoked_at ? "revoked" : c.data_consent ? "authorized" : "declined";
  return Date.parse(c.expires_at) < now ? "expired" : "pending";
}

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
  none: "Sin enviar",
  pending: "Pendiente",
  expired: "Enlace vencido",
  authorized: "Autorizó",
  declined: "No autorizó",
  revoked: "Revocado",
};

export async function loadConsent(supabase: SupabaseClient, submissionId: string): Promise<ConsentRecord | null> {
  const { data } = await supabase
    .from("guardian_consents")
    .select("token,expires_at,created_at,responded_at,guardian_name,relationship,data_consent,image_consent,revoked_at")
    .eq("submission_id", submissionId)
    .maybeSingle()
    .overrideTypes<ConsentRecord, { merge: false }>();
  return data ?? null;
}
