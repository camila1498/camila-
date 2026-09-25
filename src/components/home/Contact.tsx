import { CONTACT_EMAIL } from "@/lib/constants";

export default function Contact() {
  return (
    <section className="cta-strip" id="contacto">
      <div className="wrap">
        <p className="eyebrow" style={{ color: "var(--amarillo)", marginBottom: 12 }}>
          Contacto
        </p>
        <h2>¿Tienes preguntas o quieres aliarte con nosotras?</h2>
        <p>
          Escríbenos a <strong>{CONTACT_EMAIL}</strong> y con gusto te contamos más.
        </p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="btn-primary">
          Contáctanos →
        </a>
      </div>
    </section>
  );
}
