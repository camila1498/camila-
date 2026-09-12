import { BOOTCAMP_WAITLIST_URL } from "@/lib/constants";
import styles from "./CoachBanner.module.css";

export default function CoachBanner() {
  return (
    <section className={styles.banner}>
      <div className="wrap">
        <div className={styles.inner}>
          <div>
            <p className="eyebrow" style={{ color: "var(--amarillo)", marginBottom: 8 }}>
              Próximamente
            </p>
            <h3>🤖 Coach de Becas de CreateLatam</h3>
            <p>
              Estamos construyendo un coach personalizado que te ayude a encontrar las becas
              perfectas para tu perfil, preparar tu postulación y no perderte ninguna oportunidad.
            </p>
          </div>
          <a href={BOOTCAMP_WAITLIST_URL} target="_blank" rel="noreferrer" className="btn-amarillo">
            Quiero ser la primera en saberlo →
          </a>
        </div>
      </div>
    </section>
  );
}
