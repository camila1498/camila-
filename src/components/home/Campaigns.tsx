import CampaignFigures from "@/components/stats/CampaignFigures";
import SectionHead from "@/components/ui/SectionHead";
import { loadPublicStats } from "@/lib/stats/load";
import styles from "./Campaigns.module.css";

/** Resultados de las convocatorias cerradas: solo aparece si el equipo publicó cifras. */
export default async function Campaigns() {
  const campaigns = await loadPublicStats();
  if (campaigns.length === 0) return null;

  return (
    <section className={styles.section} id="convocatorias">
      <div className="wrap">
        <SectionHead
          eyebrow="Convocatorias"
          title="Así respondió la comunidad"
          description="Cifras de nuestras convocatorias cerradas. Son datos agregados: no incluyen información personal."
          center
        />
        <div className={styles.list}>
          {campaigns.map((c) => (
            <article key={`${c.formSlug}-${c.publishedAt}`} className={styles.campaign}>
              <h3>{c.name}</h3>
              <CampaignFigures data={c.data} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
