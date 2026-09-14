"use client";

import { useEffect, useRef } from "react";
import SectionHead from "@/components/ui/SectionHead";
import { opportunities } from "@/data/opportunities";
import { BECAS_SESSION_KEY } from "@/lib/constants";
import styles from "./Opportunities.module.css";

type OpportunitiesProps = {
  onOpenBecas: () => void;
};

export default function Opportunities({ onOpenBecas }: OpportunitiesProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && sessionStorage.getItem(BECAS_SESSION_KEY) !== "ok") {
            onOpenBecas();
            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [onOpenBecas]);

  return (
    <section className={styles.opportunities} id="oportunidades" ref={sectionRef}>
      <div className="wrap">
        <SectionHead
          eyebrow="Oportunidades"
          title="Becas y convocatorias STEM que vamos encontrando"
          description="Filtramos solo oportunidades de ciencia, tecnología, ingeniería y matemáticas — becas, fellowships y programas para que la comunidad no se los pierda."
        />
        <div className={styles.list}>
          {opportunities.map((opp) => (
            <article className={styles.card} key={opp.title}>
              <div className={styles.top}>
                <span className={styles.tag}>{opp.tag}</span>
                <span className={styles.deadline}>{opp.meta}</span>
              </div>
              <h3>{opp.title}</h3>
              <p>{opp.description}</p>
              <span className={styles.published}>● Publicado</span>
            </article>
          ))}
        </div>
        <p className={styles.note}>
          Becas y programas STEM que vamos encontrando para la comunidad. Se actualiza a medida
          que aparecen nuevas oportunidades.
        </p>
        <p className={styles.moreLink}>
          <button
            type="button"
            onClick={onOpenBecas}
            className="link-underline"
            style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
          >
            Ver todas las becas en el dashboard →
          </button>
        </p>
      </div>
    </section>
  );
}
