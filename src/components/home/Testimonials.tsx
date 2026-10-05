"use client";

import { useEffect, useState } from "react";
import SectionHead from "@/components/ui/SectionHead";
import { testimonials } from "@/data/testimonials";
import styles from "./Testimonials.module.css";

const AUTOPLAY_MS = 8000;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = testimonials.length;

  const go = (next: number) => setIndex((next + total) % total);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, total]);

  return (
    <section className={styles.testimonials} id="testimonios">
      <div className="wrap">
        <SectionHead
          eyebrow="Testimonios"
          title="Lo que dicen las chicas de CreateLatam"
          description="Historias reales de quienes pasaron por nuestros programas."
          center
        />
        <div
          className={styles.carousel}
          role="region"
          aria-roledescription="carrusel"
          aria-label="Testimonios"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(index - 1)}
            aria-label="Testimonio anterior"
          >
            ←
          </button>
          <div className={styles.viewport}>
            <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
              {testimonials.map((t, i) => (
                <figure
                  className={styles.slide}
                  key={t.author}
                  aria-hidden={i !== index}
                  aria-label={`${i + 1} de ${total}`}
                >
                  <blockquote className={styles.card}>
                    <p>&quot;{t.quote}&quot;</p>
                    <footer className={styles.author}>
                      <strong>{t.author}</strong>
                      <span>{t.role}</span>
                    </footer>
                  </blockquote>
                </figure>
              ))}
            </div>
          </div>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(index + 1)}
            aria-label="Testimonio siguiente"
          >
            →
          </button>
        </div>
        <div className={styles.dots}>
          {testimonials.map((t, i) => (
            <button
              type="button"
              key={t.author}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => go(i)}
              aria-label={`Ir al testimonio ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
