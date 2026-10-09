import { headers } from "next/headers";
import { notFound } from "next/navigation";
import GuardianConsentPanel from "@/components/admin/GuardianConsentPanel";
import SelectionPanel from "@/components/admin/SelectionPanel";
import SubmissionReview from "@/components/admin/SubmissionReview";
import { requireRole } from "@/lib/admin/auth";
import { guardianNameId, guardianPhoneId, labeledAnswers } from "@/lib/forms/review";
import { cleanSearch, loadCampaign, loadCampaignDefinition, UUID } from "@/lib/forms/review-data";
import { toWhatsAppNumber } from "@/lib/messaging/phone";
import { firstName, renderTemplate, templateForStatus } from "@/lib/messaging/templates";
import { whatsappUrl } from "@/lib/messaging/whatsapp";
import { consentStatus, loadConsent } from "@/lib/consent/consent";
import { discardReasons } from "@/lib/selection/bootcamp";
import { ageRangeOf, loadReviewerNames, supportsScoring, toApplicant } from "@/lib/selection/load";
import { gradeSubmission, requestConsent, resetConsent, reviewSubmission, revokeConsent, saveNotes, setEquipmentSolved } from "../../actions";

type Submission = {
  id: string;
  campaign_id: string;
  form_slug: string;
  full_name: string;
  email: string;
  answers: Record<string, unknown>;
  is_minor: boolean;
  consent_privacy_at: string;
  consent_marketing: boolean;
  status: string;
  notes: string | null;
  created_at: string;
  tags: string[] | null;
  score_review: Record<string, unknown> | null;
};

type EventRow = {
  id: string;
  kind: "status" | "note" | "whatsapp" | "email" | "grade";
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  detail: { template?: string; to?: string; who?: string; slot?: string; b8?: number; b9?: number; offTopic?: boolean } | null;
  created_by: string | null;
  created_at: string;
};

const FILTERS = ["nueva", "en_revision", "admitida", "lista_espera", "descartada"];

export default async function PostulacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; submissionId: string }>;
  searchParams: Promise<{ estado?: string; q?: string; menores?: string; ok?: string; error?: string }>;
}) {
  const { id, submissionId } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireRole("admin");

  if (!UUID.test(submissionId)) notFound();
  const campaign = await loadCampaign(supabase, id);
  if (!campaign) notFound();

  const { data: sub } = await supabase
    .from("submissions")
    .select("id,campaign_id,form_slug,full_name,email,answers,is_minor,consent_privacy_at,consent_marketing,status,notes,created_at,tags,score_review")
    .eq("id", submissionId)
    .eq("campaign_id", id)
    .maybeSingle()
    .overrideTypes<Submission, { merge: false }>();
  if (!sub) notFound();

  // Filtros de la tabla: viajan en la URL para navegar entre postulaciones sin perder el contexto.
  const estado = FILTERS.includes(sp.estado ?? "") ? sp.estado! : "";
  const q = cleanSearch(sp.q ?? "");
  const menores = sp.menores === "1";
  const qsParams = new URLSearchParams();
  if (estado) qsParams.set("estado", estado);
  if (q) qsParams.set("q", q);
  if (menores) qsParams.set("menores", "1");
  const qs = qsParams.toString();

  let idsQuery = supabase
    .from("submissions")
    .select("id")
    .eq("campaign_id", id)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (estado) idsQuery = idsQuery.eq("status", estado);
  if (menores) idsQuery = idsQuery.eq("is_minor", true);
  if (q) idsQuery = idsQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const [def, sensitiveRes, eventsRes, templatesRes, idsRes, consent] = await Promise.all([
    loadCampaignDefinition(supabase, campaign),
    supabase
      .from("submission_sensitive")
      .select("data")
      .eq("submission_id", submissionId)
      .maybeSingle()
      .overrideTypes<{ data: Record<string, unknown> }, { merge: false }>(),
    supabase
      .from("submission_events")
      .select("id,kind,from_status,to_status,note,detail,created_by,created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(50)
      .overrideTypes<EventRow[], { merge: false }>(),
    supabase
      .from("message_templates")
      .select("key,body")
      .overrideTypes<{ key: string; body: string }[], { merge: false }>(),
    idsQuery.overrideTypes<{ id: string }[], { merge: false }>(),
    loadConsent(supabase, submissionId),
  ]);

  const events = eventsRes.data ?? [];
  const authorIds = [...new Set(events.map((e) => e.created_by).filter((x): x is string => Boolean(x)))];
  const authors = authorIds.length
    ? ((
        await supabase
          .from("members")
          .select("user_id,full_name,email")
          .in("user_id", authorIds)
          .overrideTypes<{ user_id: string; full_name: string | null; email: string }[], { merge: false }>()
      ).data ?? [])
    : [];
  const authorName = (uid: string | null) => {
    const m = authors.find((a) => a.user_id === uid);
    if (!uid) return "Tutor (por enlace)";
    return m ? (m.full_name ?? m.email) : "Alguien del equipo";
  };

  const ids = (idsRes.data ?? []).map((r) => r.id);
  const at = ids.indexOf(submissionId);
  const prevId = at > 0 ? ids[at - 1] : undefined;
  const nextId = at >= 0 && at < ids.length - 1 ? ids[at + 1] : undefined;

  const sensitive = sensitiveRes.data?.data ?? {};
  const sections = def ? labeledAnswers(def, sub.answers, sensitive, ["C1", "C2", "C3"]) : [];

  // WhatsApp: el mensaje depende del estado actual; los menores también tienen botón para su tutor.
  const country = sub.answers.C4;
  const person = toWhatsAppNumber(sub.answers.C3, country);
  const guardianId = def ? guardianPhoneId(def) : null;
  const guardianNameKey = def ? guardianNameId(def) : null;
  const guardianNumber = sub.is_minor && guardianId ? toWhatsAppNumber(sub.answers[guardianId], country) : null;
  const guardianName = guardianNameKey ? String(sub.answers[guardianNameKey] ?? "") : "";

  const templateKey = templateForStatus[sub.status];
  const templateBody = templatesRes.data?.find((t) => t.key === templateKey)?.body;
  const vars = {
    nombre: firstName(sub.full_name),
    nombre_completo: sub.full_name,
    formulario: def?.title ?? campaign.form_title,
    campana: campaign.name,
    enlace_consentimiento: "",
  };
  const message = templateBody ? renderTemplate(templateBody, vars) : null;
  const guardianMessage = message
    ? `Hola, te escribimos de CreateLatam. Este mensaje es para la madre, padre o tutor de ${vars.nombre}:\n\n${message}`
    : null;
  const personUrl = message && person.digits ? whatsappUrl(person.digits, message) : null;
  const guardianUrl = guardianMessage && guardianNumber?.digits ? whatsappUrl(guardianNumber.digits, guardianMessage) : null;

  // Puntaje del Bootcamp: solo en campañas cuya versión conserva las preguntas que lo alimentan.
  let scoring: React.ReactNode = null;
  if (supportsScoring(campaign.form_slug, def)) {
    const applicant = toApplicant({
      id: sub.id,
      full_name: sub.full_name,
      created_at: sub.created_at,
      status: sub.status,
      tags: sub.tags,
      score_review: sub.score_review as never,
      b1: sub.answers.B1 === undefined ? null : String(sub.answers.B1),
      b5: (sub.answers.B5 as string) ?? null,
      b7: (sub.answers.B7 as string) ?? null,
      b10: (sub.answers.B10 as string) ?? null,
      b11: (sub.answers.B11 as string) ?? null,
      b12: (sub.answers.B12 as string) ?? null,
    });
    const names = await loadReviewerNames(
      supabase,
      [applicant.review.first?.by, applicant.review.second?.by].filter((x): x is string => Boolean(x)),
    );
    scoring = (
      <SelectionPanel
        applicant={applicant}
        discard={discardReasons(applicant, ageRangeOf(def))}
        me={user.id}
        names={names}
        locked={campaign.status === "archived"}
        qs={qs}
        nextId={nextId}
        gradeFirst={gradeSubmission.bind(null, id, submissionId, "first")}
        gradeSecond={gradeSubmission.bind(null, id, submissionId, "second")}
        equipmentOn={setEquipmentSolved.bind(null, id, submissionId, true)}
        equipmentOff={setEquipmentSolved.bind(null, id, submissionId, false)}
      />
    );
  }

  // Consentimiento del tutor (solo menores): enlace personal y mensaje de WhatsApp.
  let consentPanel: React.ReactNode = null;
  if (sub.is_minor) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const status = consentStatus(consent);
    const link = consent && status === "pending" ? `${proto}://${host}/consentimiento/${consent.token}` : null;
    const consentBody = templatesRes.data?.find((t) => t.key === "guardian_consent")?.body;
    const consentMessage = consentBody && link ? renderTemplate(consentBody, { ...vars, enlace_consentimiento: link }) : null;
    consentPanel = (
      <GuardianConsentPanel
        submissionId={submissionId}
        status={status}
        record={consent}
        link={link}
        whatsapp={
          link
            ? {
                url: consentMessage && guardianNumber?.digits ? whatsappUrl(guardianNumber.digits, consentMessage) : null,
                to: guardianNumber?.digits ?? null,
                guardianName,
              }
            : null
        }
        locked={campaign.status === "archived"}
        qs={qs}
        requestAction={requestConsent.bind(null, id, submissionId)}
        resetAction={resetConsent.bind(null, id, submissionId)}
        revokeAction={revokeConsent.bind(null, id, submissionId)}
      />
    );
  }

  const reviewAction = reviewSubmission.bind(null, id, submissionId);
  const notesAction = saveNotes.bind(null, id, submissionId);

  return (
    <SubmissionReview
      campaignId={id}
      campaignName={campaign.name}
      qs={qs}
      ok={sp.ok}
      error={sp.error}
      definitionMissing={!def}
      sub={sub}
      person={person}
      guardian={guardianNumber ? { number: guardianNumber, name: guardianName } : null}
      sections={sections}
      events={events.map((e) => ({ ...e, authorName: authorName(e.created_by) }))}
      position={{ prevId, nextId, index: at, total: ids.length }}
      whatsapp={{ template: templateKey ?? null, firstName: vars.nombre, message, personUrl, guardianUrl }}
      extra={
        <>
          {consentPanel}
          {scoring}
        </>
      }
      reviewAction={reviewAction}
      notesAction={notesAction}
    />
  );
}
