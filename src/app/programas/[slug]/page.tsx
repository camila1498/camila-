import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StarIcon from "@/components/ui/StarIcon";
import { getProgram, programs } from "@/data/programs";
import styles from "@/components/programas/Programas.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgram(slug);
  return { title: program ? `${program.title} — CreateLatam` : "Programa — CreateLatam" };
}

export default async function ProgramaPage({ params }: Props) {
  const { slug } = await params;
  const program = getProgram(slug);
  if (!program) notFound();

  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link> / <Link href="/programas">Programas</Link> /{" "}
            {program.title}
          </p>
          <h1>{program.title}</h1>
          <p>{program.label}</p>
        </div>
      </section>

      <section className={styles.detail}>
        <div className={`wrap ${styles.detailInner}`}>
          <div>
            <p className={styles.desc}>{program.description}</p>
            {program.applyLabel &&
              (program.applyUrl ? (
                <a
                  href={program.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ marginTop: 28 }}
                >
                  {program.applyLabel} →
                </a>
              ) : (
                <span className={styles.soon}>{program.applyLabel}: próximamente</span>
              ))}
            <div>
              <Link href="/programas" className={`link-underline ${styles.back}`}>
                ← Ver todos los programas
              </Link>
            </div>
          </div>
          <ul className={styles.list}>
            {program.highlights.map((item) => (
              <li key={item}>
                <StarIcon fill="var(--violeta)" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </>
  );
}
