import type { Field } from "../types";
import { toOptions } from "./common";

/**
 * Pregunta "¿tienes menos de 18 años?" y bloque de madre/padre/tutor que se abre si es menor.
 * El tutor luego recibe un formulario de consentimiento aparte (no basta con que la menor marque algo).
 */
export function guardianFields(ids: {
  minor: string;
  name: string;
  relation: string;
  email: string;
  whatsapp: string;
}): Field[] {
  const isMinor = { field: ids.minor, equals: true } as const;
  return [
    { id: ids.minor, type: "boolean", label: "¿Tienes menos de 18 años?", required: true },
    {
      id: ids.name,
      type: "text",
      label: "Nombre de tu madre, padre o tutor",
      required: true,
      showIf: isMinor,
    },
    {
      id: ids.relation,
      type: "select",
      label: "Parentesco",
      required: true,
      showIf: isMinor,
      options: toOptions(["Madre", "Padre", "Tutor/a legal"]),
    },
    {
      id: ids.email,
      type: "email",
      label: "Correo de tu madre, padre o tutor",
      required: true,
      showIf: isMinor,
    },
    {
      id: ids.whatsapp,
      type: "tel",
      label: "WhatsApp de tu madre, padre o tutor (con código de país)",
      required: true,
      showIf: isMinor,
    },
  ];
}
