export type TeamMember = {
  name: string;
  /** Área bajo la que se agrupa en /voluntarios, en el orden original de la maqueta. */
  area: string;
  /**
   * Subtítulo específico mostrado en el preview de home (solo las 4 primeras
   * personas lo tienen en la maqueta original — para el resto es igual a `area`
   * o simplemente no se muestra ahí).
   */
  role?: string;
};

export const teamAreasOrder = [
  "Dirección",
  "Impacto y datos",
  "Desarrollo",
  "Service Designer / Bootcamp",
  "Mentorías",
  "Comunicación & Feedback / Eventos",
  "Contenidos / Facilitación",
  "Cultura y Bienestar / Talento",
  "Legal",
  "Proyectos",
] as const;

export const teamMembers: TeamMember[] = [
  { name: "Camila Pacheco", area: "Dirección", role: "CEO" },
  { name: "Katiuska Mireya Choque Anccasi", area: "Dirección", role: "Dirección" },
  { name: "Marina Mejia Orihuela", area: "Dirección", role: "Seguimiento y Operaciones" },
  { name: "Emanuel Israel Rios Torres", area: "Impacto y datos", role: "Impacto y datos" },
  { name: "Gloria Noemi Hancco Sivincha", area: "Impacto y datos" },
  { name: "Juan Lucas Cotera Castro", area: "Desarrollo" },
  { name: "Florencia Acuña", area: "Service Designer / Bootcamp" },
  { name: "Lucia Victoria Villegas Guerrero", area: "Service Designer / Bootcamp" },
  { name: "Maria Rosa Gabriella Gutierrez Paredes", area: "Mentorías" },
  { name: "Milagros Areli Chumbimuni Mayo", area: "Comunicación & Feedback / Eventos" },
  { name: "Alexandra Nicole Vera Cevero", area: "Contenidos / Facilitación" },
  { name: "Rosa Marina Pari Villanueva", area: "Cultura y Bienestar / Talento" },
  { name: "Sofia Alejandra Miranda Batuani", area: "Cultura y Bienestar / Talento" },
  { name: "Deysi Belen Gomez Mamani", area: "Legal" },
  { name: "Lesly del Pilar Pacheco Chavarría", area: "Legal" },
  { name: "Ailen Estefanía Cando Martínez", area: "Proyectos" },
  { name: "Allison Nicole de la Cruz Velasquez", area: "Proyectos" },
  { name: "Danyela Milagros Bedoya Quispe", area: "Proyectos" },
  { name: "Nahil Nuria Solis Fernández", area: "Proyectos" },
  { name: "Nayr Jimena Oliveros Asayag", area: "Proyectos" },
  { name: "Olenka Andrea Martinez Mendoza", area: "Proyectos" },
];
