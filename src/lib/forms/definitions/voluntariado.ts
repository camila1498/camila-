import { VOLUNTEER_FORM_URL } from "@/lib/constants";
import type { FormDefinition } from "../types";
import { consentFields, contactFields, toOptions } from "./common";

const leaderRoles = [
  "Líder de Marketing",
  "Líder de Talento",
  "Líder de Seguimiento y Operaciones",
  "Líder de Bootcamp",
  "Líder de Mentorías EmpleaLab",
];

export const voluntariado: FormDefinition = {
  slug: "voluntariado",
  version: 1,
  title: "Voluntariado",
  intro:
    "Para líderes de área, mentoras, speakers y apoyo general. Solo mayores de 18 años, porque trabajamos con adolescentes.",
  submitLabel: "Enviar mi postulación",
  retention: "Mientras dure tu voluntariado y 1 año después.",
  legacyUrl: VOLUNTEER_FORM_URL,
  endIf: {
    condition: { field: "V1", equals: false },
    message:
      "Este formulario es solo para mayores de 18 años, porque el voluntariado trabaja con adolescentes. ¡Gracias por tu interés! Escríbenos y buscamos otra forma de sumarte.",
  },
  sections: [
    {
      fields: [{ id: "V1", type: "boolean", label: "¿Tienes 18 años o más?", required: true }],
    },
    {
      title: "Tus datos",
      fields: contactFields(),
    },
    {
      title: "Tu perfil",
      fields: [
        {
          id: "V2",
          type: "select",
          label: "¿Cuál es tu ocupación actual?",
          required: true,
          options: toOptions([
            "Estudiante universitaria/o",
            "Trabajo a tiempo completo",
            "Trabajo independiente",
            "Buscando empleo",
            "Otro",
          ]),
        },
        { id: "V3", type: "text", label: "Universidad o empresa" },
        { id: "V4", type: "text", label: "Carrera o profesión", required: true },
        {
          id: "V5",
          type: "multiselect",
          label: "¿En qué rol te gustaría sumarte?",
          required: true,
          options: toOptions([
            ...leaderRoles,
            "Mentora/mentor",
            "Speaker o facilitadora",
            "Voluntaria/o de apoyo",
          ]),
        },
        {
          id: "V6",
          type: "textarea",
          label: "¿Por qué quieres ser parte de CreateLatam?",
          help: "Máximo 150 palabras.",
          required: true,
          maxWords: 150,
        },
        {
          id: "V7",
          type: "textarea",
          label: "Cuéntanos un proyecto que sacaste adelante y qué hiciste tú",
          required: true,
          showIf: { field: "V5", includesAny: leaderRoles },
        },
      ],
    },
    {
      title: "Disponibilidad",
      fields: [
        {
          id: "V8",
          type: "select",
          label: "¿Cuántas horas a la semana puedes dedicar?",
          required: true,
          options: toOptions(["1 a 2", "3 a 5", "6 o más"]),
        },
        {
          id: "V9",
          type: "select",
          label: "¿Podrás apoyar durante el Bootcamp (14 al 23 de diciembre de 2026)?",
          options: toOptions(["Sí", "Parcialmente", "No"]),
        },
        { id: "V10", type: "boolean", label: "¿Has trabajado antes con adolescentes?", required: true },
        { id: "V11", type: "url", label: "LinkedIn o portafolio" },
        {
          id: "V12",
          type: "checkbox",
          label:
            "Me comprometo a cumplir el código de conducta y la política de protección de menores de CreateLatam",
          required: true,
        },
      ],
    },
    { fields: consentFields },
  ],
};
