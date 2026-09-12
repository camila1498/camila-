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
};

/**
 * Lista canónica de becas del "Dashboard de Becas". La maqueta original tenía esta
 * misma lista duplicada (con distinto tamaño y datos parcialmente desincronizados)
 * en becas.html y en el modal de index.html — se usa becas.html como fuente porque
 * es la más completa ("50+ oportunidades").
 */
export const becas: Beca[] = [
  {
    id: "clide",
    label: "Liderazgo Digital",
    tagVariant: "liderazgo",
    estado: "● Abierta",
    title: "Erasmus Mundus CLIDE — Liderazgo Intercultural en la Era Digital",
    institution: "Universidad de Granada · Europa",
    description:
      "Maestría completamente financiada en liderazgo intercultural y habilidades digitales para entornos multiculturales. Perfecta para perfiles de impacto social y diversidad.",
    deadline: "📅 Convocatoria 2027",
    tags: ["erasmus", "europa", "completa", "liderazgo"],
  },
  {
    id: "sdsi",
    label: "Service Design",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "Erasmus Mundus SDSI — Service Design, Strategies & Innovations",
    institution: "Letonia, Finlandia, Estonia · Europa",
    description:
      "2 años en Service Design, Innovation y Leadership. Combina diseño, negocios, tecnología y ciencias sociales. Completamente financiada. Abre octubre 2026.",
    deadline: "📅 Convocatoria 2027 · abre oct. 2026",
    tags: ["erasmus", "europa", "completa", "stem"],
  },
  {
    id: "emmie",
    label: "Impacto Social",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Erasmus Mundus EMMIE — Master in Impact Entrepreneurship",
    institution: "Europa · €1,400/mes",
    description:
      "Completamente financiada en emprendimiento de impacto social. Cubre matrícula, €1,400/mes, viaje, visa y seguro. Deadline: 31 enero 2027.",
    deadline: "📅 31 enero 2027",
    tags: ["erasmus", "europa", "completa", "innovacion"],
  },
  {
    id: "global-minds",
    label: "Movilidad e Inclusión",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Erasmus Mundus Global MINDS — Psychology, Mobility, Inclusion & Diversity",
    institution: "Múltiples países europeos",
    description:
      "Maestría en Psicología de la Movilidad Global, Inclusión y Diversidad. Completamente financiada. Enfoque en equidad de género e inclusión social.",
    deadline: "📅 Convocatoria 2027 · abre oct. 2026",
    tags: ["erasmus", "europa", "completa"],
  },
  {
    id: "noha",
    label: "Humanitaria",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Erasmus Mundus NOHA — International Humanitarian Action",
    institution: "Europa · Completamente financiada",
    description:
      "Maestría en Acción Humanitaria Internacional. Prepara para trabajo humanitario, gestión de crisis y cooperación internacional. Financiada al 100%.",
    deadline: "📅 Convocatoria 2027",
    tags: ["erasmus", "europa", "completa"],
  },
  {
    id: "eidra",
    label: "STEM · Mujeres",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "EIDRA Women in Data Science Scholarship",
    institution: "BI Norwegian Business School · Noruega",
    description:
      "Para mujeres talentosas cursando MSc en Data Science for Business. Cubre matrícula completa hasta dos años. GPA mínimo 4.0. Deadline: 1 marzo.",
    deadline: "📅 1 marzo",
    tags: ["stem", "mujeres", "paises-bajos"],
  },
  {
    id: "asml",
    label: "STEM",
    tagVariant: "stem",
    estado: "● Abre marzo 2026",
    title: "ASML Technology Scholarships",
    institution: "Países Bajos · €5,000/año",
    description:
      "Hasta 40 becas para maestrías técnicas. €5,000 anuales por dos años + mentoría + desarrollo profesional. GPA mínimo 7.50. Abre marzo 2026.",
    deadline: "📅 Abre marzo 2026",
    tags: ["stem", "paises-bajos"],
  },
  {
    id: "fes",
    label: "Justicia Social",
    tagVariant: "liderazgo",
    estado: "● Abierta",
    title: "Friedrich Ebert Foundation (FES) Scholarship",
    institution: "Alemania · €934/mes",
    description:
      "Para estudiantes con compromiso social y político progresista: democracia, justicia social, paz. Para maestrías en Alemania. €934/mes + apoyo.",
    deadline: "📅 Convocatoria anual",
    tags: ["alemania", "completa", "liderazgo"],
  },
  {
    id: "boll",
    label: "Democracia",
    tagVariant: "liderazgo",
    estado: "● Abierta",
    title: "Heinrich Böll Foundation Scholarship",
    institution: "Alemania · €934/mes",
    description:
      "Para estudiantes con valores verdes: democracia, sostenibilidad, justicia social, equidad de género. Hasta €934/mes + seguro médico.",
    deadline: "📅 Convocatoria anual",
    tags: ["alemania", "liderazgo"],
  },
  {
    id: "kas",
    label: "Democracia",
    tagVariant: "liderazgo",
    estado: "● Abierta",
    title: "Konrad Adenauer Foundation (KAS) Scholarship",
    institution: "Alemania · Estipendio mensual",
    description:
      "Para estudiantes con valores de democracia, estado de derecho y economía social. Maestrías en Alemania. Estipendio mensual + seguro + red alumni global.",
    deadline: "📅 Varias convocatorias al año",
    tags: ["alemania", "liderazgo"],
  },
  {
    id: "daad-epos",
    label: "Desarrollo",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "DAAD EPOS — Postgraduate Courses for Development",
    institution: "Alemania · €1,200/mes",
    description:
      "Peruanos elegibles ✅. Financia maestrías de desarrollo en Alemania. €1,200/mes + viaje + seguro. Temas: sostenibilidad, cooperación, gestión. Abre oct. 2026.",
    deadline: "📅 Convocatoria 2027 · abre oct. 2026",
    tags: ["alemania", "completa"],
  },
  {
    id: "okp",
    label: "Desarrollo",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Orange Knowledge Programme (OKP) — Nuffic",
    institution: "Países Bajos · Completamente financiada",
    description:
      "Peruanos elegibles ✅. Beca completa del gobierno holandés. Cubre matrícula, viaje, alojamiento, seguro y dietas. Requiere 2+ años de experiencia.",
    deadline: "📅 Convocatoria anual",
    tags: ["paises-bajos", "completa"],
  },
  {
    id: "beca-nl",
    label: "Países Bajos",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Beca NL — €5,000 para maestrías en Holanda",
    institution: "Países Bajos · €5,000",
    description:
      "€5,000 para estudiantes no-EEA que estudien una maestría en Países Bajos. Combinable con la Beca Radboud. Selección por mérito académico.",
    deadline: "📅 31 enero 2026",
    tags: ["paises-bajos"],
  },
  {
    id: "ges-plus",
    label: "Innovación",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "Groningen Excellence Scholarship (GES+)",
    institution: "U. de Groningen · €30,000",
    description:
      "€30,000 para no-EEA en programas de 2 años. Combinable con Beca NL (+€5,000). Innovation Management, Sustainable Entrepreneurship, Economic Development.",
    deadline: "📅 Convocatoria anual",
    tags: ["paises-bajos", "stem"],
  },
  {
    id: "tu-delft",
    label: "Diseño",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "TU Delft — Justus & Louise van Effen Excellence Scholarship",
    institution: "TU Delft · Países Bajos",
    description:
      "Para los mejores candidatos no-EEA. Programas: MSc Strategic Product Design, MSc Engineering and Policy Analysis, MSc Management of Technology.",
    deadline: "📅 Convocatoria anual",
    tags: ["paises-bajos", "stem"],
  },
  {
    id: "radboud-rei",
    label: "Países Bajos",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Radboud Excellence Initiative (REI)",
    institution: "U. Radboud · Países Bajos",
    description:
      "Para los mejores candidatos no-EEA. Public Administration, Social and Cultural Science, Political Science, Cognitive Neuroscience. Cubre matrícula.",
    deadline: "📅 31 enero 2026",
    tags: ["paises-bajos"],
  },
  {
    id: "vlir-uos",
    label: "Bélgica",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "VLIR-UOS Scholarship — Bélgica",
    institution: "KU Leuven / Ghent / Antwerp · Bélgica",
    description:
      "Peruanos elegibles ✅. Completamente financiada. Cubre matrícula, alojamiento, vuelos, seguro y diaria. Development Studies, Human Ecology, Social Work.",
    deadline: "📅 Enero-febrero (anual)",
    tags: ["europa"],
  },
  {
    id: "master-mind",
    label: "Bélgica",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Master Mind Scholarship — Flandes y Bruselas",
    institution: "Bélgica · €10,000 + matrícula",
    description:
      "€10,000 + exención de matrícula para estudiantes internacionales destacados. 30 becas disponibles. Selección por mérito, motivación y liderazgo.",
    deadline: "📅 15 enero 2026",
    tags: ["europa", "completa"],
  },
  {
    id: "eiffel",
    label: "Francia",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Eiffel Excellence Scholarship — Francia",
    institution: "Francia · €1,181/mes",
    description:
      "Peruanos elegibles ✅. €1,181/mes + matrícula + vuelos + seguro. Gestión, ciencias políticas, derecho, ingeniería. Convocatoria 2027 abre otoño 2026.",
    deadline: "📅 Convocatoria 2027",
    tags: ["europa"],
  },
  {
    id: "swiss-gov",
    label: "Suiza",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Swiss Government Excellence Scholarship",
    institution: "Suiza · CHF 1,920/mes",
    description:
      "Peruanos elegibles vía embajada suiza ✅. CHF 1,920/mes + matrícula. Convocatoria vía la Embajada de Suiza en Perú. Deadline habitual: octubre-noviembre.",
    deadline: "📅 Oct-nov (anual)",
    tags: ["europa"],
  },
  {
    id: "fundacion-carolina",
    label: "España",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Fundación Carolina — Becas Posgrado Iberoamérica",
    institution: "España · Matrícula + beca + seguro",
    description:
      "Peruanos elegibles ✅. Maestrías en universidades españolas. Cubre matrícula, beca mensual, seguro médico y apoyo para viaje. Cooperación e innovación.",
    deadline: "📅 Convocatoria 2026",
    tags: ["europa"],
  },
  {
    id: "esade",
    label: "Innovación",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "ESADE — Becas de Impacto Social (Barcelona)",
    institution: "ESADE Business School · Barcelona",
    description:
      "Social Impact Scholarship para candidatos con trayectoria de impacto comprobado. MSc Innovation & Entrepreneurship, MSc Marketing Management.",
    deadline: "📅 Convocatoria anual",
    tags: ["europa", "stem"],
  },
  {
    id: "ie-university",
    label: "Innovación",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "IE University — Future Generations Scholarship (Madrid)",
    institution: "IE University · Madrid",
    description:
      "Para agentes de cambio social. Master Design Innovation, Digital Business, Business Analytics & Big Data. Candidatas latinoamericanas muy bienvenidas.",
    deadline: "📅 Convocatoria anual",
    tags: ["europa", "stem"],
  },
  {
    id: "amsterdam-merit",
    label: "Data Science",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "Amsterdam Merit Scholarship — Data Science",
    institution: "U. de Amsterdam · Países Bajos",
    description:
      "Para estudiantes no-UE del MSc Data Science and Business Analytics. Amsterdam Merit Scholarship + Amsterdam Economics and Business Talent Fund.",
    deadline: "📅 15 enero",
    tags: ["europa", "stem"],
  },
  {
    id: "data-for-good",
    label: "Data",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "Data for Good Scholarship",
    institution: "MDS Program",
    description:
      "Para estudiantes apasionadas por usar ciencia de datos para el bien social: pobreza, desigualdad y políticas públicas. Requiere admisión previa al programa MDS.",
    deadline: "📅 Tras admisión al programa",
    tags: ["stem", "europa"],
  },
  {
    id: "eit-digital",
    label: "STEM · EIT",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "EIT Digital Master School",
    institution: "Europa",
    description:
      "Programas en Autonomous Systems, Cloud and Networking, Emotion AI, Embedded Systems, Fintech y Human-Computer Interaction.",
    deadline: "📅 Convocatoria anual",
    tags: ["europa", "completa", "stem"],
  },
  {
    id: "warwick",
    label: "UK",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "University of Warwick — Chancellor's International Scholarship",
    institution: "U. de Warwick · Reino Unido",
    description:
      "MSc Behavioural and Economic Science, Global Leadership, Social Science Research Methods. Complementa bien la candidatura a Chevening.",
    deadline: "📅 Convocatoria anual",
    tags: ["europa"],
  },
  {
    id: "edinburgh",
    label: "UK",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "University of Edinburgh Excellence Scholarship",
    institution: "U. de Edimburgo · Reino Unido",
    description:
      "MSc Science and Technology in Society, Sustainable Development, Social Research. Edinburgh Global Online Learning Scholarship también disponible. Deadline: mayo-junio.",
    deadline: "📅 Mayo-junio",
    tags: ["europa"],
  },
  {
    id: "ucl",
    label: "UK",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "UCL Global Master's Scholarship — £15,000",
    institution: "University College London · UK",
    description:
      "£15,000 para estudiantes internacionales de bajos ingresos para maestrías a tiempo completo. Hasta 85 becas para 2026/27. Deadline: 7 mayo 2026.",
    deadline: "📅 7 mayo 2026",
    tags: ["europa"],
  },
  {
    id: "bristol",
    label: "UK",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "University of Bristol — Think Big Scholarships",
    institution: "U. de Bristol · Reino Unido",
    description:
      "Financiamiento para estudiantes internacionales en cursos elegibles de grado y posgrado. Inicio septiembre 2026. Deadline: 10 abril 2026.",
    deadline: "📅 10 abril 2026",
    tags: ["europa"],
  },
  {
    id: "ako-lse",
    label: "UK",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "AKO Master's Scholarships — LSE",
    institution: "London School of Economics · UK",
    description:
      "2 becas completas (fees + estipendio) + 8 becas de matrícula de la AKO Foundation. Para candidatos que demuestren impacto societal en su región.",
    deadline: "📅 Convocatoria anual",
    tags: ["europa"],
  },
  {
    id: "glasgow",
    label: "UK",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "U. Glasgow — Behavioural Science Scholarship",
    institution: "U. de Glasgow · Reino Unido",
    description:
      "11 becas de matrícula completa para MSc en Behavioural Science. Disponible para internacionales. Deadline: 23 febrero 2026 y 18 mayo 2026.",
    deadline: "📅 23 feb / 18 may 2026",
    tags: ["europa"],
  },
  {
    id: "leiden-lexs",
    label: "Países Bajos",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Leiden University Excellence Scholarship (LExS)",
    institution: "U. de Leiden · Países Bajos",
    description:
      "€10,000, €15,000 o €25,000 para no-EEA. Public Administration, International Relations, Governance of Sustainability, Social Psychology. Deadline: enero-marzo.",
    deadline: "📅 Enero-marzo",
    tags: ["europa"],
  },
  {
    id: "rsm-rotterdam",
    label: "Innovación",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "RSM Erasmus Rotterdam — Excellence Award",
    institution: "Rotterdam School of Management · Países Bajos",
    description:
      "MSc Management of Innovation, Business Information Management, Strategic Management. RSM Excellence Award + Holland Scholarship disponibles.",
    deadline: "📅 Convocatoria anual",
    tags: ["europa", "stem"],
  },
  {
    id: "maastricht",
    label: "Países Bajos",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Maastricht — High Potential Scholarship",
    institution: "U. de Maastricht · Países Bajos",
    description:
      "Para candidatos fuera de la UE/EEE. GPA 7.5 o superior. Solo el 2% de solicitantes son seleccionados. Cubre gastos de vida, seguro y costos relacionados.",
    deadline: "📅 1 febrero 2026",
    tags: ["europa"],
  },
  {
    id: "bocconi",
    label: "Italia",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Bocconi University Merit Awards",
    institution: "U. Bocconi · Milán, Italia",
    description:
      "Hasta €10,000 anuales para candidatos internacionales sobresalientes. MSc International Management, Sustainability Management, Marketing Management.",
    deadline: "📅 Convocatoria anual",
    tags: ["europa"],
  },
  {
    id: "lund",
    label: "Innovación",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "Lund University Global Scholarship",
    institution: "U. de Lund · Suecia",
    description:
      "SEK 20.5 millones anuales en becas por mérito. MSc Innovation and Societal Change. Selección por rendimiento académico. Abre en febrero.",
    deadline: "📅 Abre febrero (anual)",
    tags: ["europa", "stem"],
  },
  {
    id: "ikea-sodra",
    label: "Diseño",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "Beca IKEA & Södra — Innovación y Diseño",
    institution: "Linnaeus University · Suecia",
    description:
      "4 becas anuales para MSc Innovación, Ingeniería y Diseño. Cubre 100% matrícula + 10,584 SEK/mes para gastos de vida. Se renueva automáticamente.",
    deadline: "📅 5 febrero (anual)",
    tags: ["europa", "stem"],
  },
  {
    id: "wageningen-wur",
    label: "Sostenibilidad",
    tagVariant: "stem",
    estado: "● Abierta",
    title: "Wageningen University Scholarships (WUR)",
    institution: "WUR · Países Bajos",
    description:
      "Múltiples becas para no-EEA en sostenibilidad e innovación. MSc Sustainable Development, Management Economics, Development and Rural Innovation.",
    deadline: "📅 Febrero-abril",
    tags: ["europa", "paises-bajos", "stem"],
  },
  {
    id: "educations-com",
    label: "Multi-país",
    tagVariant: "europa",
    estado: "● Abierta",
    title: "Study a Master's in Europe Scholarship — educations.com",
    institution: "Cualquier universidad europea · €5,000",
    description:
      "€5,000 para CUALQUIER maestría en Europa. Solo requiere ensayo de motivación, sin CV ni diplomas inicialmente. ¡Ideal para complementar otras becas!",
    deadline: "📅 15 mayo 2026",
    tags: ["europa"],
  },
];

export const becaFilters: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "erasmus", label: "Erasmus Mundus" },
  { value: "alemania", label: "Alemania" },
  { value: "paises-bajos", label: "Países Bajos" },
  { value: "stem", label: "STEM" },
  { value: "completa", label: "Financiada 100%" },
];
