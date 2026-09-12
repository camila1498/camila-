export type Opportunity = {
  tag: string;
  meta: string;
  title: string;
  description: string;
};

/** Feed STEM de la sección "Oportunidades" de home. */
export const opportunities: Opportunity[] = [
  {
    tag: "STEM · Mujeres",
    meta: "Noruega · Deadline: 1 marzo",
    title: "EIDRA Women in Data Science Scholarship",
    description:
      "Beca STEM de BI Norwegian Business School para mujeres talentosas que cursen una maestría en Data Science for Business. Cubre matrícula completa hasta por dos años.",
  },
  {
    tag: "STEM",
    meta: "Países Bajos · Abre marzo 2026",
    title: "ASML Technology Scholarships",
    description:
      "Beca STEM para hasta 40 estudiantes destacados de maestrías técnicas en Países Bajos. €5,000 anuales por dos años, mentoría y desarrollo profesional incluidos.",
  },
  {
    tag: "STEM · Data",
    meta: "Tras admisión al programa",
    title: "Data for Good Scholarship",
    description:
      "Beca STEM para estudiantes apasionadas por usar ciencia de datos para el bien social — pobreza, desigualdad y políticas públicas basadas en evidencia.",
  },
  {
    tag: "STEM · Tech",
    meta: "Europa",
    title: "EIT Digital Master School",
    description:
      "Programas STEM en Autonomous Systems, Cloud and Networking, Emotion AI, Embedded Systems, Fintech y Human-Computer Interaction.",
  },
];
