import Link from "next/link";
import { VOLUNTEER_FORM_URL } from "@/lib/constants";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} id="top">
      <div className={`wrap ${styles.wrapInner}`}>
        <div>
          <span className={styles.openBadge}>
            <span className={styles.dot}></span>
            Estamos abiertos — postulaciones activas
          </span>
          <p className={`eyebrow ${styles.heroEyebrow}`}>
            Educación gratuita en IA y diseño de producto
          </p>
          <h1>
            Formamos a las próximas <em>líderes tech</em> de Latinoamérica
          </h1>
          <p className={styles.lead}>
            CreateLatam es una organización sin fines de lucro que acerca inteligencia
            artificial, diseño de producto y STEM a jóvenes mujeres de toda la región, a
            través de eventos, mentorías y programas gratuitos.
          </p>
          <div className={styles.heroCtas}>
            <a href={VOLUNTEER_FORM_URL} target="_blank" rel="noreferrer" className="btn-primary">
              Sé voluntaria →
            </a>
            <Link href="/programas" className="btn-ghost">
              Ver programas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
