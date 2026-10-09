export type Program = {
  slug: string;
  title: string;
  label: string;
  summary: string;
  description: string;
  highlights: string[];
  /** Postulación propia del programa (ruta interna) y el texto del botón. */
  applyHref?: string;
  applyLabel?: string;
};

export const programs: Program[] = [
  {
    slug: "emplealab",
    title: "EmpleaLab",
    label: "Mentorías + empleabilidad",
    summary:
      "Mentorías enfocadas en preparar a las chicas para su siguiente paso profesional.",
    description:
      "Nuestra iniciativa de mentorías enfocada en preparar a las chicas para su siguiente paso profesional, con un nuevo workshop planeado para este año. Cada chica cuenta con acompañamiento personalizado de profesionales del sector.",
    highlights: [
      "Acompañamiento personalizado de profesionales del sector.",
      "Orientación para el siguiente paso profesional y de empleabilidad.",
      "Workshops nuevos cada año.",
    ],
    applyHref: "/programas/emplealab/postular",
    applyLabel: "Postular como mentee",
  },
  {
    slug: "createwomen",
    title: "CreateWomen",
    label: "Programa insignia",
    summary:
      "Formación en IA y diseño de producto para mujeres jóvenes de la región.",
    description:
      "Reúne lo mejor de la formación en IA y diseño de producto de CreateLatam para mujeres jóvenes de la región: formaciones estructuradas de varias semanas, con proyectos reales y una comunidad que sostiene el proceso hasta el final.",
    highlights: [
      "Formaciones de varias semanas en IA, diseño de producto y STEM.",
      "Proyectos reales y feedback de mentores.",
      "90% de tasa de finalización en nuestros programas.",
    ],
    applyHref: "/programas/createwomen/postular",
    applyLabel: "Postular como mentee",
  },
  {
    slug: "eventos",
    title: "Eventos",
    label: "Charlas, talleres y bootcamps",
    summary:
      "Charlas, talleres y bootcamps abiertos a la comunidad con speakers internacionales.",
    description:
      "Charlas, talleres y bootcamps abiertos a la comunidad, con speakers internacionales que comparten cómo se ve trabajar hoy en IA, producto y STEM.",
    highlights: [
      "10+ speakers internacionales han pasado por nuestros eventos.",
      "Bootcamps prácticos junto a UGELs, pensados para acercar a más chicas a la tecnología.",
      "Talleres como el de Claude + Make para automatizar la búsqueda de becas.",
      "Encuentros presenciales de comunidad, como la reunión anual en PUCP.",
    ],
  },
];

export function getProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
