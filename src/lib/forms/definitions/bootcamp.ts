import { programRules } from "../config";
import type { FormDefinition } from "../types";
import { consentFields, contactFields, toOptions } from "./common";
import { guardianFields } from "./guardian";

const schedule = programRules.bootcampSchedule.trim() || "[horario por confirmar]";

export const bootcamp: FormDefinition = {
  slug: "bootcamp",
  version: 1,
  title: "Postulación al Bootcamp 2026",
  intro: `Bootcamp ${programRules.bootcampDates}. Las preguntas de motivación y disponibilidad nos ayudan a priorizar; la falta de laptop o internet nunca te descarta.`,
  submitLabel: "Enviar mi postulación",
  retention:
    "Si no eres seleccionada, 6 meses desde el cierre de la convocatoria (12 si quedas en lista de espera). Si participas, 2 años desde el fin del programa y luego se anonimizan.",
  minorField: "B14",
  sections: [
    { title: "Tus datos", fields: contactFields() },
    {
      title: "Sobre ti",
      fields: [
        {
          id: "B1",
          type: "number",
          label: "Edad",
          required: true,
          min: programRules.age.min,
          max: programRules.age.max,
        },
        {
          id: "B2",
          type: "select",
          label: "¿Con qué género te identificas?",
          help: "Lo preguntamos porque el programa es para mujeres.",
          required: true,
          options: toOptions(["Mujer", "No binaria", "Otro", "Prefiero no decir"]),
        },
        {
          id: "B3",
          type: "select",
          label: "Nivel educativo actual",
          required: true,
          options: toOptions(["Secundaria (3.º a 5.º)", "Instituto", "Universidad", "Egresada"]),
        },
        { id: "B4", type: "text", label: "Nombre del colegio, instituto o universidad", required: true },
        {
          id: "B5",
          type: "select",
          label: "Tu institución es…",
          help: "Lo preguntamos porque el programa prioriza instituciones públicas.",
          required: true,
          options: toOptions(["Pública", "Privada"]),
        },
        { id: "B6", type: "text", label: "Grado, año o ciclo", required: true },
        {
          id: "B7",
          type: "select",
          label: "¿Has llevado algún curso de tecnología, programación o diseño?",
          required: true,
          options: toOptions(["Nunca", "Uno corto", "Varios"]),
        },
      ],
    },
    {
      title: "Tu motivación",
      fields: [
        {
          id: "B8",
          type: "textarea",
          label: "¿Por qué quieres participar en el Bootcamp?",
          help: "Entre 80 y 200 palabras.",
          required: true,
          minWords: 80,
          maxWords: 200,
        },
        {
          id: "B9",
          type: "textarea",
          label: "Cuéntanos un problema de tu comunidad que te gustaría resolver con tecnología",
          required: true,
        },
      ],
    },
    {
      title: "Disponibilidad y equipo",
      fields: [
        {
          id: "B10",
          type: "select",
          label: `¿Puedes asistir a todas las sesiones ${programRules.bootcampDates}, de ${schedule}?`,
          required: true,
          options: [
            { value: "Sí, a todas", label: "Sí, a todas" },
            { value: "A la mayoría", label: "A la mayoría (puedo faltar a 1 o 2)" },
            { value: "No", label: "No" },
          ],
        },
        {
          id: "B11",
          type: "select",
          label: "¿Tendrás una laptop o computadora durante el Bootcamp?",
          help: "No te descarta: si no tienes, buscamos cómo conseguirte una.",
          required: true,
          options: toOptions(["Sí, propia", "Sí, compartida o prestada", "Solo celular", "No"]),
        },
        {
          id: "B12",
          type: "select",
          label: "¿Qué conexión a internet tendrás?",
          help: "No te descarta: si no tienes, buscamos cómo apoyarte.",
          required: true,
          options: toOptions(["Wifi estable en casa", "Solo datos móviles", "Cabina o lugar público", "No tengo"]),
        },
        {
          id: "B13",
          type: "textarea",
          label: "¿Hay algo que debamos saber para que puedas participar?",
          help: "Opcional. Solo la líder del Bootcamp podrá leer esta respuesta.",
          sensitive: true,
        },
      ],
    },
    {
      title: "Menores de edad",
      fields: [
        ...guardianFields({
          minor: "B14",
          name: "B15",
          relation: "B16",
          email: "B17_email",
          whatsapp: "B17_whatsapp",
        }),
        {
          id: "B18",
          type: "boolean",
          label: "¿Autorizas que aparezcas en fotos y videos de difusión de CreateLatam?",
          help: "Cualquier respuesta es válida y no afecta tu postulación.",
          required: true,
        },
      ],
    },
    { fields: consentFields },
  ],
};
