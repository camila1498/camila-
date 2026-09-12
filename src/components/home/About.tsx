import StarIcon from "@/components/ui/StarIcon";
import SectionHead from "@/components/ui/SectionHead";
import styles from "./About.module.css";

export default function About() {
  return (
    <section className={styles.about} id="about">
      <div className="wrap">
        <SectionHead eyebrow="Nosotras" title="Una comunidad que cierra la brecha de género en tecnología" />
        <div className={styles.aboutGrid}>
          <div className={styles.aboutCopy}>
            <p>
              <strong>CreateLatam</strong> nació en 2024 con una misión clara: dar a jóvenes
              mujeres de toda Latinoamérica acceso gratuito a educación en inteligencia
              artificial, diseño de producto y STEM, sin importar dónde vivan o qué recursos
              tengan.
            </p>
            <p>
              Trabajamos a través de tres frentes — <strong>eventos, mentorías y programas</strong> —
              construidos y sostenidos por 25 voluntarios que creen que el talento está
              distribuido de forma pareja, aunque las oportunidades no.
            </p>
            <p>
              En 2025 fuimos seleccionadas por el Gobierno de Estados Unidos entre más de
              10,000 postulantes a nivel global, un reconocimiento a un modelo que ya muestra
              resultados: 9 de cada 10 chicas que empiezan un programa lo terminan.
            </p>
            <div className={styles.badgeRow}>
              <span className={`badge ${styles.badge}`}>
                <span className="star">
                  <StarIcon fill="#5B1BD2" />
                </span>
                Seleccionadas entre 10,000+ postulantes globales
              </span>
              <span className={`badge ${styles.badge}`}>
                <span className="star">
                  <StarIcon fill="#5B1BD2" />
                </span>
                Fundada en 2024
              </span>
            </div>
            <img
              src="https://i.imgur.com/BDiN2S1.jpeg"
              alt="Primer encuentro de CreateLatam — el equipo reunido"
              className={styles.aboutImage}
            />
          </div>
          <div className={styles.completionCard}>
            <span className="star">
              <StarIcon fill="#FFD938" />
            </span>
            <div className={styles.figure}>90%</div>
            <p className={styles.cap}>
              de finalización en nuestros programas — la comunidad se queda hasta el final.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
