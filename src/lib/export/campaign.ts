import { fieldsOf } from "@/lib/forms/schema";
import type { Answers, Field, FormDefinition } from "@/lib/forms/types";
import { STATUS_LABELS } from "@/lib/forms/review";

export type ExportMode = "completo" | "anonimo";

export type ExportRow = {
  full_name: string;
  email: string;
  status: string;
  is_minor: boolean;
  consent_marketing: boolean;
  notes: string | null;
  created_at: string;
  answers: Answers;
  sensitive: Answers;
  /** Solo en el modo completo: respuesta del tutor (menores). */
  consent?: { guardian_name: string | null; relationship: string | null; data_consent: boolean | null; image_consent: boolean | null; responded_at: string | null; revoked_at: string | null } | null;
};

/** Tipos que pueden identificar a alguien (texto libre, contacto): fuera del modo anonimizado. */
const IDENTIFYING = new Set(["text", "textarea", "email", "tel", "url"]);

const yesNo = (v: boolean) => (v ? "Sí" : "No");

function consentLabel(r: ExportRow): string {
  if (!r.is_minor) return "No aplica";
  const c = r.consent;
  if (!c || !c.responded_at) return "Pendiente";
  if (c.revoked_at) return "Revocado";
  return c.data_consent ? "Autorizó" : "No autorizó";
}

function limaParts(iso: string) {
  const d = new Date(Date.parse(iso) - 5 * 60 * 60 * 1000); // Lima es UTC-5 todo el año
  return d.toISOString();
}

function cell(field: Field, value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return yesNo(value);
  const label = (v: string) =>
    field.type === "select" || field.type === "multiselect" ? (field.options.find((o) => o.value === v)?.label ?? v) : v;
  if (Array.isArray(value)) return value.map((v) => label(String(v))).join(" | ");
  return label(String(value));
}

/** Los campos que entran al archivo, en el orden del formulario de esa campaña. */
export function exportFields(def: FormDefinition, mode: ExportMode): Field[] {
  return fieldsOf(def).filter((f) => mode === "completo" || (!f.sensitive && !IDENTIFYING.has(f.type)));
}

/**
 * Tabla lista para CSV. Cada columna de pregunta se rotula "Pregunta (id)": el id es estable entre
 * campañas, así se pueden unir archivos de ediciones distintas aunque el texto haya cambiado.
 * El modo anonimizado quita nombre, correo, notas, texto libre y datos sensibles, usa un número
 * correlativo en vez del identificador y deja solo el mes de recepción.
 */
export function buildExport(def: FormDefinition, rows: ExportRow[], mode: ExportMode): string[][] {
  const fields = exportFields(def, mode);
  const known = new Set(fieldsOf(def).map((f) => f.id));
  // Datos de ids que ya no están en la definición (solo en el archivo completo, para no perderlos).
  const extra =
    mode === "completo"
      ? [...new Set(rows.flatMap((r) => [...Object.keys(r.answers), ...Object.keys(r.sensitive)]).values())].filter((id) => !known.has(id)).sort()
      : [];

  const header =
    mode === "completo"
      ? ["Recibida (Lima)", "Estado", "Menor de edad", "Acepta comunicaciones", "Nombre", "Correo", "Notas internas", "Consentimiento del tutor", "Tutor que respondió", "Uso de imagen autorizado"]
      : ["N°", "Mes de recepción", "Estado", "Menor de edad", "Acepta comunicaciones"];
  header.push(...fields.map((f) => `${f.label} (${f.id})`), ...extra.map((id) => `Dato antiguo (${id})`));

  const body = rows.map((r, i) => {
    const iso = limaParts(r.created_at);
    const base =
      mode === "completo"
        ? [
            `${iso.slice(0, 10)} ${iso.slice(11, 16)}`,
            STATUS_LABELS[r.status] ?? r.status,
            yesNo(r.is_minor),
            yesNo(r.consent_marketing),
            r.full_name,
            r.email,
            r.notes ?? "",
            consentLabel(r),
            r.consent?.guardian_name ? `${r.consent.guardian_name}${r.consent.relationship ? ` (${r.consent.relationship})` : ""}` : "",
            r.consent?.data_consent ? yesNo(Boolean(r.consent.image_consent) && !r.consent.revoked_at) : "",
          ]
        : [String(i + 1), iso.slice(0, 7), STATUS_LABELS[r.status] ?? r.status, yesNo(r.is_minor), yesNo(r.consent_marketing)];
    const values = fields.map((f) => cell(f, f.id in r.sensitive ? r.sensitive[f.id] : r.answers[f.id]));
    const old = extra.map((id) => {
      const v = id in r.sensitive ? r.sensitive[id] : r.answers[id];
      return Array.isArray(v) ? v.join(" | ") : v === undefined || v === null ? "" : typeof v === "boolean" ? yesNo(v) : String(v);
    });
    return [...base, ...values, ...old];
  });
  return [header, ...body];
}

export const exportFilename = (campaignName: string, mode: ExportMode, date = new Date()) => {
  const slug = campaignName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${slug || "campana"}-${mode}-${date.toISOString().slice(0, 10)}.csv`;
};
