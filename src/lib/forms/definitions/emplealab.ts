import type { FormDefinition } from "../types";
import { consentFields, contactFields, toOptions } from "./common";

export const emplealab: FormDefinition = {
  slug: "emplealab",
  version: 1,
  title: "Mentee de EmpleaLab",
  intro:
    "Para universitarias/os y egresadas/os que buscan su primer empleo o prácticas. Solo mayores de 18 años.",
  submitLabel: "Enviar mi postulación",
  retention:
    "Si no eres seleccionada/o, 6 meses desde el cierre de la convocatoria (12 si quedas en lista de espera). Si participas, 2 años desde el fin del programa y luego se anonimizan.",
  sections: [
    { title: "Tus datos", fields: contactFields() },
    {
      title: "Tu situación",
      fields: [
        { id: "E1", type: "number", label: "Edad", required: true, min: 18, max: 99 },
        {
          id: "E2",
          type: "select",
          label: "Situación académica",
          required: true,
          options: toOptions(["Estudiante de últimos ciclos", "Egresada/o", "Bachiller", "Titulada/o"]),
        },
        { id: "E3", type: "text", label: "Universidad o instituto", required: true },
        { id: "E4", type: "text", label: "Carrera", required: true },
        {
          id: "E5",
          type: "select",
          label: "Situación laboral actual",
          required: true,
          options: toOptions([
            "Busco mi primer empleo",
            "Busco prácticas",
            "Trabajo fuera de mi área",
            "Estoy sin empleo tras una experiencia previa",
          ]),
        },
        {
          id: "E6",
          type: "select",
          label: "¿Hace cuánto estás buscando?",
          required: true,
          options: toOptions(["Menos de 3 meses", "3 a 6 meses", "6 a 12 meses", "Más de 12 meses"]),
        },
        {
          id: "E7",
          type: "multiselect",
          label: "¿En qué área buscas trabajo?",
          required: true,
          options: toOptions([
            "Diseño UX o de producto",
            "Datos",
            "Desarrollo",
            "Marketing digital",
            "Gestión o negocios",
            "Otro",
          ]),
        },
      ],
    },
    {
      title: "Qué buscas en la mentoría",
      fields: [
        {
          id: "E8",
          type: "multiselect",
          label: "¿Con qué necesitas más ayuda?",
          help: "Elige hasta 2.",
          required: true,
          max: 2,
          options: toOptions(["CV", "LinkedIn", "Entrevistas", "Portafolio", "Saber qué rol buscar", "Networking"]),
        },
        { id: "E9", type: "textarea", label: "¿Qué te gustaría lograr con la mentoría?", required: true },
        {
          id: "E10",
          type: "select",
          label: "¿Puedes asistir a las sesiones del 26 al 30 de diciembre de 2026?",
          required: true,
          options: toOptions(["Sí", "Parcialmente", "No"]),
        },
        { id: "E11", type: "url", label: "LinkedIn" },
        {
          id: "E12",
          type: "url",
          label: "Enlace a tu CV en PDF",
          help: "Súbelo a Google Drive y comparte el enlace con permiso de lectura.",
        },
      ],
    },
    { fields: consentFields },
  ],
};
