import SectionHead from "@/components/ui/SectionHead";
import { VOLUNTEER_FORM_URL } from "@/lib/constants";
import styles from "./RolesAbiertos.module.css";

const liderazgo = [
  { title: "Líder de Talento y Cultura", text: "Gestiona el equipo de voluntarios, el bienestar y la cultura interna de CreateLatam." },
  { title: "Líder de Alianzas", text: "Construye relaciones con organizaciones, escuelas e instituciones aliadas." },
  { title: "Líder de Marketing", text: "Lidera la estrategia de comunicación y presencia digital de CreateLatam." },
  { title: "Líder de Bootcamp", text: "Diseña y coordina el Create Woman Bootcamp de principio a fin." },
  { title: "Líder de Mentorías", text: "Gestiona el programa EmpleaLab y la red de mentores y mentees." },
];

const voluntariado = [
  { title: "Voluntario de Alianzas", text: "Apoya en la gestión y seguimiento de alianzas estratégicas." },
  { title: "Voluntario de Talento", text: "Apoya en la captación y onboarding de nuevos voluntarios." },
  { title: "Voluntario de Marketing", text: "Crea contenido y apoya la presencia en redes sociales." },
  { title: "Community Manager", text: "Gestiona la comunidad online de CreateLatam y su engagement." },
];

export default function RolesAbiertos() {
  return (
    <section className={styles.section}>
      <div className="wrap">
        <SectionHead
          eyebrow="Estamos buscando"
          title="Roles abiertos en CreateLatam"
          description="Estamos relanzando CreateLatam con una nueva estructura. Si quieres ser parte, postula ahora."
        />
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>🌟 Liderazgo</h3>
          <div className={styles.grid}>
            {liderazgo.map((role) => (
              <div className={styles.card} key={role.title}>
                <p className={styles.tag}>Liderazgo</p>
                <h4>{role.title}</h4>
                <p>{role.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>🤝 Voluntariado</h3>
          <div className={styles.grid}>
            {voluntariado.map((role) => (
              <div className={styles.card} key={role.title}>
                <p className={styles.tag}>Voluntariado</p>
                <h4>{role.title}</h4>
                <p>{role.text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className={styles.cta}>
          <a href={VOLUNTEER_FORM_URL} target="_blank" rel="noreferrer" className="btn-primary">
            Postula ahora →
          </a>
        </p>
      </div>
    </section>
  );
}
