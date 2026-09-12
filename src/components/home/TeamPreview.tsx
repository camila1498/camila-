import Link from "next/link";
import StarIcon from "@/components/ui/StarIcon";
import SectionHead from "@/components/ui/SectionHead";
import { teamPreview } from "@/data/team";
import styles from "./TeamPreview.module.css";

export default function TeamPreview() {
  return (
    <section className={styles.team} id="equipo">
      <div className="wrap">
        <SectionHead
          eyebrow="Voluntarios"
          title="Los voluntarios detrás de CreateLatam"
          description="25 voluntarios, repartidos en distintas áreas, sosteniendo la operación día a día."
        />
        <div className={styles.teamGrid}>
          {teamPreview.map((member) => (
            <div className={styles.teamCard} key={member.name}>
              <span className="star">
                <StarIcon />
              </span>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
        <p className={styles.moreLink}>
          <Link href="/voluntarios" className="link-underline">
            Ver a los 25 voluntarios →
          </Link>
        </p>
      </div>
    </section>
  );
}
