import Link from "next/link";
import StarIcon from "@/components/ui/StarIcon";
import SectionHead from "@/components/ui/SectionHead";
import { programPillars } from "@/data/programs";
import styles from "./Programs.module.css";

const pillarStarFill = ["var(--amarillo)", "var(--magenta)", "var(--violeta)"];

export default function Programs() {
  return (
    <section className={styles.programs} id="programas">
      <div className="wrap">
        <SectionHead
          eyebrow="Programas"
          title="Tres formas de aprender, en comunidad"
          description="Todo lo que hacemos se organiza alrededor de estos tres pilares, pensados para acompañar a las chicas en distintos momentos de su formación."
        />
        <div className={styles.pillarGrid}>
          {programPillars.map((pillar, index) => (
            <div className={styles.pillar} key={pillar.title}>
              <span className="star">
                <StarIcon fill={pillarStarFill[index]} />
              </span>
              <h3>{pillar.title}</h3>
              <p>{pillar.shortDescription}</p>
            </div>
          ))}
        </div>
        <p className={styles.moreLink}>
          <Link href="/programas" className="link-underline">
            Ver el detalle de cada programa →
          </Link>
        </p>
      </div>
    </section>
  );
}
