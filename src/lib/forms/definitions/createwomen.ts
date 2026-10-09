import { BOOTCAMP_WAITLIST_URL } from "@/lib/constants";
import { programRules } from "../config";
import type { FormDefinition } from "../types";
import { consentFields, contactFields, toOptions } from "./common";
import { guardianFields } from "./guardian";

export const createwomen: FormDefinition = {
  slug: "createwomen",
  version: 1,
  title: "Mentee de CreateWomen",
  intro:
    "Para chicas que quieren una mentora en tecnología. Si tienes menos de 18 años, te pediremos los datos de tu madre, padre o tutor.",
  submitLabel: "Enviar mi postulación",
  retention:
    "Si no eres seleccionada, 6 meses desde el cierre de la convocatoria (12 si quedas en lista de espera). Si participas, 2 años desde el fin del programa y luego se anonimizan.",
  legacyUrl: BOOTCAMP_WAITLIST_URL,
  minorField: "W10",
  sections: [
    { title: "Tus datos", fields: contactFields() },
    {
      title: "Sobre ti",
      fields: [
        {
          id: "W1",
          type: "number",
          label: "Edad",
          required: true,
          min: programRules.age.min,
          max: programRules.age.max,
        },
        {
          id: "W2",
          type: "select",
          label: "¿Con qué género te identificas?",
          help: "Lo preguntamos porque el programa es para mujeres.",
          required: true,
          options: toOptions(["Mujer", "No binaria", "Otro", "Prefiero no decir"]),
        },
        {
          id: "W3",
          type: "select",
          label: "Nivel educativo actual",
          required: true,
          options: toOptions(["Secundaria (3.º a 5.º)", "Instituto", "Universidad", "Egresada"]),
        },
        { id: "W4", type: "text", label: "Nombre del colegio, instituto o universidad", required: true },
        {
          id: "W5",
          type: "select",
          label: "Tu institución es…",
          help: "Lo preguntamos porque el programa prioriza instituciones públicas.",
          required: true,
          options: toOptions(["Pública", "Privada"]),
        },
      ],
    },
    {
      title: "Tu mentoría",
      fields: [
        {
          id: "W6",
          type: "multiselect",
          label: "¿Qué área de tecnología te interesa?",
          required: true,
          options: toOptions([
            "Inteligencia artificial",
            "Diseño de producto o UX",
            "Programación",
            "Datos",
            "Emprendimiento tech",
            "Aún no sé",
          ]),
        },
        { id: "W7", type: "textarea", label: "¿Qué te gustaría lograr con tu mentora?", required: true },
        {
          id: "W8",
          type: "select",
          label: "Modalidad preferida",
          options: toOptions(["Virtual", "Presencial en Lima", "Me da igual"]),
        },
        {
          id: "W9",
          type: "multiselect",
          label: "Horario preferido",
          required: true,
          options: toOptions(["Mañana", "Tarde", "Noche", "Fines de semana"]),
        },
      ],
    },
    {
      title: "Menores de edad",
      fields: guardianFields({
        minor: "W10",
        name: "W11",
        relation: "W12",
        email: "W13_email",
        whatsapp: "W13_whatsapp",
      }),
    },
    { fields: consentFields },
  ],
};
