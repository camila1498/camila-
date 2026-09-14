import { VOLUNTEER_FORM_URL } from "@/lib/constants";
import styles from "./Involved.module.css";

const roles = [
  { group: "Liderazgo", title: "Líder de Talento y Cultura" },
  { group: "Liderazgo", title: "Líder de Alianzas" },
  { group: "Liderazgo", title: "Líder de Marketing" },
  { group: "Liderazgo", title: "Líder de Bootcamp" },
  { group: "Liderazgo", title: "Líder de Mentorías" },
  { group: "Voluntariado", title: "Voluntario de Alianzas" },
  { group: "Voluntariado", title: "Voluntario de Talento" },
  { group: "Voluntariado", title: "Voluntario de Marketing" },
  { group: "Voluntariado", title: "Community Manager" },
];

export default function Involved() {
  return (
    <section className={styles.involved} id="unete">
      <div className="wrap">
        <div className={styles.box}>
          <div className={styles.intro}>
            <p className="eyebrow" style={{ color: "#FFD938" }}>
              Únete · Estamos abiertos
            </p>
            <h2>Estamos construyendo nuestra próxima etapa</h2>
            <p>
              Estamos relanzando CreateLatam con una nueva estructura. Si quieres ser parte de la
              comunidad que forma a la próxima generación de mujeres en tech, este es el momento.
            </p>
            <a
              href={VOLUNTEER_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ marginTop: 8 }}
            >
              Postula como voluntaria →
            </a>
          </div>
          <div className={styles.rolesGrid}>
            {roles.map((role) => (
              <div className={styles.roleCard} key={role.title}>
                <p className="eyebrow">{role.group}</p>
                <h3>{role.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
