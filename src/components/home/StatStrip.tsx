import styles from "./StatStrip.module.css";

const stats = [
  { num: "25", label: "Voluntarios" },
  { num: "10+", label: "Speakers internacionales" },
  { num: "100+", label: "Chicas impactadas" },
  { num: "90%", label: "Tasa de finalización" },
];

export default function StatStrip() {
  return (
    <div className={styles.statStrip}>
      <div className={`wrap ${styles.inner}`}>
        {stats.map((stat) => (
          <div className={styles.item} key={stat.label}>
            <span className={styles.num}>{stat.num}</span>
            <span className={styles.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
