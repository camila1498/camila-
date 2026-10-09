import Link from "next/link";
import SectionHead from "@/components/ui/SectionHead";
import styles from "./Beneficios.module.css";

const beneficios = [
  { icon: "🏆", title: "Reconocimiento público", text: "Reconocimiento externo e interno por tu contribución a la comunidad." },
  {
    icon: "📜",
    title: "Certificados con peso real",
    text: "Certificados validados por la SUNAJU, con respaldo oficial para tu CV.",
  },
  {
    icon: "🚀",
    title: "Desarrollo profesional",
    text: "Acceso a mentorías, capacitaciones y talleres exclusivos para voluntarios.",
  },
  {
    icon: "💼",
    title: "Posicionamiento en LinkedIn",
    text: "Te ayudamos a destacar tu experiencia en CreateLatam y potenciar tu perfil.",
  },
  {
    icon: "🌟",
    title: "Proyectos y liderazgo",
    text: "Acceso a proyectos especiales y posiciones de liderazgo dentro de la organización.",
  },
  {
    icon: "🎁",
    title: "Sistema de puntos",
    text: "Beneficios exclusivos a través de nuestro sistema de puntos para voluntarios activos.",
  },
  {
    icon: "🎓",
    title: "Acceso al Dashboard de Becas",
    text: "Acceso exclusivo a más de 38 becas internacionales filtradas — Erasmus, DAAD, OKP y más.",
  },
];

export default function Beneficios() {
  return (
    <section className={styles.section}>
      <div className="wrap">
        <SectionHead
          eyebrow="¿Por qué ser voluntaria?"
          title="Beneficios de ser parte de CreateLatam"
          description="Ser voluntaria no es solo dar — también es crecer, conectar y construir tu camino profesional."
        />
        <div className={styles.grid}>
          {beneficios.map((b) => (
            <div className={styles.card} key={b.title}>
              <div className={styles.icon}>{b.icon}</div>
              <h4>{b.title}</h4>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
        <p className={styles.cta}>
          <Link href="/unete/voluntariado" className="btn-primary">
            Quiero ser voluntaria →
          </Link>
        </p>
      </div>
    </section>
  );
}
