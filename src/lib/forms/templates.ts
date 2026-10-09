import type { Field, FormDefinition, Option } from "./types";

const options = (values: string[]): Option[] => values.map((v) => ({ value: v, label: v }));

const countries = [
  "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
  "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
  "República Dominicana", "Uruguay", "Venezuela", "Otro",
];

const sources = ["Instagram", "LinkedIn", "TikTok", "WhatsApp", "Colegio o UGEL", "Universidad", "Una amiga o amigo", "Otro"];

/** Datos de contacto y consentimiento: los necesita cualquier formulario (la base exige C1, C2 y C7). */
const contactFields: Field[] = [
  { id: "C1", type: "text", label: "Nombre y apellidos", required: true, locked: "core" },
  { id: "C2", type: "email", label: "Correo electrónico", required: true, locked: "core" },
  {
    id: "C3",
    type: "tel",
    label: "Número de WhatsApp (con código de país)",
    help: "Ejemplo: +51 999 999 999",
    required: true,
    locked: "core",
  },
  { id: "C4", type: "select", label: "País de residencia", required: true, locked: "core", options: options(countries) },
  { id: "C5", type: "text", label: "Ciudad o región", required: true },
  { id: "C6", type: "select", label: "¿Cómo te enteraste de esta convocatoria?", options: options(sources) },
];

const consentFields: Field[] = [
  {
    id: "C7",
    type: "checkbox",
    label: "He leído el aviso de privacidad y autorizo el tratamiento de mis datos para esta convocatoria",
    required: true,
    locked: "core",
  },
  { id: "C8", type: "checkbox", label: "Quiero recibir información de futuras convocatorias de CreateLatam" },
];

/** Formulario en blanco: contacto + una seccion vacia para las preguntas propias + consentimiento. */
export function blankDefinition(slug: string, title: string): FormDefinition {
  return {
    schemaVersion: 1,
    slug,
    version: 1,
    title,
    intro: "",
    submitLabel: "Enviar",
    sections: [
      { title: "Tus datos", fields: contactFields },
      { title: "Tus respuestas", fields: [] },
      { fields: consentFields },
    ],
    retention: "[por definir con Legal]",
  };
}

/**
 * Copia una definicion existente para un formulario nuevo. Se conservan las preguntas base, pero
 * se sueltan las opciones fijas (solo tenian sentido para el puntaje del Bootcamp) y se reinicia
 * la version.
 */
export function copyDefinition(source: FormDefinition, slug: string, title: string): FormDefinition {
  return {
    ...structuredClone(source),
    slug,
    title,
    version: 1,
    sections: structuredClone(source.sections).map((s) => ({
      ...s,
      fields: s.fields.map((f) => (f.locked === "options" ? { ...f, locked: undefined } : f)),
    })),
  };
}
