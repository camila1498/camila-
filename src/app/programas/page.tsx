import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StarIcon from "@/components/ui/StarIcon";
import { programs } from "@/data/programs";
import styles from "@/components/programas/Programas.module.css";

export const metadata: Metadata = {
  title: "Programas — CreateLatam",
};

export default function ProgramasPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link> / Programas
          </p>
          <h1>Tres formas de aprender, en comunidad</h1>
          <p>
            Mentorías, formación y eventos — cada uno pensado para un momento distinto del camino
            de una chica hacia la tecnología y el diseño.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="wrap">
          <div className={styles.grid}>
            {programs.map((program) => (
              <Link href={`/programas/${program.slug}`} className={styles.card} key={program.slug}>
                <StarIcon fill="var(--magenta)" />
                <span className={styles.label}>{program.label}</span>
                <h3>{program.title}</h3>
                <p>{program.summary}</p>
                <span className={styles.more}>Ver programa →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
