export type ProgramSubCard = {
  tag: string;
  label: string;
  text: string;
};

export type ProgramPillar = {
  num: string;
  title: string;
  /** Texto corto usado en la tarjeta de home. */
  shortDescription: string;
  /** Texto más largo usado en el detalle de /programas. */
  longDescription: string;
  /** Solo el pilar de Eventos lo usa. */
  bullets?: string[];
  /** Mentorías y Programas de formación lo usan. */
  subCards?: ProgramSubCard[];
};

export const programPillars: ProgramPillar[] = [
  {
    num: "Pilar 01",
    title: "Eventos",
    shortDescription:
      "Charlas, talleres y bootcamps abiertos a la comunidad, con speakers internacionales que comparten cómo se ve trabajar hoy en IA y producto.",
    longDescription:
      "Charlas, talleres y bootcamps abiertos a la comunidad, con speakers internacionales que comparten cómo se ve trabajar hoy en IA, producto y STEM.",
    bullets: [
      "10+ speakers internacionales han pasado por nuestros eventos.",
      "Bootcamps prácticos junto a UGELs, pensados para acercar a más chicas a la tecnología.",
      "Talleres como el de Claude + Make para automatizar la búsqueda de becas.",
      "Encuentros presenciales de comunidad, como la reunión anual en PUCP.",
    ],
  },
  {
    num: "Pilar 02",
    title: "Mentorías",
    shortDescription:
      "Acompañamiento personalizado de profesionales del sector para que cada chica tenga a alguien guiando su siguiente paso.",
    longDescription:
      "Acompañamiento personalizado de profesionales del sector para que cada chica tenga a alguien guiando su siguiente paso.",
    subCards: [
      {
        tag: "EmpleaLab",
        label: "Mentorías + empleabilidad",
        text: "Nuestra iniciativa de mentorías enfocada en preparar a las chicas para su siguiente paso profesional, con un nuevo workshop planeado para este año.",
      },
    ],
  },
  {
    num: "Pilar 03",
    title: "Programas de formación",
    shortDescription:
      "Formaciones estructuradas de varias semanas en IA y diseño de producto, con proyectos reales y una comunidad que sostiene el proceso.",
    longDescription:
      "Formaciones estructuradas de varias semanas en IA, diseño de producto y STEM, con proyectos reales y una comunidad que sostiene el proceso hasta el final.",
    subCards: [
      {
        tag: "CEP",
        label: "Community Engagement Project",
        text: "Programa de educación STEM para niñas en colegios públicos de Lima, en alianza con distintas UGELs.",
      },
      {
        tag: "CreateWomen",
        label: "Programa insignia",
        text: "Reúne lo mejor de la formación en IA y diseño de producto de CreateLatam para mujeres jóvenes de la región.",
      },
    ],
  },
];
