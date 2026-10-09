import { fieldsOf } from "./schema";
import type { Answers, Field, FormDefinition } from "./types";

export const STATUS_LABELS: Record<string, string> = {
  nueva: "Nueva",
  en_revision: "Pendiente",
  admitida: "Aprobada",
  lista_espera: "Lista de espera",
  descartada: "Descartada",
  confirmada: "Confirmada",
  retirada: "Retirada",
};

/** Estados que el equipo elige al revisar (las demás se usarán en fases posteriores). */
export const REVIEW_STATUSES = ["admitida", "lista_espera", "en_revision", "descartada"] as const;

export const statusClass = (status: string) =>
  ({
    nueva: "stNueva",
    en_revision: "stPendiente",
    admitida: "stAprobada",
    lista_espera: "stEspera",
    descartada: "stDescartada",
    confirmada: "stAprobada",
    retirada: "stDescartada",
  })[status] ?? "stNueva";

export function formatValue(field: Field, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) {
    return value.map((v) => optionLabel(field, String(v))).join(", ") || "—";
  }
  return optionLabel(field, String(value));
}

function optionLabel(field: Field, value: string) {
  if (field.type === "select" || field.type === "multiselect") {
    return field.options.find((o) => o.value === value)?.label ?? value;
  }
  return value;
}

export type AnswerRow = { id: string; label: string; value: string; sensitive: boolean; long: boolean };
export type AnswerSection = { title: string; rows: AnswerRow[] };

/**
 * Las respuestas con las preguntas de la versión con que se respondió (no la actual): sección por
 * sección, solo lo contestado, y al final cualquier dato que ya no esté en la definición.
 */
export function labeledAnswers(
  def: FormDefinition,
  answers: Answers,
  sensitive: Answers,
  /** Ids que ya se muestran en otra parte (p. ej. el bloque de contacto). */
  omit: string[] = [],
): AnswerSection[] {
  const seen = new Set<string>();
  const sections: AnswerSection[] = [];

  for (const section of def.sections) {
    const rows: AnswerRow[] = [];
    for (const field of section.fields) {
      const isSensitive = field.id in sensitive;
      const value = isSensitive ? sensitive[field.id] : answers[field.id];
      seen.add(field.id);
      if (omit.includes(field.id)) continue;
      if (value === undefined && field.type !== "checkbox") continue;
      rows.push({
        id: field.id,
        label: field.label,
        value: field.type === "checkbox" ? (value === true ? "Sí" : "No") : formatValue(field, value),
        sensitive: isSensitive || Boolean(field.sensitive),
        long: field.type === "textarea",
      });
    }
    if (rows.length) sections.push({ title: section.title ?? "", rows });
  }

  const extra = Object.entries({ ...answers, ...sensitive }).filter(([id]) => !seen.has(id));
  if (extra.length) {
    sections.push({
      title: "Otros datos",
      rows: extra.map(([id, v]) => ({ id, label: id, value: formatValue({ id, label: id, type: "text" }, v), sensitive: id in sensitive, long: false })),
    });
  }
  return sections;
}

/** Campo de WhatsApp de la madre/padre/tutor: un teléfono que solo aparece si la persona es menor. */
export function guardianPhoneId(def: FormDefinition): string | null {
  if (!def.minorField) return null;
  const f = fieldsOf(def).find(
    (x) => x.type === "tel" && x.showIf && "field" in x.showIf && x.showIf.field === def.minorField,
  );
  return f?.id ?? null;
}

export function guardianNameId(def: FormDefinition): string | null {
  if (!def.minorField) return null;
  const f = fieldsOf(def).find(
    (x) => x.type === "text" && x.showIf && "field" in x.showIf && x.showIf.field === def.minorField,
  );
  return f?.id ?? null;
}
