/**
 * Reglas de selección del Bootcamp (PDF «Formularios CreateLatam 2026», §6).
 *
 * 1. Descarte por elegibilidad: edad fuera de rango (B1), disponibilidad «No» (B10), o B8/B9 vacías o
 *    sin relación (lo marca quien revisa).
 * 2. Puntaje de 0 a 10: B5 pública 3, B7 (Nunca 2, Uno corto 1, Varios 0), B8 de 0 a 3 y B9 de 0 a 2
 *    a mano, y B10 «A la mayoría» resta 1.
 * 3. Se ordena de mayor a menor y se admite hasta llenar los cupos. Empate: gana quien postuló antes.
 *    Las siguientes, hasta el 20 % de los cupos, quedan en lista de espera.
 * 4. Las postulaciones a 1 punto del corte las revisa una segunda persona.
 * 5. Laptop e internet nunca descartan ni cambian el puntaje: solo dan etiquetas.
 *
 * Todo lo que depende de la respuesta (los puntos automáticos) se calcula aquí, al mostrar; la base solo
 * guarda lo que decide una persona (calificaciones y etiquetas manuales).
 */

export const WAITLIST_SHARE = 0.2;
/** Una postulación a esta distancia del corte (o menos) pide segunda revisión. */
export const SECOND_REVIEW_MARGIN = 1;

export const RUBRIC_B8 = [
  "Genérica",
  "Interés general",
  "Explica por qué y qué quiere lograr",
  "Lo conecta con una meta propia concreta",
] as const;
export const RUBRIC_B9 = ["Vago", "Problema claro", "Problema claro y quién lo sufre"] as const;

export type Grade = { b8: number; b9: number; offTopic: boolean; by: string; at: string };
export type ScoreReview = { first?: Grade; second?: Grade };

export type Applicant = {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  tags: string[];
  review: ScoreReview;
  B1?: number | null;
  B5?: string | null;
  B7?: string | null;
  B10?: string | null;
  B11?: string | null;
  B12?: string | null;
};

export type AutoScore = { B5: number; B7: number; B10: number; total: number };

export function autoScore(a: Pick<Applicant, "B5" | "B7" | "B10">): AutoScore {
  const B5 = a.B5 === "Pública" ? 3 : 0;
  const B7 = a.B7 === "Nunca" ? 2 : a.B7 === "Uno corto" ? 1 : 0;
  const B10 = a.B10 === "A la mayoría" ? -1 : 0;
  return { B5, B7, B10, total: B5 + B7 + B10 };
}

/**
 * Calificación manual vigente. Con segunda revisión, B8 y B9 son el promedio de las dos personas
 * (el PDF no dice cómo resolver una diferencia; el promedio es el supuesto más neutral).
 */
export function manualScore(review: ScoreReview): { b8: number; b9: number; reviews: 1 | 2 } | null {
  const { first, second } = review;
  if (!first) return null;
  if (!second) return { b8: first.b8, b9: first.b9, reviews: 1 };
  return { b8: (first.b8 + second.b8) / 2, b9: (first.b9 + second.b9) / 2, reviews: 2 };
}

export type DiscardReason = "edad" | "disponibilidad" | "sin-relacion";
export const DISCARD_LABELS: Record<DiscardReason, string> = {
  edad: "Edad fuera del rango",
  disponibilidad: "No puede asistir (B10 = No)",
  "sin-relacion": "B8 o B9 vacía o sin relación",
};

export function discardReasons(a: Applicant, ageRange: { min?: number; max?: number }): DiscardReason[] {
  const reasons: DiscardReason[] = [];
  if (typeof a.B1 === "number" && ((ageRange.min !== undefined && a.B1 < ageRange.min) || (ageRange.max !== undefined && a.B1 > ageRange.max))) {
    reasons.push("edad");
  }
  if (a.B10 === "No") reasons.push("disponibilidad");
  if (a.review.first?.offTopic || a.review.second?.offTopic) reasons.push("sin-relacion");
  return reasons;
}

/** Etiquetas que se calculan de las respuestas; no cambian el puntaje. */
export function equipmentTags(a: Pick<Applicant, "B11" | "B12" | "tags">): { needsEquipment: boolean; mobileData: boolean; equipmentSolved: boolean } {
  return {
    needsEquipment: a.B11 === "Solo celular" || a.B11 === "No" || a.B12 === "No tengo",
    mobileData: a.B12 === "Solo datos móviles",
    equipmentSolved: a.tags.includes("equipo-conseguido"),
  };
}

export type Proposal = "admitida" | "lista_espera" | "descartada";

export type Row = {
  applicant: Applicant;
  auto: AutoScore;
  manual: ReturnType<typeof manualScore>;
  /** Puntaje total (null mientras falte la calificación manual). */
  total: number | null;
  discard: DiscardReason[];
  proposal: Proposal | null;
  rank: number | null;
  secondReviewNeeded: boolean;
};

export type SelectionResult = {
  rows: Row[];
  capacity: number;
  waitlistSize: number;
  /** Puntaje de la última persona admitida (el corte), si hay más postulaciones que cupos. */
  cutoff: number | null;
  ungraded: number;
  secondReviewPending: number;
  discards: number;
};

/** Estados en los que una postulación sigue sin resolver y la selección puede decidirla. */
export const PENDING_STATUSES = ["nueva", "en_revision"];

export function buildSelection(applicants: Applicant[], capacity: number, ageRange: { min?: number; max?: number }): SelectionResult {
  const waitlistSize = Math.floor(capacity * WAITLIST_SHARE);

  const rows: Row[] = applicants.map((applicant) => {
    const auto = autoScore(applicant);
    const manual = manualScore(applicant.review);
    return {
      applicant,
      auto,
      manual,
      total: manual ? auto.total + manual.b8 + manual.b9 : null,
      discard: discardReasons(applicant, ageRange),
      proposal: null,
      rank: null,
      secondReviewNeeded: false,
    };
  });

  // Quienes ya se descartaron o se retiraron no ocupan lugar; los descartes por elegibilidad tampoco.
  const inRace = rows.filter((r) => r.discard.length === 0 && r.applicant.status !== "descartada" && r.applicant.status !== "retirada");
  const graded = inRace
    .filter((r): r is Row & { total: number } => r.total !== null)
    .sort((a, b) => b.total - a.total || Date.parse(a.applicant.createdAt) - Date.parse(b.applicant.createdAt));

  graded.forEach((r, i) => {
    r.rank = i + 1;
    r.proposal = i < capacity ? "admitida" : i < capacity + waitlistSize ? "lista_espera" : "descartada";
  });
  for (const r of rows) if (r.discard.length > 0 && r.applicant.status !== "descartada") r.proposal = "descartada";

  const cutoff = graded.length > capacity && capacity > 0 ? graded[capacity - 1]!.total : null;
  if (cutoff !== null) {
    for (const r of graded) {
      r.secondReviewNeeded = Math.abs(r.total - cutoff) <= SECOND_REVIEW_MARGIN;
    }
  }

  return {
    rows: [...rows].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9)),
    capacity,
    waitlistSize,
    cutoff,
    ungraded: inRace.filter((r) => r.total === null).length,
    secondReviewPending: graded.filter((r) => r.secondReviewNeeded && !r.applicant.review.second).length,
    discards: rows.filter((r) => r.discard.length > 0 && r.applicant.status !== "descartada").length,
  };
}

/** Qué ids pasan a cada estado al aplicar la propuesta (solo las que siguen sin resolver). */
export function selectionTargets(result: SelectionResult) {
  const pick = (p: Proposal) =>
    result.rows.filter((r) => r.proposal === p && PENDING_STATUSES.includes(r.applicant.status)).map((r) => r.applicant.id);
  return { admit: pick("admitida"), wait: pick("lista_espera"), discard: pick("descartada") };
}
