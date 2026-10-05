import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CoachBanner from "@/components/becas/CoachBanner";
import OportunidadesTabs from "@/components/becas/OportunidadesTabs";
import { getBecas } from "@/lib/becas";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Oportunidades — CreateLatam",
};

export const revalidate = 60;

export default async function OportunidadesPage() {
  const result = await getBecas();
  const becas = result.ok ? result.becas : [];

  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link> / Oportunidades
          </p>
          <h1>Oportunidades 🌟</h1>
          <p>
            Todas las oportunidades que vamos encontrando para la comunidad — filtradas,
            organizadas y listas para postular.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <div className={styles.num}>{result.ok ? becas.length : "—"}</div>
              <div className={styles.cap}>Oportunidades</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.num}>🌍</div>
              <div className={styles.cap}>Europa, Asia y más</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.num}>✅</div>
              <div className={styles.cap}>Actualizadas constantemente</div>
            </div>
          </div>
        </div>
      </section>

      <CoachBanner />

      <section className={styles.becasSection}>
        <div className="wrap">
          {result.ok ? (
            <OportunidadesTabs becas={becas} />
          ) : (
            <p className={styles.unavailable}>
              {result.reason === "not-configured"
                ? "Las oportunidades no están disponibles: falta configurar Supabase (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY)."
                : "No pudimos cargar las oportunidades en este momento. Inténtalo de nuevo en unos minutos."}
            </p>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
