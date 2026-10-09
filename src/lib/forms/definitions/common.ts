import type { Field } from "../types";

const countries = [
  "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
  "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
  "República Dominicana", "Uruguay", "Venezuela", "Otro",
];

const sources = [
  "Instagram", "LinkedIn", "TikTok", "WhatsApp", "Colegio o UGEL", "Universidad",
  "Una amiga o amigo", "Otro",
];

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

/** Bloque comun C1–C6 (datos de contacto). En Aliados describe a la persona de contacto. */
export function contactFields(forContact = false): Field[] {
  const who = forContact ? " de la persona de contacto" : "";
  return [
    { id: "C1", type: "text", label: `Nombre y apellidos${who}`, required: true },
    { id: "C2", type: "email", label: `Correo electrónico${who}`, required: true },
    {
      id: "C3",
      type: "tel",
      label: `Número de WhatsApp${who} (con código de país)`,
      help: "Ejemplo: +51 999 999 999",
      required: true,
    },
    { id: "C4", type: "select", label: "País de residencia", required: true, options: toOptions(countries) },
    { id: "C5", type: "text", label: "Ciudad o región", required: true },
    {
      id: "C6",
      type: "select",
      label: "¿Cómo te enteraste de esta convocatoria?",
      options: toOptions(sources),
    },
  ];
}

/** C7 (obligatoria) y C8 van separadas a proposito: finalidades distintas. */
export const consentFields: Field[] = [
  {
    id: "C7",
    type: "checkbox",
    label: "He leído el aviso de privacidad y autorizo el tratamiento de mis datos para esta convocatoria",
    required: true,
  },
  {
    id: "C8",
    type: "checkbox",
    label: "Quiero recibir información de futuras convocatorias de CreateLatam",
  },
];

export { toOptions };
