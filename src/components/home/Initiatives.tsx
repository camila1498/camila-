import SectionHead from "@/components/ui/SectionHead";
import { initiatives } from "@/data/initiatives";
import styles from "./Initiatives.module.css";

export default function Initiatives() {
  return (
    <section className={styles.initiatives} id="iniciativas">
      <div className="wrap">
        <SectionHead
          eyebrow="Iniciativas"
          title="Dentro de CreateLatam"
          description="Programas específicos que le dan forma concreta a nuestra misión."
        />
        <div className={styles.list}>
          {initiatives.map((initiative) => (
            <div className={styles.row} key={initiative.tag}>
              <div className={styles.tag}>
                {initiative.tag}
                <span>{initiative.label}</span>
              </div>
              <p>{initiative.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
