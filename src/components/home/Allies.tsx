import Link from "next/link";
import SectionHead from "@/components/ui/SectionHead";
import { CONTACT_EMAIL } from "@/lib/constants";
import styles from "./Allies.module.css";

const allies = ["Equipu PUCP", "Mar de Becas", "Lead UTP", "Personal Branding"];

export default function Allies() {
  return (
    <section className={styles.allies} id="aliados">
      <div className="wrap">
        <SectionHead
          eyebrow="Aliados"
          title="Organizaciones que caminan con nosotras"
          description="Instituciones y colectivos con los que construimos oportunidades para la comunidad."
          center
        />
        <div className={styles.grid}>
          {allies.map((ally) => (
            <div className={styles.slot} key={ally}>
              {ally}
            </div>
          ))}
        </div>
        <p className={styles.note}>
          ¿Tu organización, escuela o institución quiere aliarse con CreateLatam? Escríbenos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o{" "}
          <Link href="/unete/aliados">completa el formulario →</Link>
        </p>
      </div>
    </section>
  );
}
