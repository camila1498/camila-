import SectionHead from "@/components/ui/SectionHead";
import styles from "./Testimonials.module.css";

const testimonials = [
  {
    quote:
      "Impactó en mi desarrollo profesional gracias a las sesiones donde aprendí sobre IA, Design Thinking y más. En lo personal, mejoré mi confianza y habilidades de liderazgo — al preparar la presentación final y recibir feedback me di cuenta que tengo mucho por lo que sentirme orgullosa.",
    author: "Fabiana Andrea Lázaro Mogollón",
    role: "Participante · CreateLatam",
  },
  {
    quote:
      "En CreateLatam me enteré de un programa llamado Next al que decidí postular contando cómo trabajar en Create me había permitido adquirir conocimientos — y logré ingresar. Fue una experiencia inolvidable que me permitió confiar más en mí.",
    author: "Madelen Argote",
    role: "Participante · CreateLatam",
  },
  {
    quote:
      "CreateLatam impactó positivamente en mi desarrollo personal, me permitió descubrir oportunidades y visualizar que sí eran posibles de alcanzar. Gracias a su apoyo, tengo herramientas para mejorar mi desarrollo como persona y como profesional.",
    author: "Amirha Palacios Mucarsel",
    role: "Participante · CreateLatam",
  },
  {
    quote:
      "Pude ser aceptada en otros voluntariados, conocí más el ámbito de la IA y las oportunidades que se pueden alcanzar con solo saber qué palabras clave buscar.",
    author: "Shashenka Yammelí Arroyo Lavilla",
    role: "Participante · CreateLatam",
  },
  {
    quote:
      "Tuve la oportunidad de ser una de las 200 Embajadoras, un programa donde niñas de todo el Perú pudieron aprender y crear proyectos. A lo largo del programa aprendí cosas nuevas que no hubiera imaginado.",
    author: "Yadel Milagros Flores Flores",
    role: "Embajadora · 200 Embajadoras Perú",
  },
  {
    quote:
      "Gané una beca de liderazgo que me interesaba hace mucho tiempo. El programa y las sesiones con mi mentora me fortalecieron y empoderaron para tomar la decisión de postular a oportunidades a las que antes no me sentía preparado.",
    author: "Jeanpaul Villena",
    role: "Participante · CreateLatam",
  },
];

export default function Testimonials() {
  return (
    <section className={styles.testimonials}>
      <div className="wrap">
        <SectionHead
          eyebrow="Testimonios"
          title="Lo que dicen las chicas de CreateLatam"
          description="Historias reales de quienes pasaron por nuestros programas."
          center
        />
        <div className={styles.grid}>
          {testimonials.map((t) => (
            <div className={styles.card} key={t.author}>
              <p>&quot;{t.quote}&quot;</p>
              <div className={styles.author}>
                <strong>{t.author}</strong>
                <span>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
