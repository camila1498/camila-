import { VOLUNTEER_FORM_URL } from "@/lib/constants";
import type { FormDefinition } from "../types";
import { consentFields, contactFields, toOptions } from "./common";

export const aliados: FormDefinition = {
  slug: "aliados",
  version: 1,
  title: "Aliados",
  intro:
    "Para empresas, ONG, universidades, colegios, UGEL, entidades públicas y personas. Los datos de contacto son los de la persona que nos escribe.",
  submitLabel: "Enviar propuesta",
  retention: "Mientras dure la relación y 2 años después.",
  legacyUrl: VOLUNTEER_FORM_URL,
  sections: [
    { title: "Persona de contacto", fields: contactFields(true) },
    {
      title: "Tu organización",
      fields: [
        { id: "A1", type: "text", label: "Nombre de la organización", required: true },
        {
          id: "A2",
          type: "select",
          label: "Tipo de organización",
          required: true,
          options: toOptions([
            "Empresa",
            "ONG o fundación",
            "Universidad o instituto",
            "Colegio o UGEL",
            "Entidad pública",
            "Comunidad tech",
            "Persona natural",
            "Otro",
          ]),
        },
        { id: "A3", type: "text", label: "Tu cargo", required: true },
        { id: "A4", type: "url", label: "Sitio web o LinkedIn de la organización" },
      ],
    },
    {
      title: "Tu propuesta",
      fields: [
        {
          id: "A5",
          type: "multiselect",
          label: "¿Cómo te gustaría aliarte?",
          required: true,
          options: toOptions([
            "Patrocinio o financiamiento",
            "Speakers o mentoras de tu equipo",
            "Espacio físico",
            "Difusión de convocatorias",
            "Becas o licencias de herramientas",
            "Equipos (laptops, datos móviles)",
            "Prácticas o empleo para egresadas",
            "Otro",
          ]),
        },
        {
          id: "A6",
          type: "multiselect",
          label: "¿Con qué programa?",
          required: true,
          options: toOptions(["Bootcamp CreateWomen", "EmpleaLab", "Eventos", "Aún no sé"]),
        },
        { id: "A7", type: "textarea", label: "Cuéntanos tu propuesta o idea" },
        {
          id: "A8",
          type: "select",
          label: "¿Cuándo te gustaría empezar?",
          options: toOptions(["Este año", "Primer trimestre 2027", "Por definir"]),
        },
      ],
    },
    { fields: consentFields },
  ],
};
