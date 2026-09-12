import StarIcon from "@/components/ui/StarIcon";
import { BOOTCAMP_WAITLIST_URL } from "@/lib/constants";
import styles from "./BootcampBanner.module.css";

const roles = [
  { emoji: "🎤", title: "Speaker", text: "Comparte tu experiencia en una charla o taller puntual." },
  {
    emoji: "🌟",
    title: "Mentor(a)",
    text: "Acompaña de forma sostenida a mentees con orientación y feedback.",
  },
  { emoji: "📚", title: "Mentee", text: "Recibe la formación y el acompañamiento de los programas." },
  {
    emoji: "🤝",
    title: "Aliada",
    text: "Apoya con recursos, espacios o difusión — puede ser una escuela o institución.",
  },
];

export default function BootcampBanner() {
  return (
    <section className={styles.banner}>
      <div className="wrap">
        <div className={styles.inner}>
          <div>
            <p className="eyebrow" style={{ color: "var(--amarillo)" }}>
              Próximamente
            </p>
            <h2>Create Woman Bootcamp 💜</h2>
            <p>
              Estamos diseñando un <strong>bootcamp gratuito</strong> de formación intensiva en
              tecnología para chicas que desean aprender, crear y crecer. Puedes sumarte de
              distintas formas:
            </p>
            <div className={styles.roles}>
              {roles.map((role) => (
                <div className={styles.role} key={role.title}>
                  <span>{role.emoji}</span>
                  <div>
                    <strong>{role.title}</strong>
                    <span>{role.text}</span>
                  </div>
                </div>
              ))}
            </div>
            <a
              href={BOOTCAMP_WAITLIST_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ marginTop: 24 }}
            >
              Únete a la waitlist →
            </a>
          </div>
          <div
            className={styles.star}
            aria-hidden="true"
            style={{ position: "relative", width: 160, height: 160 }}
          >
            <div style={{ position: "absolute", top: 0, left: 0 }}>
              <StarIcon size={160} fill="rgba(255,217,56,0.15)" />
            </div>
            <div style={{ position: "absolute", top: 30, left: 30 }}>
              <StarIcon size={100} fill="rgba(255,217,56,0.2)" />
            </div>
            <div style={{ position: "absolute", top: 55, left: 55 }}>
              <StarIcon size={50} fill="#FFD938" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
