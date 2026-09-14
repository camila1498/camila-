export type Initiative = {
  tag: string;
  label: string;
  description: string;
};

/** Sección "Iniciativas" de home. */
export const initiatives: Initiative[] = [
  {
    tag: "CEP",
    label: "Community Engagement Project",
    description:
      "Programa de educación STEM para niñas en colegios públicos de Lima, construido en alianza con distintas UGELs para llegar a más escuelas cada año.",
  },
  {
    tag: "EmpleaLab",
    label: "Mentorías + empleabilidad",
    description:
      "Nuestra iniciativa de mentorías enfocada en preparar a las chicas para su siguiente paso profesional, con workshops nuevos cada año.",
  },
  {
    tag: "CreateWomen",
    label: "Programa insignia",
    description:
      "El programa que reúne lo mejor de la formación en IA y diseño de producto de CreateLatam para mujeres jóvenes de la región.",
  },
];
