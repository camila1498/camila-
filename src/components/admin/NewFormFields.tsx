"use client";

import { useState } from "react";
import { SLUG_MAX, slugify } from "@/lib/forms/paths";
import styles from "@/app/plataforma/admin.module.css";

type NewFormFieldsProps = {
  sources: { slug: string; title: string }[];
};

/** Nombre, enlace (se propone desde el nombre mientras no se edite a mano) y plantilla de partida. */
export default function NewFormFields({ sources }: NewFormFieldsProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const shownSlug = slugTouched ? slug : slugify(title);

  return (
    <>
      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="title">Nombre del formulario</label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Inscripción al taller de IA"
        />
        <span className={styles.hint}>Es el título que verá la persona; podrás cambiarlo en el editor.</span>
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="slug">Enlace</label>
        <div className={styles.slugRow}>
          <span>/formularios/</span>
          <input
            id="slug"
            name="slug"
            required
            maxLength={SLUG_MAX}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <span className={styles.hint}>
          Solo minúsculas, números y guiones. <strong>No se puede cambiar después de publicarlo</strong>, porque es la
          dirección que compartirás.
        </span>
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="from">Punto de partida</label>
        <select id="from" name="from" defaultValue="blank">
          <option value="blank">En blanco: datos de contacto + consentimiento, y tus propias preguntas</option>
          {sources.map((s) => (
            <option key={s.slug} value={s.slug}>
              Copiar de: {s.title}
            </option>
          ))}
        </select>
        <span className={styles.hint}>
          Siempre incluye nombre, correo, teléfono, país y el consentimiento de privacidad: son obligatorios en cualquier
          formulario.
        </span>
      </div>
    </>
  );
}
