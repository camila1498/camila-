export type BecaTagVariant = "default" | "stem" | "liderazgo" | "europa";

export type Beca = {
  id: string;
  label: string;
  tagVariant: BecaTagVariant;
  estado: string;
  title: string;
  institution: string;
  description: string;
  deadline: string;
  tags: string[];
  /** Posición en "Rankeadas" (1 = mejor). Sin rank = solo aparece en Database. */
  rank?: number;
};

export const becaFilters: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "erasmus", label: "Erasmus Mundus" },
  { value: "alemania", label: "Alemania" },
  { value: "paises-bajos", label: "Países Bajos" },
  { value: "stem", label: "STEM" },
  { value: "completa", label: "Financiada 100%" },
];

/** Becas con ranking asignado por el equipo, ordenadas de mejor a peor. */
export function getRankeadas(becas: Beca[]) {
  return becas
    .filter((beca): beca is Beca & { rank: number } => beca.rank !== undefined)
    .sort((a, b) => a.rank - b.rank);
}
