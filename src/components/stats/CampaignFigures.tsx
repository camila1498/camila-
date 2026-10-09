import type { PublicData } from "@/lib/stats/types";
import styles from "./CampaignFigures.module.css";

const nf = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });
const n = (v: number) => nf.format(v);

/**
 * Cifras agregadas de una campaña cerrada: totales y desgloses ya filtrados por la base (sin datos
 * personales ni grupos pequeños). Se usa en la web y en la vista previa de la plataforma.
 */
export default function CampaignFigures({ data, tone = "light" }: { data: PublicData; tone?: "light" | "dark" }) {
  const { metrics, fields } = data;
  const cards: { num: string; cap: string }[] = [];

  if (metrics.received !== undefined && metrics.capacity !== undefined) {
    cards.push({ num: n(metrics.received), cap: `postulaciones para ${n(metrics.capacity)} cupos` });
  } else {
    if (metrics.received !== undefined) cards.push({ num: n(metrics.received), cap: "postulaciones recibidas" });
    if (metrics.capacity !== undefined) cards.push({ num: n(metrics.capacity), cap: "cupos disponibles" });
  }
  if (metrics.perSpot !== undefined) cards.push({ num: n(metrics.perSpot), cap: "postulaciones por cada cupo" });
  if (metrics.accepted !== undefined) cards.push({ num: n(metrics.accepted), cap: "personas aceptadas" });
  if (metrics.countries !== undefined) cards.push({ num: n(metrics.countries), cap: metrics.countries === 1 ? "país de origen" : "países de origen" });

  if (cards.length === 0 && fields.length === 0) return null;

  return (
    <div className={`${styles.figures} ${tone === "dark" ? styles.dark : ""}`}>
      {cards.length > 0 && (
        <div className={styles.cards}>
          {cards.map((c) => (
            <div className={styles.card} key={c.cap}>
              <div className={styles.num}>{c.num}</div>
              <div className={styles.cap}>{c.cap}</div>
            </div>
          ))}
        </div>
      )}
      {fields.length > 0 && (
        <div className={styles.breakdowns}>
          {fields.map((f) => {
            const total = f.items.reduce((sum, i) => sum + i.count, 0) || 1;
            return (
              <section key={f.id} className={styles.breakdown} aria-label={f.label}>
                <h4>{f.label}</h4>
                <ul>
                  {f.items.map((i) => {
                    const pct = Math.round((i.count / total) * 100);
                    return (
                      <li key={i.label}>
                        <span className={styles.itemLabel}>{i.label}</span>
                        <span className={styles.bar} aria-hidden="true">
                          <span style={{ width: `${pct}%` }} />
                        </span>
                        <span className={styles.pct}>{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
