import StarIcon from "@/components/ui/StarIcon";
import type { ProgramPillar } from "@/data/programs";
import styles from "./ProgramDetail.module.css";

type ProgramDetailProps = {
  pillar: ProgramPillar;
  alt?: boolean;
};

export default function ProgramDetail({ pillar, alt }: ProgramDetailProps) {
  return (
    <section className={`${styles.detail} ${alt ? styles.alt : ""}`}>
      <div className={`wrap ${styles.inner}`}>
        <div>
          <p className={styles.num}>{pillar.num}</p>
          <span className={`star ${styles.starBig}`}>
            <StarIcon fill="var(--amarillo)" />
          </span>
          <h2>{pillar.title}</h2>
          <p className={styles.desc}>{pillar.longDescription}</p>
        </div>
        <div>
          {pillar.bullets && (
            <ul className={styles.list}>
              {pillar.bullets.map((bullet) => (
                <li key={bullet}>
                  <span className={styles.bulletStar}>
                    <StarIcon fill="var(--violeta)" />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          {pillar.subCards?.map((card) => (
            <div className={styles.subCard} key={card.tag}>
              <div className={styles.tag}>
                {card.tag}
                <span>{card.label}</span>
              </div>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
