import StarIcon from "@/components/ui/StarIcon";
import SectionHead from "@/components/ui/SectionHead";
import styles from "./ImpactStats.module.css";

const stats = [
  { num: "100+", cap: "chicas impactadas" },
  { num: "25", cap: "Voluntarios" },
  { num: "10+", cap: "speakers internacionales" },
  { num: "10,000+", cap: "postulantes globales entre los que fuimos seleccionadas" },
];

export default function ImpactStats() {
  return (
    <section className={styles.impact} id="impacto">
      <div className="wrap">
        <SectionHead
          eyebrow="Impacto"
          eyebrowColor="#FFD938"
          title="Números que cuentan la historia"
          description="Una comunidad que crece sin perder de vista a cada chica que la conforma."
          center
          light
        />
        <div className={styles.grid}>
          {stats.map((stat) => (
            <div className={styles.card} key={stat.cap}>
              <span className="star">
                <StarIcon fill="var(--amarillo)" />
              </span>
              <div className={styles.num}>{stat.num}</div>
              <div className={styles.cap}>{stat.cap}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
