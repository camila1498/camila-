import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BecasAccessGate from "@/components/becas/BecasAccessGate";
import CoachBanner from "@/components/becas/CoachBanner";
import OportunidadesTabs from "@/components/becas/OportunidadesTabs";
import { becas } from "@/data/becas";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Oportunidades — CreateLatam",
};

export default function BecasPage() {
  return (
    <BecasAccessGate>
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
              <div className={styles.num}>{becas.length}</div>
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
          <OportunidadesTabs />
        </div>
      </section>

      <Footer />
    </BecasAccessGate>
  );
}
